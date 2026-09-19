-- ================================================================
-- BUSINESS BILLING ADDRESS + ORDER BILLING SNAPSHOT
-- Run in Supabase SQL editor.
-- ================================================================

-- 1. Add address columns to businesses
alter table public.businesses
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists landmark text,
  add column if not exists pincode text;

-- 2. Drop existing create_order (5-param) so we can replace it cleanly
drop function if exists public.create_order(uuid, jsonb, text, uuid, uuid);
drop function if exists public.create_order(uuid, jsonb, text, uuid);
drop function if exists public.create_order(uuid, jsonb);

-- 3. New create_order that writes both delivery_address_snapshot AND
--    billing_address_snapshot (built from the selected business)
create or replace function public.create_order(
  p_address_id uuid,
  p_items jsonb,
  p_promo_code text default null,
  p_delivery_zone_id uuid default null,
  p_business_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
DECLARE
  v_order_id UUID;
  v_user_id UUID;
  v_subtotal NUMERIC;
  v_discount NUMERIC := 0;
  v_delivery_fee NUMERIC := 0;
  v_total NUMERIC;
  v_promo_id UUID;
  v_discount_type TEXT;
  v_discount_value NUMERIC;
  v_min_order_value NUMERIC;
  v_max_discount_amount NUMERIC;
  v_gst_total NUMERIC := 0;
  v_discount_ratio NUMERIC := 0;
  v_pincode TEXT;
  v_zone_id UUID;
  v_charge NUMERIC;
  v_business_snapshot JSONB := NULL;
  v_delivery_address_snapshot JSONB := NULL;
  v_billing_address_snapshot JSONB := NULL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delivery address snapshot + pincode capture
  SELECT
    jsonb_build_object(
      'id', a.id,
      'label', a.label,
      'recipient_name', a.recipient_name,
      'phone', a.phone,
      'line1', a.line1,
      'line2', a.line2,
      'city', a.city,
      'state', a.state,
      'postal_code', a.postal_code,
      'latitude', a.latitude,
      'longitude', a.longitude,
      'place_id', a.place_id
    ),
    a.postal_code
  INTO v_delivery_address_snapshot, v_pincode
  FROM addresses a
  WHERE a.id = p_address_id AND a.user_id = v_user_id;

  IF v_pincode IS NULL THEN
    RAISE EXCEPTION 'Invalid address: address not found or does not belong to user';
  END IF;

  -- Business snapshot + billing address snapshot
  IF p_business_id IS NOT NULL THEN
    SELECT
      jsonb_build_object(
        'id', b.id,
        'business_name', b.business_name,
        'business_type', b.business_type,
        'gst_registered', b.gst_registered,
        'gstin', b.gstin,
        'gst_verification_status', b.gst_verification_status,
        'address_line_1', b.address_line_1,
        'address_line_2', b.address_line_2,
        'city', b.city,
        'state', b.state,
        'landmark', b.landmark,
        'pincode', b.pincode
      ),
      jsonb_build_object(
        'business_name', b.business_name,
        'gstin', b.gstin,
        'address_line_1', b.address_line_1,
        'address_line_2', b.address_line_2,
        'city', b.city,
        'state', b.state,
        'landmark', b.landmark,
        'pincode', b.pincode
      )
    INTO v_business_snapshot, v_billing_address_snapshot
    FROM businesses b
    WHERE b.id = p_business_id AND b.owner_user_id = v_user_id;

    IF v_business_snapshot IS NULL THEN
      RAISE EXCEPTION 'Invalid business: business not found or does not belong to user';
    END IF;
  END IF;

  WITH item_pricing AS (
    SELECT
      i.product_id,
      i.quantity,
      p.wholesale_price,
      p.gst_percentage,
      p.product_code,
      COALESCE(
        (SELECT unit_price
         FROM product_volume_pricing vp
         WHERE vp.product_id = p.id
           AND i.quantity >= vp.min_quantity
           AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
         ORDER BY vp.unit_price ASC
         LIMIT 1),
        p.wholesale_price
      ) AS effective_price
    FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
    JOIN products p ON p.id = i.product_id
    WHERE p.is_active = true
  )
  SELECT
    SUM(effective_price * quantity),
    SUM(effective_price * quantity * (gst_percentage / 100))
  INTO v_subtotal, v_gst_total
  FROM item_pricing;

  IF v_subtotal IS NULL OR v_subtotal = 0 THEN
    RAISE EXCEPTION 'No valid items or all items are inactive';
  END IF;

  SELECT charge, zone_id INTO v_charge, v_zone_id
  FROM get_delivery_charge(v_pincode, v_subtotal);

  IF v_charge IS NOT NULL THEN
    v_delivery_fee := v_charge;
    IF p_delivery_zone_id IS NULL AND v_zone_id IS NOT NULL THEN
      p_delivery_zone_id := v_zone_id;
    END IF;
  END IF;

  IF p_promo_code IS NOT NULL THEN
    SELECT
      id, discount_type, discount_value, min_order_value, max_discount_amount
    INTO
      v_promo_id, v_discount_type, v_discount_value, v_min_order_value, v_max_discount_amount
    FROM promo_codes
    WHERE code = UPPER(p_promo_code)
      AND is_active = true
      AND (start_date IS NULL OR start_date <= now())
      AND (end_date IS NULL OR end_date >= now())
      AND (usage_limit IS NULL OR used_count < usage_limit);

    IF v_promo_id IS NOT NULL AND v_subtotal >= v_min_order_value THEN
      IF v_discount_type = 'percentage' THEN
        v_discount := v_subtotal * (v_discount_value / 100);
        IF v_max_discount_amount IS NOT NULL AND v_discount > v_max_discount_amount THEN
          v_discount := v_max_discount_amount;
        END IF;
      ELSE
        v_discount := v_discount_value;
      END IF;
      IF v_discount > v_subtotal THEN
        v_discount := v_subtotal;
      END IF;
    END IF;
  END IF;

  IF v_discount > 0 AND v_subtotal > 0 THEN
    v_discount_ratio := v_discount / v_subtotal;
    v_gst_total := v_gst_total * (1 - v_discount_ratio);
  END IF;

  v_total := v_subtotal - v_discount + v_delivery_fee + v_gst_total;

  INSERT INTO orders (
    user_id, address_id, status, subtotal, discount, delivery_fee, total,
    promo_code_id, delivery_zone_id, order_number,
    gst_amount, cgst_amount, sgst_amount,
    business_snapshot,
    delivery_address_snapshot,
    billing_address_snapshot
  )
  VALUES (
    v_user_id, p_address_id, 'pending', v_subtotal, v_discount, v_delivery_fee, v_total,
    v_promo_id, p_delivery_zone_id,
    'SK-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_gst_total, v_gst_total / 2, v_gst_total / 2,
    v_business_snapshot,
    v_delivery_address_snapshot,
    v_billing_address_snapshot
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (
    order_id, product_id, brand, product_name, pack_size,
    unit_price, mrp, quantity, line_total,
    hsn_code, gst_percentage, product_code
  )
  SELECT
    v_order_id, p.id, p.brand, p.name, p.pack_size,
    COALESCE(
      (SELECT unit_price FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC LIMIT 1),
      p.wholesale_price
    ),
    p.mrp, i.quantity,
    COALESCE(
      (SELECT unit_price FROM product_volume_pricing vp
       WHERE vp.product_id = p.id
         AND i.quantity >= vp.min_quantity
         AND (vp.max_quantity IS NULL OR i.quantity <= vp.max_quantity)
       ORDER BY vp.unit_price ASC LIMIT 1),
      p.wholesale_price
    ) * i.quantity,
    p.hsn_code, p.gst_percentage, p.product_code
  FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
  JOIN products p ON p.id = i.product_id
  WHERE p.is_active = true;

  RETURN v_order_id;
END;
$function$;

-- 3. Rewrite get_paginated_warehouse_orders to prefer snapshot,
--    fall back to live address for legacy orders.
create or replace function public.get_paginated_warehouse_orders(
  p_status text default 'all',
  p_page integer default 1,
  p_page_size integer default 12,
  p_search text default '',
  p_sort_field text default 'created_at',
  p_sort_dir text default 'desc'
)
returns json
language plpgsql
security definer
set search_path = public
as $function$
DECLARE
  v_offset INT;
  v_total INT;
  v_result JSON;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(o.id) INTO v_total
  FROM orders o
  LEFT JOIN addresses a ON o.address_id = a.id
  WHERE
    (
      (p_status = 'all' AND o.status::text IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery')) OR
      (p_status = 'assign_partner' AND o.status::text = 'packed') OR
      (o.status::text = p_status)
    )
    AND (
      p_search = '' OR
      o.order_number ILIKE '%' || p_search || '%' OR
      a.recipient_name ILIKE '%' || p_search || '%' OR
      (o.delivery_address_snapshot->>'recipient_name') ILIKE '%' || p_search || '%'
    );

  SELECT json_build_object(
    'total', v_total,
    'orders', COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT
      o.*,
      COALESCE(o.delivery_address_snapshot::json, row_to_json(a)) as address_obj,
      (SELECT json_agg(row_to_json(p)) FROM payments p WHERE p.order_id = o.id) as payments_arr,
      (SELECT row_to_json(da) FROM delivery_assignments da WHERE da.order_id = o.id) as assignment_obj
    FROM orders o
    LEFT JOIN addresses a ON o.address_id = a.id
    WHERE
      (
        (p_status = 'all' AND o.status::text IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery')) OR
        (p_status = 'assign_partner' AND o.status::text = 'packed') OR
        (o.status::text = p_status)
      )
      AND (
        p_search = '' OR
        o.order_number ILIKE '%' || p_search || '%' OR
        a.recipient_name ILIKE '%' || p_search || '%' OR
        (o.delivery_address_snapshot->>'recipient_name') ILIKE '%' || p_search || '%'
      )
    ORDER BY
      CASE WHEN p_sort_field = 'created_at' AND p_sort_dir = 'asc' THEN o.created_at END ASC,
      CASE WHEN p_sort_field = 'created_at' AND p_sort_dir = 'desc' THEN o.created_at END DESC,
      CASE WHEN p_sort_field = 'updated_at' AND p_sort_dir = 'asc' THEN o.updated_at END ASC,
      CASE WHEN p_sort_field = 'updated_at' AND p_sort_dir = 'desc' THEN o.updated_at END DESC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$function$;



-- ================================================================
-- DISPATCH RADIUS + NEARBY ORDERS + BATCH DRIVER ASSIGNMENT
-- Run in Supabase SQL editor.
-- ================================================================

-- 1. Seed default radius into app_settings (2 km)
insert into public.app_settings (key, value)
values ('dispatch_radius_km', '{"km": 2}'::jsonb)
on conflict (key) do nothing;

-- 2. Get nearby packed/confirmed orders around a reference order
create or replace function public.get_nearby_packed_orders(
  p_reference_order_id uuid,
  p_radius_km numeric default null
)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_ref_lat numeric;
  v_ref_lng numeric;
  v_radius numeric;
  v_result json;
begin
  -- Resolve radius: explicit value > app_settings > 2km default
  if p_radius_km is null then
    select coalesce((value->>'km')::numeric, 2)
    into v_radius
    from app_settings
    where key = 'dispatch_radius_km'
    limit 1;

    if v_radius is null then
      v_radius := 2;
    end if;
  else
    v_radius := p_radius_km;
  end if;

  -- Resolve the reference order's coordinates (snapshot first, live fallback)
  select
    coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude),
    coalesce((o.delivery_address_snapshot->>'longitude')::numeric, a.longitude)
  into v_ref_lat, v_ref_lng
  from orders o
  left join addresses a on o.address_id = a.id
  where o.id = p_reference_order_id;

  if v_ref_lat is null or v_ref_lng is null then
    return json_build_object('radius_km', v_radius, 'orders', '[]'::json);
  end if;

  select json_build_object(
    'radius_km', v_radius,
    'orders', coalesce(json_agg(row_to_json(sub)), '[]'::json)
  )
  into v_result
  from (
    select
      o.id,
      o.order_number,
      o.status::text as status,
      o.total,
      o.created_at,
      o.address_id,
      coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude) as latitude,
      coalesce((o.delivery_address_snapshot->>'longitude')::numeric, a.longitude) as longitude,
      coalesce(o.delivery_address_snapshot->>'recipient_name', a.recipient_name) as recipient_name,
      coalesce(o.delivery_address_snapshot->>'line1', a.line1) as line1,
      coalesce(o.delivery_address_snapshot->>'city', a.city) as city,
      coalesce(o.delivery_address_snapshot->>'postal_code', a.postal_code) as postal_code,
      round(
        (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(v_ref_lat)) *
              cos(radians(coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude))) *
              cos(radians(coalesce((o.delivery_address_snapshot->>'longitude')::numeric, a.longitude)) - radians(v_ref_lng)) +
              sin(radians(v_ref_lat)) *
              sin(radians(coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude)))
            ))
          )
        )::numeric,
        2
      ) as distance_km
    from orders o
    left join addresses a on o.address_id = a.id
    where
      o.id <> p_reference_order_id
      and o.status::text in ('pending', 'confirmed', 'packed', 'ready_for_pickup')
      and coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude) is not null
      and coalesce((o.delivery_address_snapshot->>'longitude')::numeric, a.longitude) is not null
      and (
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(v_ref_lat)) *
            cos(radians(coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude))) *
            cos(radians(coalesce((o.delivery_address_snapshot->>'longitude')::numeric, a.longitude)) - radians(v_ref_lng)) +
            sin(radians(v_ref_lat)) *
            sin(radians(coalesce((o.delivery_address_snapshot->>'latitude')::numeric, a.latitude)))
          ))
        )
      ) <= v_radius
    order by distance_km asc
    limit 50
  ) sub;

  return v_result;
