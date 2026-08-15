-- Add HSN and GST% to order_items (so we have them for billing)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_percentage numeric DEFAULT 0;

-- Invoice configuration (company info, bank, terms)
CREATE TABLE IF NOT EXISTS invoice_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  company_address text,
  company_gst text,
  company_phone text,
  company_email text,
  company_logo text,
  bank_name text,
  bank_account text,
  bank_ifsc text,
  terms_conditions text,
  primary_color text DEFAULT '#1d4ed8',
  color_opacity numeric DEFAULT 1,
  first_page_rows integer,
  next_page_rows integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice design settings (JSON)
CREATE TABLE IF NOT EXISTS invoice_design (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default design (optional)
INSERT INTO invoice_design (id, settings) VALUES (
  gen_random_uuid(),
  '{
    "gstFont": "medium",
    "headerText": "TAX INVOICE",
    "footerText": "Thank you for your business!",
    "showLogo": true,
    "showBankDetails": true,
    "invoiceLayout": "professional",
    "gstTemplate": "template1",
    "primaryColor": "#1d4ed8",
    "colorOpacity": 1,
    "firstPageRows": null,
    "nextPageRows": null,
    "showAuthorisedSignature": true,
    "showReceiverSignature": true,
    "gstPrintMode": "sliced"
  }'
) ON CONFLICT DO NOTHING;