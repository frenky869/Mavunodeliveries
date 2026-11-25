import { CommodityCategory } from '../types/commerce';

export interface SeedCommodityInput {
  id: string;
  sku: string;
  name: string;
  category: CommodityCategory;
  description: string;
  unitLabel: string;
  unitPrice: number;
  currency: 'KES';
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  origin: string;
  isActive: boolean;
}

export const HERO_WAREHOUSE_IMAGE =
  '/src/assets/images/hero_commodity_warehouse_1795601313851.jpg';

export const SEED_COMMODITIES: SeedCommodityInput[] = [
  {
    id: 'maize_white_50kg',
    sku: 'GRN-MZE-50KG',
    name: 'Grade 1 Dry White Maize',
    category: 'Grains & Cereals',
    description:
      'Sun-dried, machine-cleaned white maize kernels suitable for milling posho flour, githeri, and commercial grain supply.',
    unitLabel: '50kg bag',
    unitPrice: 3450,
    currency: 'KES',
    stockQuantity: 48,
    lowStockThreshold: 12,
    imageUrl: '/src/assets/images/commodity_maize_grain_1795601314397.jpg',
    origin: 'Trans-Nzoia, Kitale',
    isActive: true,
  },
  {
    id: 'maize_yellow_25kg',
    sku: 'GRN-YMZ-25KG',
    name: 'Whole Yellow Maize Grain',
    category: 'Grains & Cereals',
    description:
      'High-carotenoid dried yellow maize screened to 12.5% moisture for consistent storage and poultry or household milling.',
    unitLabel: '25kg bag',
    unitPrice: 1850,
    currency: 'KES',
    stockQuantity: 9,
    lowStockThreshold: 10,
    imageUrl: '/src/assets/images/commodity_maize_grain_1795601314397.jpg',
    origin: 'Uasin Gishu, Eldoret',
    isActive: true,
  },
  {
    id: 'rice_mwea_pishori_25kg',
    sku: 'GRN-RCE-25KG',
    name: 'Mwea Pishori Aromatic Rice',
    category: 'Grains & Cereals',
    description:
      'Pure long-grain aromatic Pishori rice harvested from irrigated paddies, double-sorted with zero broken-grain blends.',
    unitLabel: '25kg bag',
    unitPrice: 4650,
    currency: 'KES',
    stockQuantity: 34,
    lowStockThreshold: 8,
    imageUrl: '/src/assets/images/commodity_pishori_rice_1795601314668.jpg',
    origin: 'Kirinyaga, Mwea',
    isActive: true,
  },
  {
    id: 'rice_basmati_5kg',
    sku: 'GRN-BSM-5KG',
    name: 'Aged Long-Grain Basmati Rice',
    category: 'Grains & Cereals',
    description:
      'Extra-long slender basmati rice aged for 12 months for non-sticky, fragrant pilau and household dining.',
    unitLabel: '5kg kraft pack',
    unitPrice: 1120,
    currency: 'KES',
    stockQuantity: 62,
    lowStockThreshold: 15,
    imageUrl: '/src/assets/images/commodity_pishori_rice_1795601314668.jpg',
    origin: 'Ahero & Import Blend',
    isActive: true,
  },
  {
    id: 'beans_rosecoco_50kg',
    sku: 'PLS-RSC-50KG',
    name: 'Nyota & Rosecoco Red Beans',
    category: 'Pulses & Legumes',
    description:
      'Fresh-season speckled rosecoco beans prized for fast cooking time, rich broth, and clean stone-free sorting.',
    unitLabel: '50kg bag',
    unitPrice: 6800,
    currency: 'KES',
    stockQuantity: 22,
    lowStockThreshold: 8,
    imageUrl: '/src/assets/images/commodity_beans_pulses_1795601314512.jpg',
    origin: 'Meru & Embu Highlands',
    isActive: true,
  },
  {
    id: 'beans_green_grams_10kg',
    sku: 'PLS-NDG-10KG',
    name: 'Sorted Green Grams (Ndengu)',
    category: 'Pulses & Legumes',
    description:
      'Polished N26 green mung beans graded for high germination and creamy texture in stews and curries.',
    unitLabel: '10kg sack',
    unitPrice: 1950,
    currency: 'KES',
    stockQuantity: 6,
    lowStockThreshold: 8,
    imageUrl: '/src/assets/images/commodity_beans_pulses_1795601314512.jpg',
    origin: 'Makueni & Kitui',
    isActive: true,
  },
  {
    id: 'beans_yellow_1kg',
    sku: 'PLS-YLB-1KG',
    name: 'Single-Origin Yellow Beans',
    category: 'Pulses & Legumes',
    description:
      'Gentle-digesting yellow beans packed in 1kg pantry portions, ready for immediate soaking and simmering.',
    unitLabel: 'per kg',
    unitPrice: 240,
    currency: 'KES',
    stockQuantity: 0,
    lowStockThreshold: 15,
    imageUrl: '/src/assets/images/commodity_beans_pulses_1795601314512.jpg',
    origin: 'Nakuru Basin',
    isActive: true,
  },
  {
    id: 'sugar_brown_cane_50kg',
    sku: 'SGR-BRN-50KG',
    name: 'Unrefined Brown Cane Sugar',
    category: 'Sugar & Sweeteners',
    description:
      'Coarse golden-brown cane sugar milled locally with natural molasses retention and moisture-barrier poly lining.',
    unitLabel: '50kg bag',
    unitPrice: 6450,
    currency: 'KES',
    stockQuantity: 29,
    lowStockThreshold: 6,
    imageUrl: '/src/assets/images/commodity_cane_sugar_1795601315533.jpg',
    origin: 'Kakamega, Mumias',
    isActive: true,
  },
  {
    id: 'sugar_brown_2kg',
    sku: 'SGR-BRN-2KG',
    name: 'Household Brown Cane Sugar',
    category: 'Sugar & Sweeteners',
    description:
      'Everyday 2kg pantry pouch of crystal brown cane sugar for tea, baking, and retail household restocking.',
    unitLabel: '2kg pack',
    unitPrice: 310,
    currency: 'KES',
    stockQuantity: 85,
    lowStockThreshold: 20,
    imageUrl: '/src/assets/images/commodity_cane_sugar_1795601315533.jpg',
    origin: 'Nzoia Valley',
    isActive: true,
  },
  {
    id: 'oil_sunflower_5l',
    sku: 'OIL-SUN-5L',
    name: 'Pure Refined Sunflower Oil',
    category: 'Oils & Pantry',
    description:
      'Cholesterol-free, triple-filtered sunflower cooking oil fortified with Vitamin A in a tamper-evident 5L jerrycan.',
    unitLabel: '5L jerrycan',
    unitPrice: 1480,
    currency: 'KES',
    stockQuantity: 41,
    lowStockThreshold: 10,
    imageUrl: '/src/assets/images/commodity_cooking_oil_1795601315949.jpg',
    origin: 'Thika Refinery',
    isActive: true,
  },
  {
    id: 'oil_sunflower_20l',
    sku: 'OIL-SUN-20L',
    name: 'Commercial Sunflower Oil Drum',
    category: 'Oils & Pantry',
    description:
      'Bulk 20-liter food-grade container engineered for kitchens, schools, and neighborhood retail shops.',
    unitLabel: '20L jerrycan',
    unitPrice: 5400,
    currency: 'KES',
    stockQuantity: 7,
    lowStockThreshold: 10,
    imageUrl: '/src/assets/images/commodity_cooking_oil_1795601315949.jpg',
    origin: 'Thika Refinery',
    isActive: true,
  },
];