end;
$function$;

-- 3. Batch assign driver to multiple orders
--    Only orders in 'packed' or 'ready_for_pickup' status can be assigned.
--    Returns a report: { assigned: [...], skipped: [{order_id, reason}] }
create or replace function public.assign_driver_batch(
  p_order_ids uuid[],
  p_driver_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order_id uuid;
  v_status text;
  v_existing_id uuid;
  v_assigned uuid[] := '{}';
  v_skipped jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_order_ids is null or array_length(p_order_ids, 1) is null or array_length(p_order_ids, 1) = 0 then
    raise exception 'No order ids provided';
  end if;

  if p_driver_id is null then
    raise exception 'Driver id required';
  end if;

  foreach v_order_id in array p_order_ids loop
    begin
      -- Only packed or ready_for_pickup orders can receive a driver
      select status::text into v_status from orders where id = v_order_id;

      if v_status is null then
        v_skipped := v_skipped || jsonb_build_object('order_id', v_order_id, 'reason', 'Order not found');
        continue;
      end if;

      if v_status not in ('packed', 'ready_for_pickup') then
        v_skipped := v_skipped || jsonb_build_object('order_id', v_order_id, 'reason', format('Order is %s, not packed', v_status));
        continue;
      end if;

      -- Upsert assignment
      select id into v_existing_id from delivery_assignments where order_id = v_order_id limit 1;

      if v_existing_id is not null then
        update delivery_assignments
        set delivery_partner_id = p_driver_id,
            status = 'ready_for_pickup',
            updated_at = now()
        where id = v_existing_id;
      else
        insert into delivery_assignments (order_id, delivery_partner_id, status)
        values (v_order_id, p_driver_id, 'ready_for_pickup');
      end if;

      update orders
      set status = 'ready_for_pickup',
          updated_at = now()
      where id = v_order_id;

      v_assigned := array_append(v_assigned, v_order_id);
    exception when others then
      v_skipped := v_skipped || jsonb_build_object('order_id', v_order_id, 'reason', sqlerrm);
    end;
  end loop;

  return json_build_object(
    'assigned', coalesce(to_json(v_assigned), '[]'::json),
    'skipped', v_skipped,
    'total_assigned', coalesce(array_length(v_assigned, 1), 0),
    'total_skipped', jsonb_array_length(v_skipped)
  );
end;
$function$;