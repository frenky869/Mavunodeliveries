/**
 * Payload-First Security TDD Spec for Sable & Silk Firestore Rules
 * Verifies the "Dirty Dozen" adversarial payloads are rejected.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list';
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Role',
    collectionPath: 'users/attacker_uid',
    operation: 'create',
    payload: { uid: 'attacker_uid', role: 'admin', email: 'attacker@example.com' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: 'users/customer_uid',
    operation: 'update',
    payload: { displayName: 'Customer', isVerifiedPartner: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write',
    collectionPath: 'orders/ord_unverified',
    operation: 'create',
    payload: { orderReference: 'SSL-2026-9999', status: 'Order Placed' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User Order Read',
    collectionPath: 'orders/ord_victim',
    operation: 'get',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Overselling Stock Below Zero',
    collectionPath: 'commodities/silk_mulberry_champagne',
    operation: 'update',
    payload: { stockQuantity: -5 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Price Tampering on Checkout',
    collectionPath: 'commodities/silk_mulberry_champagne',
    operation: 'update',
    payload: { unitPrice: 1, stockQuantity: 10 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Status Shortcutting on Order Create',
    collectionPath: 'orders/ord_shortcut',
    operation: 'create',
    payload: { status: 'Delivered', customerUid: 'customer_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged Timestamp',
    collectionPath: 'orders/ord_backdated',
    operation: 'create',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'ID Poisoning (>128 chars)',
    collectionPath: `commodities/${'a'.repeat(150)}`,
    operation: 'create',
    payload: { name: 'Poison' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Customer Advancing Own Delivery Status',
    collectionPath: 'orders/ord_customer',
    operation: 'update',
    payload: { status: 'In Transit' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Mutating Terminal Delivered Order',
    collectionPath: 'orders/ord_delivered',
    operation: 'update',
    payload: { status: 'Packed & Ready' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blanket List Scraping on Orders',
    collectionPath: 'orders',
    operation: 'list',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 13,
    name: 'Dispatcher Modifying Catalog Pricing or Stock',
    collectionPath: 'commodities/silk_mulberry_champagne',
    operation: 'update',
    payload: { unitPrice: 1, stockQuantity: 999 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
