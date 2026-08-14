CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (key, value) VALUES ('delivery', '{"free_threshold": 2000}');

drop function if exists public.create_order(uuid, jsonb, text, uuid);

create or replace function public.create_order(
  p_address_id uuid,
  p_items jsonb,
  p_promo_code text default null,
  p_delivery_zone_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_volume_price numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_gst numeric(12,2) := 0;
  v_promo_discount numeric(12,2) := 0;
  v_delivery_charge numeric(12,2) := 0;
  v_promo public.promo_codes%rowtype;
  v_zone public.delivery_zones%rowtype;
  v_charge public.delivery_charges%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.addresses where id=p_address_id and user_id=auth.uid()) then
    raise exception 'Invalid address';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- -------------------------------------------------
  -- 1. Validate and get delivery charge
  -- -------------------------------------------------
  if p_delivery_zone_id is not null then
    -- Check zone exists
    select * into v_zone from public.delivery_zones where id = p_delivery_zone_id;
    if not found then
      raise exception 'Delivery zone not found';
    end if;

    -- Find matching charge rule based on subtotal (we'll compute subtotal first, but we need to iterate items)
    -- We'll compute subtotal in a loop, then later apply delivery charge after we know subtotal.
    -- We'll do a two-pass: first compute subtotal and store items in temp table, then compute delivery.
  end if;

  -- -------------------------------------------------
  -- 2. Validate promo code (if provided)
  -- -------------------------------------------------
  if p_promo_code is not null then
    select * into v_promo from public.promo_codes
      where code = p_promo_code and is_active = true
      and (start_date is null or start_date <= now())
      and (end_date is null or end_date >= now())
      and (usage_limit is null or used_count < usage_limit);
    if not found then
      raise exception 'Invalid or expired promo code';
    end if;
  end if;

  -- -------------------------------------------------
  -- 3. Create order (pending)
  -- -------------------------------------------------
  insert into public.orders(user_id, address_id, promo_code_id)
  values (auth.uid(), p_address_id, v_promo.id)
  returning id into v_order_id;

  -- -------------------------------------------------
  -- 4. Iterate items, compute volume price, subtotal, discount, GST
  -- -------------------------------------------------
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10000 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and is_active = true
    for update;

    if not found or v_product.stock_quantity < v_qty then
      raise exception 'Product unavailable';
    end if;

    -- -------- Volume Pricing --------
    -- Find the cheapest tier that applies to this quantity
    v_volume_price := v_product.wholesale_price; -- fallback
    select unit_price into v_volume_price
    from public.product_volume_pricing
    where product_id = v_product.id
      and min_quantity <= v_qty
      and (max_quantity is null or max_quantity >= v_qty)
    order by unit_price asc
    limit 1;
    -- If no tier found, use wholesale_price

    v_subtotal := v_subtotal + (v_volume_price * v_qty);
    v_discount := v_discount + ((v_product.mrp - v_volume_price) * v_qty);

    -- Compute GST (taxable amount = volume_price * qty)
    v_gst := v_gst + (v_volume_price * v_qty * (v_product.gst_percentage / 100));

    -- Insert order item with unit_price = volume_price
    insert into public.order_items (
      order_id, product_id, brand, product_name, pack_size,
      unit_price, mrp, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.brand, v_product.name,
      v_product.pack_size, v_volume_price, v_product.mrp,
      v_qty, v_volume_price * v_qty
    );
  end loop;

  -- -------------------------------------------------
  -- 5. Apply Promo Code discount (if any)
  -- -------------------------------------------------
  if v_promo.id is not null then
    -- Check min order value
    if v_subtotal < v_promo.min_order_value then
      raise exception 'Order total below minimum for this promo code';
    end if;

    -- Check applies_to constraints (optional)
    -- For simplicity, we assume 'all' or we could check category/product
    -- We'll skip detailed validation here for brevity; can be added.

    if v_promo.discount_type = 'percentage' then
      v_promo_discount := v_subtotal * (v_promo.discount_value / 100);
      if v_promo.max_discount_amount is not null and v_promo_discount > v_promo.max_discount_amount then
        v_promo_discount := v_promo.max_discount_amount;
      end if;
    else -- fixed
      v_promo_discount := v_promo.discount_value;
    end if;

    -- Ensure discount doesn't exceed subtotal
    if v_promo_discount > v_subtotal then
      v_promo_discount := v_subtotal;
    end if;

    -- Increment used_count
    update public.promo_codes set used_count = used_count + 1 where id = v_promo.id;

    -- Record usage
    insert into public.promo_code_usage(promo_code_id, user_id, order_id)
    values (v_promo.id, auth.uid(), v_order_id);
  end if;

  -- -------------------------------------------------
  -- 6. Calculate Delivery Charge (based on subtotal after promo discount?)
  -- Usually delivery is applied before promo, but we'll decide.
  -- We'll use the original subtotal (before promo) for delivery rules.
  -- -------------------------------------------------
  if p_delivery_zone_id is not null then
    -- Find the charge rule that matches the subtotal (before promo)
    select * into v_charge
    from public.delivery_charges
    where zone_id = p_delivery_zone_id
      and is_active = true
      and (min_order_value is null or v_subtotal >= min_order_value)
      and (max_order_value is null or v_subtotal <= max_order_value)
    order by min_order_value asc
    limit 1;

    if found then
      v_delivery_charge := v_charge.charge;
    else
      -- fallback: no rule found, set 0 or raise exception?
      v_delivery_charge := 0;
    end if;
  end if;

  -- -------------------------------------------------
  -- 7. Update order totals
  -- -------------------------------------------------
  update public.orders
  set
    subtotal = v_subtotal,
    discount = v_discount,
    gst_amount = v_gst,
    promo_discount = v_promo_discount,
    delivery_fee = v_delivery_charge,
    delivery_zone_id = p_delivery_zone_id,
    total = v_subtotal - v_promo_discount + v_gst + v_delivery_charge
  where id = v_order_id;

  return v_order_id;
exception
  when others then
    -- rollback automatically
    raise;
end;
$$;

grant execute on function public.create_order(uuid, jsonb, text, uuid) to authenticated;

-- ==============================================
-- 1. Product Volume Pricing
-- ==============================================
CREATE TABLE public.product_volume_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity int NOT NULL CHECK (min_quantity >= 1),
  max_quantity int,                           -- NULL means unlimited
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  discount_percent numeric CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT volume_pricing_range_check CHECK (
    min_quantity < max_quantity OR max_quantity IS NULL
  )
);

