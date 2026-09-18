CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at);
CREATE OR REPLACE FUNCTION get_paginated_warehouse_orders(
  p_status TEXT DEFAULT 'all',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 12,
  p_search TEXT DEFAULT '',
  p_sort_field TEXT DEFAULT 'created_at',
  p_sort_dir TEXT DEFAULT 'desc'
)
RETURNS JSON AS $$
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
      (p_status = 'all' AND o.status IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery')) OR
      (p_status = 'assign_partner' AND o.status = 'packed') OR
      (o.status = p_status)
    )
    AND (
      p_search = '' OR 
      o.order_number ILIKE '%' || p_search || '%' OR 
      a.recipient_name ILIKE '%' || p_search || '%'
    );

  SELECT json_build_object(
    'total', v_total,
    'orders', COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT 
      o.*,
      row_to_json(a) as address_obj,
      (SELECT json_agg(row_to_json(p)) FROM payments p WHERE p.order_id = o.id) as payments_arr,
      (SELECT row_to_json(da) FROM delivery_assignments da WHERE da.order_id = o.id) as assignment_obj
    FROM orders o
    LEFT JOIN addresses a ON o.address_id = a.id
    WHERE 
      (
        (p_status = 'all' AND o.status IN ('pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery')) OR
        (p_status = 'assign_partner' AND o.status = 'packed') OR
        (o.status = p_status)
      )
      AND (
        p_search = '' OR 
        o.order_number ILIKE '%' || p_search || '%' OR 
        a.recipient_name ILIKE '%' || p_search || '%'
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
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION get_paginated_invoices(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_search TEXT DEFAULT '',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 12,
  p_sort_field TEXT DEFAULT 'created_at'
)
RETURNS JSON AS $$
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
    (p_start_date IS NULL OR (p_sort_field = 'created_at' AND o.created_at >= p_start_date) OR (p_sort_field = 'updated_at' AND o.updated_at >= p_start_date))
    AND (p_end_date IS NULL OR (p_sort_field = 'created_at' AND o.created_at <= p_end_date) OR (p_sort_field = 'updated_at' AND o.updated_at <= p_end_date))
    AND (
      p_search = '' OR 
      o.order_number ILIKE '%' || p_search || '%' OR 
      a.recipient_name ILIKE '%' || p_search || '%'
    );

  SELECT json_build_object(
    'total', v_total,
    'orders', COALESCE(json_agg(row_to_json(sub)), '[]'::json)
  ) INTO v_result
  FROM (
    SELECT 
      o.*,
      row_to_json(a) as address_obj,
      (SELECT json_agg(row_to_json(p)) FROM payments p WHERE p.order_id = o.id) as payments_arr
    FROM orders o
    LEFT JOIN addresses a ON o.address_id = a.id
    WHERE 
      (p_start_date IS NULL OR (p_sort_field = 'created_at' AND o.created_at >= p_start_date) OR (p_sort_field = 'updated_at' AND o.updated_at >= p_start_date))
      AND (p_end_date IS NULL OR (p_sort_field = 'created_at' AND o.created_at <= p_end_date) OR (p_sort_field = 'updated_at' AND o.updated_at <= p_end_date))
      AND (
        p_search = '' OR 
        o.order_number ILIKE '%' || p_search || '%' OR 
        a.recipient_name ILIKE '%' || p_search || '%'
      )
    ORDER BY 
      CASE WHEN p_sort_field = 'created_at' THEN o.created_at END DESC,
      CASE WHEN p_sort_field = 'updated_at' THEN o.updated_at END DESC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
