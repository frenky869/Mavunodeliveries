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

export interface FabricGalleryItem {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
}

export const UPLOADED_FABRIC_GALLERY: FabricGalleryItem[] = [
  {
    id: 'silk_mulberry_champagne',
    name: 'Solid Dyed Couture Crepe Bolts',
    subtitle: 'Magenta · Charcoal · Olive · Plum',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0005_491395f7.jpg',
  },
  {
    id: 'silk_velvet_emerald',
    name: 'Shifoni Maua · Scarlet & Cobalt Floral',
    subtitle: 'Crimson Rose · Royal Cobalt · Sage',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0006_85463d22.jpg',
  },
  {
    id: 'silk_duchess_satin_5m',
    name: 'Shifoni Maua · Botanical & Paisley',
    subtitle: 'Mint Blossom · Forest Baroque · Paisley',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0009_01569df1.jpg',
  },
  {
    id: 'linen_belgian_oatmeal',
    name: 'Shifoni Maua · Pastel Rose & Toile',
    subtitle: 'Blush Rose · Icy Blue Toile · Medallion',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0007_d0d76b4e.jpg',
  },
  {
    id: 'cotton_egyptian_poplin',
    name: 'Shifoni Maua · Polka Dot & Poppy',
    subtitle: 'Polka Dot · Red Poppy · Marigold Lily',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0010_9c4fe833.jpg',
  },
];

export const HERO_WAREHOUSE_IMAGE =
  '/assets/aistudio/IMG-20261125-WA0005_491395f7.jpg';