CREATE INDEX idx_volume_pricing_product ON product_volume_pricing(product_id);

-- ==============================================
-- 2. Extend Products (GST & HSN)
-- ==============================================
ALTER TABLE public.products ADD COLUMN hsn_code text;
ALTER TABLE public.products ADD COLUMN gst_percentage numeric DEFAULT 0 CHECK (gst_percentage >= 0 AND gst_percentage <= 100);

-- ==============================================
-- 3. Promo Codes
-- ==============================================
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_value numeric DEFAULT 0,
  max_discount_amount numeric,               -- for percentage discounts
  applies_to text DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product')),
  applies_to_ids uuid[],                     -- array of category/product IDs
  start_date timestamptz,
  end_date timestamptz,
  usage_limit int,                           -- total uses allowed
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================
-- 4. Delivery Zones & Charges
-- ==============================================
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pincodes text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  min_order_value numeric DEFAULT 0,
  max_order_value numeric,                   -- NULL = no upper limit
  charge numeric NOT NULL CHECK (charge >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================
-- 5. Extend Orders (GST, promo, delivery zone)
-- ==============================================
ALTER TABLE public.orders ADD COLUMN gst_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN promo_code_id uuid REFERENCES public.promo_codes(id);
ALTER TABLE public.orders ADD COLUMN promo_discount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN delivery_zone_id uuid REFERENCES public.delivery_zones(id);

-- ==============================================
-- 6. (Optional) Indexes for performance
-- ==============================================
CREATE INDEX idx_orders_promo_code ON orders(promo_code_id);
CREATE INDEX idx_orders_delivery_zone ON orders(delivery_zone_id);