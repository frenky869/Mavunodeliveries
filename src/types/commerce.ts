import { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'dispatcher' | 'admin';

export type CommodityCategory =
  | 'Silk & Satin Fabrics'
  | 'Linen & Cotton Textiles'
  | 'Eau de Parfum'
  | 'Botanical & Oud Oils';

export type OrderStatus =
  | 'Order Placed'
  | 'Packed & Ready'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Order Placed',
  'Packed & Ready',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

export const COMMODITY_CATEGORIES: ('All' | CommodityCategory)[] = [
  'All',
  'Silk & Satin Fabrics',
  'Linen & Cotton Textiles',
  'Eau de Parfum',
  'Botanical & Oud Oils',
];

export const VALID_BOUTIQUE_CATEGORIES: CommodityCategory[] = [
  'Silk & Satin Fabrics',
  'Linen & Cotton Textiles',
  'Eau de Parfum',
  'Botanical & Oud Oils',
];

export const ADMIN_BOOTSTRAP_EMAIL = 'martin.francis@students.jkuat.ac.ke';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  defaultAddress: string;
  role: UserRole;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Commodity {
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CartItem {
  commodity: Commodity;
  quantity: number;
}

export interface Order {
  id: string;
  orderReference: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryNotes: string;
  status: OrderStatus;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: 'KES';
  itemCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderItem {
  id: string;
  orderId: string;
  customerUid: string;
  commodityId: string;
  commodityName: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt?: Timestamp;
}

export interface DeliveryTrackingEvent {
  id: string;
  orderId: string;
  customerUid: string;
  status: OrderStatus;
  location: string;
  notes: string;
  updatedBy: string;
  createdAt?: Timestamp;
}

export type StockAvailability = 'In Stock' | 'Low Stock' | 'Out of Stock';

export function getStockAvailability(commodity: Pick<Commodity, 'stockQuantity' | 'lowStockThreshold'>): StockAvailability {
  if (commodity.stockQuantity <= 0) return 'Out of Stock';
  if (commodity.stockQuantity <= commodity.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
