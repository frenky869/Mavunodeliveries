-- Realistic Seed Data for Sable & Silk PostgreSQL Database
-- Replace placeholder password_hash values via your server auth utility before production use.

INSERT INTO users (id, full_name, email, password_hash, phone, default_address, role)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Amina Wanjiku',
    'amina.customer@example.com',
    '$scrypt$n=16384,r=8,p=1$demo-salt$replace-with-runtime-hash',
    '+254 712 345 678',
    'Riverside Drive Suite 4B, Westlands, Nairobi',
    'customer'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Claire Mutua',
    'atelier@example.com',
    '$scrypt$n=16384,r=8,p=1$demo-salt$replace-with-runtime-hash',
    '+254 722 100 200',
    'Sable & Silk Nairobi Atelier, Kilimani',
    'admin'
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO commodities (
  id, sku, name, category, description, unit_label, unit_price, currency,
  stock_quantity, low_stock_threshold, origin, image_url, is_active
)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'FAB-SLK-01', 'Solid Dyed Couture Crepe Bolts', 'Silk & Satin Fabrics', 'Full-width solid dyed silk crepe and satin rolls in magenta, charcoal, dusty rose, espresso, olive, crimson, and deep plum for tailored garments.', 'per meter', 1850.00, 'KES', 42, 10, 'Atelier Vault', '/assets/aistudio/IMG-20261125-WA0005_491395f7.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'FAB-SHF-02', 'Shifoni Maua · Scarlet & Cobalt Floral Chiffon', 'Silk & Satin Fabrics', 'Airy printed Shifoni Maua chiffon rolls featuring crimson botanical roses, royal cobalt blossoms, terracotta geometrics, and lime poppy prints.', 'per meter', 1450.00, 'KES', 7, 8, 'Fathy Textiles', '/assets/aistudio/IMG-20261125-WA0006_85463d22.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'FAB-SHF-05M', 'Shifoni Maua · Botanical & Paisley Chiffon', 'Silk & Satin Fabrics', 'Curated 5-meter atelier bolt of Shifoni Maua chiffon blending mint blossom, forest baroque foliage, cream peonies, and warm terracotta paisley.', '5m bolt', 6800.00, 'KES', 18, 5, 'Fathy Textiles', '/assets/aistudio/IMG-20261125-WA0009_01569df1.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'TXT-SHF-01', 'Shifoni Maua · Pastel Rose & Toile Chiffon', 'Linen & Cotton Textiles', 'Soft pastel blush, icy blue toile, sage meadow, burgundy medallion, and golden tiger-stripe chiffon rolls ideal for flowing dresses and scarves.', 'per meter', 1350.00, 'KES', 56, 12, 'Fathy Textiles', '/assets/aistudio/IMG-20261125-WA0007_d0d76b4e.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'TXT-SHF-02', 'Shifoni Maua · Polka Dot & Poppy Chiffon', 'Linen & Cotton Textiles', 'Signature black-and-white polka dot, crimson poppy, olive lily, ocean wave, and marigold floral chiffon rolls cut cleanly to length.', 'per meter', 1400.00, 'KES', 64, 15, 'Fathy Textiles', '/assets/aistudio/IMG-20261125-WA0010_9c4fe833.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000007', 'PRF-AMB-100', 'Lumina Amber & Saffron Eau de Parfum', 'Eau de Parfum', 'Top notes of Calabrian bergamot and red saffron unfolding into warm golden labdanum, resinous amber, and aged cedarwood.', '100ml flacon', 12800.00, 'KES', 24, 6, 'Grasse, France', '/src/assets/images/perfume_amber_oud_1795606060003.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000008', 'PRF-NER-50', 'Neroli & White Cedar Eau de Parfum', 'Eau de Parfum', 'Sunlit Tunisian neroli blossom layered over crisp green petitgrain, white tea leaf, and dry Atlas cedar in frosted glass.', '50ml flacon', 8900.00, 'KES', 31, 8, 'Grasse, France', '/src/assets/images/perfume_botanical_oil_1795606060646.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000009', 'PRF-NOI-50', 'Ambre Noir Reserve Eau de Parfum', 'Eau de Parfum', 'Smoky Madagascar vanilla bean, toasted cardamom, and dark benzoin balm crafted for long-lasting evening sillage.', '50ml flacon', 9600.00, 'KES', 5, 6, 'Paris Atelier', '/src/assets/images/perfume_amber_oud_1795606060003.jpg', TRUE),
  ('aaaaaaaa-0001-0001-0001-000000000010', 'OIL-ATT-15', 'Pure Cedarwood & Sandal Attar Oil', 'Botanical & Oud Oils', 'Alcohol-free concentrated botanical perfume oil distilled in small batches with Mysore sandalwood, cedar heartwood, and neroli.', '15ml dropper', 5400.00, 'KES', 19, 5, 'Lamu & Oman Blend', '/src/assets/images/perfume_botanical_oil_1795606060646.jpg', TRUE)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (
  id, order_reference, user_id, delivery_phone, delivery_address, delivery_notes,
  status, subtotal_amount, delivery_fee, total_amount, currency
)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'SSL-2026-2041',
  '11111111-1111-1111-1111-111111111111',
  '+254 712 345 678',
  'Riverside Drive Suite 4B, Westlands, Nairobi',
  'Deliver rolled silk in acid-free tube.',
  'In Transit',
  16500.00,
  0.00,
  16500.00,
  'KES'
)
ON CONFLICT (order_reference) DO NOTHING;

INSERT INTO order_items (order_id, commodity_id, commodity_name, unit_label, quantity, unit_price, line_total)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001', id, name, unit_label, 2, unit_price, unit_price * 2
FROM commodities WHERE sku = 'FAB-SLK-01';

INSERT INTO order_items (order_id, commodity_id, commodity_name, unit_label, quantity, unit_price, line_total)
SELECT 'bbbbbbbb-0001-0001-0001-000000000001', id, name, unit_label, 1, unit_price, unit_price
FROM commodities WHERE sku = 'PRF-AMB-100';

INSERT INTO delivery_tracking (order_id, status, location, notes, updated_by)
VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Order Placed', 'Sable & Silk Nairobi Atelier', 'Order confirmed and atelier stock reserved.', 'System Checkout'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'Packed & Ready', 'Kilimani Fragrance & Textile Vault', 'Silk rolled on archival tube and fragrance sealed in cushioned gift box.', 'Claire Mutua'),
  ('bbbbbbbb-0001-0001-0001-000000000001', 'In Transit', 'Westlands Express Courier Van', 'Out on climate-controlled boutique courier route to Riverside Drive.', 'Claire Mutua');