export const SEED_COMMODITIES: SeedCommodityInput[] = [
  {
    id: 'silk_mulberry_champagne',
    sku: 'FAB-SLK-01',
    name: 'Solid Dyed Couture Crepe Bolts',
    category: 'Silk & Satin Fabrics',
    description:
      'Full-width solid dyed silk crepe and satin rolls in magenta, charcoal, dusty rose, espresso, olive, crimson, and deep plum for tailored garments.',
    unitLabel: 'per meter',
    unitPrice: 1850,
    currency: 'KES',
    stockQuantity: 42,
    lowStockThreshold: 10,
    imageUrl: '/assets/aistudio/IMG-20261125-WA0005_491395f7.jpg',
    origin: 'Atelier Vault',
    isActive: true,
  },
  {
    id: 'silk_velvet_emerald',
    sku: 'FAB-SHF-02',
    name: 'Shifoni Maua · Scarlet & Cobalt Floral Chiffon',
    category: 'Silk & Satin Fabrics',
    description:
      'Airy printed Shifoni Maua chiffon rolls featuring crimson botanical roses, royal cobalt blossoms, terracotta geometrics, and lime poppy prints.',
    unitLabel: 'per meter',
    unitPrice: 1450,
    currency: 'KES',
    stockQuantity: 7,
    lowStockThreshold: 8,
    imageUrl: '/assets/aistudio/IMG-20261125-WA0006_85463d22.jpg',
    origin: 'Fathy Textiles',
    isActive: true,
  },
  {
    id: 'silk_duchess_satin_5m',
    sku: 'FAB-SHF-05M',
    name: 'Shifoni Maua · Botanical & Paisley Chiffon',
    category: 'Silk & Satin Fabrics',
    description:
      'Curated 5-meter atelier bolt of Shifoni Maua chiffon blending mint blossom, forest baroque foliage, cream peonies, and warm terracotta paisley.',
    unitLabel: '5m bolt',
    unitPrice: 6800,
    currency: 'KES',
    stockQuantity: 18,
    lowStockThreshold: 5,
    imageUrl: '/assets/aistudio/IMG-20261125-WA0009_01569df1.jpg',
    origin: 'Fathy Textiles',
    isActive: true,
  },
  {
    id: 'linen_belgian_oatmeal',
    sku: 'TXT-SHF-01',
    name: 'Shifoni Maua · Pastel Rose & Toile Chiffon',
    category: 'Linen & Cotton Textiles',
    description:
      'Soft pastel blush, icy blue toile, sage meadow, burgundy medallion, and golden tiger-stripe chiffon rolls ideal for flowing dresses and scarves.',
    unitLabel: 'per meter',
    unitPrice: 1350,
    currency: 'KES',
    stockQuantity: 56,
    lowStockThreshold: 12,
    imageUrl: '/assets/aistudio/IMG-20261125-WA0007_d0d76b4e.jpg',
    origin: 'Fathy Textiles',
    isActive: true,
  },
  {
    id: 'cotton_egyptian_poplin',
    sku: 'TXT-SHF-02',
    name: 'Shifoni Maua · Polka Dot & Poppy Chiffon',
    category: 'Linen & Cotton Textiles',
    description:
      'Signature black-and-white polka dot, crimson poppy, olive lily, ocean wave, and marigold floral chiffon rolls cut cleanly to length.',
    unitLabel: 'per meter',
    unitPrice: 1400,
    currency: 'KES',
    stockQuantity: 64,
    lowStockThreshold: 15,
    imageUrl: '/assets/aistudio/IMG-20261125-WA0010_9c4fe833.jpg',
    origin: 'Fathy Textiles',
    isActive: true,
  },
  {
    id: 'perfume_lumina_amber_oud',
    sku: 'PRF-AMB-100',
    name: 'Lumina Amber & Saffron Eau de Parfum',
    category: 'Eau de Parfum',
    description:
      'Top notes of Calabrian bergamot and red saffron unfolding into warm golden labdanum, resinous amber, and aged cedarwood.',
    unitLabel: '100ml flacon',
    unitPrice: 12800,
    currency: 'KES',
    stockQuantity: 24,
    lowStockThreshold: 6,
    imageUrl: '/src/assets/images/perfume_amber_oud_1795606060003.jpg',
    origin: 'Grasse, France',
    isActive: true,
  },
  {
    id: 'perfume_neroli_cedar_50',
    sku: 'PRF-NER-50',
    name: 'Neroli & White Cedar Eau de Parfum',
    category: 'Eau de Parfum',
    description:
      'Sunlit Tunisian neroli blossom layered over crisp green petitgrain, white tea leaf, and dry Atlas cedar in frosted glass.',
    unitLabel: '50ml flacon',
    unitPrice: 8900,
    currency: 'KES',
    stockQuantity: 31,
    lowStockThreshold: 8,
    imageUrl: '/src/assets/images/perfume_botanical_oil_1795606060646.jpg',
    origin: 'Grasse, France',
    isActive: true,
  },
  {
    id: 'perfume_ambre_noir_50',
    sku: 'PRF-NOI-50',
    name: 'Ambre Noir Reserve Eau de Parfum',
    category: 'Eau de Parfum',
    description:
      'Smoky Madagascar vanilla bean, toasted cardamom, and dark benzoin balm crafted for long-lasting evening sillage.',
    unitLabel: '50ml flacon',
    unitPrice: 9600,
    currency: 'KES',
    stockQuantity: 5,
    lowStockThreshold: 6,
    imageUrl: '/src/assets/images/perfume_amber_oud_1795606060003.jpg',
    origin: 'Paris Atelier',
    isActive: true,
  },
  {
    id: 'oil_cedar_sandal_attar',
    sku: 'OIL-ATT-15',
    name: 'Pure Cedarwood & Sandal Attar Oil',
    category: 'Botanical & Oud Oils',
    description:
      'Alcohol-free concentrated botanical perfume oil distilled in small batches with Mysore sandalwood, cedar heartwood, and neroli.',
    unitLabel: '15ml dropper',
    unitPrice: 5400,
    currency: 'KES',
    stockQuantity: 19,
    lowStockThreshold: 5,
    imageUrl: '/src/assets/images/perfume_botanical_oil_1795606060646.jpg',
    origin: 'Lamu & Oman Blend',
    isActive: true,
  },
];
