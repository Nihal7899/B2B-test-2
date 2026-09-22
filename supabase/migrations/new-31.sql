-- ============================================================
-- FAQS TABLE
-- ============================================================
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general'::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_faqs_active_order ON public.faqs(is_active, category, sort_order);

-- ============================================================
-- SEED FAQs (B2B wholesale focused)
-- ============================================================
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
-- Order action FAQs (only shown when navigating from order details)
('I want to cancel this order', 'Once an order is confirmed, cancellation may not always be possible. Contact our support team immediately — if the order has not yet been dispatched, we will try our best to cancel it. If it is already out for delivery, you may refuse delivery at your doorstep.', 'order_action', 1),
('I need to change my delivery address', 'Delivery address cannot be changed from the app after the order is placed. Please contact support immediately — if the order has not been dispatched yet, we can attempt to update the address. Otherwise you may cancel and re-order.', 'order_action', 2),
('When will this order be delivered?', 'Standard delivery takes 24–72 hours depending on your location. You can see the live progress on the order status timeline. For urgent deliveries, please contact support.', 'order_action', 3),
('I want to update items in this order', 'Order items cannot be modified once the order is placed. Please cancel the current order and place a fresh order with the updated items. Contact support if you need help.', 'order_action', 4),

-- Orders & Returns
('How do I track my order status?', 'Open the "Order History" from your Account screen and tap on the order. You will see a live status timeline showing each stage: placed, confirmed, packed, ready for pickup, out for delivery, and delivered.', 'orders', 10),
('Can I cancel my order after placing it?', 'Yes, you can cancel before the order is dispatched. Open the order from Order History and tap "Need help with this order?" to reach our support team. If already dispatched, you may refuse delivery at the doorstep.', 'orders', 11),
('What is your return and replacement policy?', 'Damaged or defective products must be reported within 24 hours of delivery. We will arrange a replacement or refund after verification. Perishable items are not returnable once accepted at delivery.', 'orders', 12),
('Can I reorder the same items again?', 'Yes! Open Order History, tap any previous order, and use the reorder option. The same items will be added to your cart with current pricing.', 'orders', 13),

-- Delivery
('How long does delivery take?', 'Orders are typically delivered within 24–72 hours depending on your location. Metro cities usually receive within 24 hours; remote areas may take up to 3 business days.', 'delivery', 20),
('What are the delivery charges?', 'Delivery charges depend on your pincode and order value. Orders above the free-delivery threshold are delivered at no extra cost. The exact delivery fee is always shown at checkout before you pay.', 'delivery', 21),
('Do you deliver on weekends and holidays?', 'Yes, we deliver on Saturdays and Sundays in most serviceable areas. Deliveries may be delayed on major public holidays.', 'delivery', 22),
('Can I schedule delivery for a future date?', 'Currently we deliver on the earliest available slot. If you need a specific date, please mention it in the order notes or contact support after placing the order.', 'delivery', 23),

-- Payments & Refunds
('What payment methods do you accept?', 'We accept UPI, credit/debit cards, net banking, and prepaid wallet payments online. Cash on Delivery (COD) is available for eligible pincodes and order values.', 'payments', 30),
('Is Cash on Delivery available?', 'Yes, COD is available for most pincodes. The maximum COD order value may be limited based on your region. You can see COD availability at checkout once you select the delivery address.', 'payments', 31),
('How do I get a refund for a cancelled order?', 'Refunds for online payments are processed within 5–7 business days to the original payment method. Wallet payments are credited instantly to your B2B Wallet.', 'payments', 32),

-- Business & GST
('How do I get a GST invoice for my purchase?', 'Enter your GSTIN while registering your business or at checkout. A GST-compliant tax invoice is automatically generated and available for download from Order History → any order → Print/Save Bill.', 'business', 40),
('How do I register my business for GST benefits?', 'Go to Account → My Businesses → Add Business. Enter your business details and GSTIN. After verification, all future orders will be billed with GST and you will receive tax invoices automatically.', 'business', 41),
('Do you offer bulk / wholesale pricing?', 'Yes. Many products have volume-based pricing tiers — the price per unit reduces as your order quantity increases. The applicable tier is automatically applied in your cart.', 'business', 42),
('What is the minimum order quantity (MOQ)?', 'Each product has a minimum order quantity displayed on its detail page. You must order at least that quantity to place the order.', 'business', 43);