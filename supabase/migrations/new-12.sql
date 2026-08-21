CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,   -- e.g. "orders", "promotions"
  name TEXT NOT NULL,                -- display name, e.g. "Orders"
  description TEXT,                  -- optional
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add small_icon column
ALTER TABLE notification_channels
ADD COLUMN small_icon TEXT;

-- (Optional) You can also add an index if you query by it often

ALTER TABLE trusted_brands
ADD COLUMN primary_color VARCHAR(20) DEFAULT '#3B82F6',
ADD COLUMN secondary_color VARCHAR(20) DEFAULT '#1E40AF',
ADD COLUMN product_images JSONB DEFAULT '[]';