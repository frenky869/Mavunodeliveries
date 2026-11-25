-- Realistic Seed Data for Mavuno Direct PostgreSQL Database
-- Replace placeholder password_hash values via your server auth utility before production use.

INSERT INTO users (id, full_name, email, password_hash, phone, default_address, role)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Amina Wanjiku',
    'amina.customer@example.com',
    '$scrypt$n=16384,r=8,p=1$demo-salt$replace-with-runtime-hash',
    '+254 712 345 678',
    'Juja Town Market Stall 14, Kiambu County',
    'customer'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'David Ochieng',
    'dispatcher@example.com',
    '$scrypt$n=16384,r=8,p=1$demo-salt$replace-with-runtime-hash',
    '+254 722 100 200',
    'Nairobi Industrial Area Central Depot',
    'admin'
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO commodities (
  id, sku, name, category, description, unit_label, unit_price, currency,
  stock_quantity, low_stock_threshold, origin, image_url, is_active
)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'GRN-MZE-50KG', 'Grade 1 Dry White Maize', 'Grains & Cereals', 'Sun-dried, machine-cleaned white maize kernels for posho milling and wholesale supply.', '50kg bag', 3450.00, 'KES', 48, 12, 'Trans-Nzoia, Kitale', '/src/assets/images/commodity_maize_grain_1795601314397.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'GRN-YMZ-25KG', 'Whole Yellow Maize Grain', 'Grains & Cereals', 'High-carotenoid dried yellow maize screened to 12.5% moisture.', '25kg bag', 1850.00, 'KES', 9, 10, 'Uasin Gishu, Eldoret', '/src/assets/images/commodity_maize_grain_1795601314397.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'GRN-RCE-25KG', 'Mwea Pishori Aromatic Rice', 'Grains & Cereals', 'Pure long-grain aromatic Pishori rice harvested from irrigated paddies.', '25kg bag', 4650.00, 'KES', 34, 8, 'Kirinyaga, Mwea', '/src/assets/images/commodity_pishori_rice_1795601314668.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'PLS-RSC-50KG', 'Nyota & Rosecoco Red Beans', 'Pulses & Legumes', 'Fresh-season speckled rosecoco beans prized for fast cooking time.', '50kg bag', 6800.00, 'KES', 22, 8, 'Meru & Embu Highlands', '/src/assets/images/commodity_beans_pulses_1795601314512.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'PLS-YLB-1KG', 'Single-Origin Yellow Beans', 'Pulses & Legumes', 'Gentle-digesting yellow beans packed in 1kg pantry portions.', 'per kg', 240.00, 'KES', 0, 15, 'Nakuru Basin', '/src/assets/images/commodity_beans_pulses_1795601314512.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000006', 'SGR-BRN-50KG', 'Unrefined Brown Cane Sugar', 'Sugar & Sweeteners', 'Coarse golden-brown cane sugar milled locally with moisture-barrier lining.', '50kg bag', 6450.00, 'KES', 29, 6, 'Kakamega, Mumias', '/src/assets/images/commodity_cane_sugar_1795601315533.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000007', 'OIL-SUN-5L', 'Pure Refined Sunflower Oil', 'Oils & Pantry', 'Cholesterol-free, triple-filtered sunflower cooking oil in a 5L jerrycan.', '5L jerrycan', 1480.00, 'KES', 41, 10, 'Thika Refinery', '/src/assets/images/commodity_cooking_oil_1795601315949.jpg', TRUE)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (
  id, order_reference, user_id, delivery_phone, delivery_address, delivery_notes,
  status, subtotal_amount, delivery_fee, total_amount, currency
)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'MVN-2026-1042',
  '11111111-1111-1111-1111-111111111111',
  '+254 712 345 678',
  'Juja Town Market Stall 14, Kiambu County',
  'Call gate security upon truck arrival.',
  'In Transit',
  15180.00,
  0.00,
  15180.00,
  'KES'
)
ON CONFLICT (order_reference) DO NOTHING;

INSERT INTO order_items (order_id, commodity_id, commodity_name, unit_label, quantity, unit_price, line_total)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001', id, name, unit_label, 2, unit_price, unit_price * 2
FROM commodities WHERE sku = 'GRN-MZE-50KG';

INSERT INTO order_items (order_id, commodity_id, commodity_name, unit_label, quantity, unit_price, line_total)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001', id, name, unit_label, 1, unit_price, unit_price
FROM commodities WHERE sku = 'PLS-RSC-50KG';

INSERT INTO order_items (order_id, commodity_id, commodity_name, unit_label, quantity, unit_price, line_total)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001', id, name, unit_label, 1, unit_price, unit_price
FROM commodities WHERE sku = 'OIL-SUN-5L';

INSERT INTO delivery_tracking (order_id, status, location, notes, updated_by)
VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Order Placed', 'Nairobi Central Fulfillment Hub', 'Order confirmed and warehouse inventory allocated.', 'System Checkout'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Packed & Ready', 'Industrial Area Bay 4, Nairobi', 'Moisture-checked sacks sealed, weighed, and palletized.', 'David Ochieng'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'In Transit', 'Thika Superhighway · Ruiru Toll Corridor', 'Dispatched via Isuzu FRR Cargo Van KDQ 418M en route to Juja.', 'David Ochieng');
