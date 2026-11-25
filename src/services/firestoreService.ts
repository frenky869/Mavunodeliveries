import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SEED_COMMODITIES, SeedCommodityInput } from '../data/seedCommodities';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  CartItem,
  Commodity,
  DeliveryTrackingEvent,
  Order,
  OrderItem,
  OrderStatus,
  ORDER_STATUS_FLOW,
  UserProfile,
  UserRole,
} from '../types/commerce';

export function generateOrderReference(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const alpha = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `MVN-${year}-${suffix}${alpha}`;
}

export async function ensureUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  try {
    const snap = await getDoc(userRef);
    const isBootstrap =
      firebaseUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      return {
        ...data,
        role: isBootstrap ? 'admin' : data.role,
      };
    }

    const newProfile: Record<string, unknown> = {
      uid: firebaseUser.uid,
      displayName: (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer').slice(0, 100),
      email: (firebaseUser.email || '').slice(0, 254),
      phone: '',
      defaultAddress: '',
      role: isBootstrap ? 'admin' : 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, newProfile);
    const createdSnap = await getDoc(userRef);
    return createdSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
  }
}

export async function updateUserProfileDetails(
  uid: string,
  updates: { displayName: string; phone: string; defaultAddress: string }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      displayName: updates.displayName.trim().slice(0, 100),
      phone: updates.phone.trim().slice(0, 30),
      defaultAddress: updates.defaultAddress.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export function subscribeCommodities(
  onData: (items: Commodity[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'commodities'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Commodity[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Commodity, 'id'>),
      }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'commodities');
      }
    }
  );
}

export async function placeOrderTransaction(params: {
  user: UserProfile;
  cartItems: CartItem[];
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryNotes: string;
}): Promise<{ orderId: string; orderReference: string }> {
  const { user, cartItems, deliveryPhone, deliveryAddress, deliveryNotes } = params;
  if (cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const orderReference = generateOrderReference();
  const orderRef = doc(db, 'orders', orderId);

  try {
    await runTransaction(db, async (tx) => {
      // 1. Read all commodity documents inside the transaction first
      const commoditySnapshots = await Promise.all(
        cartItems.map(async (item) => {
          const ref = doc(db, 'commodities', item.commodity.id);
          const snap = await tx.get(ref);
          return { item, ref, snap };
        })
      );

      // 2. Validate stock availability & compute authoritative totals
      let subtotalAmount = 0;
      let totalQuantityCount = 0;

      const validatedLines: Array<{
        ref: ReturnType<typeof doc>;
        nextStock: number;
        commodityId: string;
        commodityName: string;
        unitLabel: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }> = [];

      for (const { item, ref, snap } of commoditySnapshots) {
        if (!snap.exists()) {
          throw new Error(`${item.commodity.name} is no longer available.`);
        }
        const live = snap.data() as Omit<Commodity, 'id'>;
        if (!live.isActive) {
          throw new Error(`${live.name} is currently unavailable.`);
        }
        if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
          throw new Error(`Invalid quantity requested for ${live.name}.`);
        }
        if (live.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${live.name}. Only ${live.stockQuantity} ${live.unitLabel} remaining.`
          );
        }

        const lineTotal = live.unitPrice * item.quantity;
        subtotalAmount += lineTotal;
        totalQuantityCount += item.quantity;

        validatedLines.push({
          ref,
          nextStock: live.stockQuantity - item.quantity,
          commodityId: snap.id,
          commodityName: live.name,
          unitLabel: live.unitLabel,
          quantity: item.quantity,
          unitPrice: live.unitPrice,
          lineTotal,
        });
      }

      const deliveryFee = subtotalAmount >= 15000 ? 0 : 450;
      const totalAmount = subtotalAmount + deliveryFee;

      // 3. Atomically deduct stock from each commodity
      for (const line of validatedLines) {
        tx.update(line.ref, {
          stockQuantity: line.nextStock,
          updatedAt: serverTimestamp(),
        });
      }

      // 4. Create the Order document
      tx.set(orderRef, {
        orderReference,
        customerUid: user.uid,
        customerName: user.displayName.slice(0, 100),
        customerEmail: user.email.slice(0, 254),
        deliveryPhone: deliveryPhone.trim().slice(0, 30),
        deliveryAddress: deliveryAddress.trim().slice(0, 300),
        deliveryNotes: deliveryNotes.trim().slice(0, 300),
        status: 'Order Placed',
        subtotalAmount,
        deliveryFee,
        totalAmount,
        currency: 'KES',
        itemCount: totalQuantityCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 5. Create normalized Order Item documents
      validatedLines.forEach((line, idx) => {
        const itemRef = doc(db, 'orders', orderId, 'items', `item_${idx + 1}`);
        tx.set(itemRef, {
          orderId,
          customerUid: user.uid,
          commodityId: line.commodityId,
          commodityName: line.commodityName,
          unitLabel: line.unitLabel,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          createdAt: serverTimestamp(),
        });
      });

      // 6. Create initial Order Placed delivery tracking record
      const trackingRef = doc(db, 'orders', orderId, 'tracking', 'evt_1');
      tx.set(trackingRef, {
        orderId,
        customerUid: user.uid,
        status: 'Order Placed',
        location: 'Nairobi Central Fulfillment Hub',
        notes: 'Order confirmed and inventory reserved from warehouse stock.',
        updatedBy: 'System Checkout',
        createdAt: serverTimestamp(),
      });
    });

    return { orderId, orderReference };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Insufficient stock') ||
        error.message.includes('no longer available') ||
        error.message.includes('Invalid quantity'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
  }
}

export function subscribeCustomerOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('customerUid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));
      onData(orders);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    }
  );
}

export function subscribeAllOrdersForAdmin(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));
      onData(orders);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    }
  );
}

export function subscribeOrderDetails(
  orderId: string,
  onItems: (items: OrderItem[]) => void,
  onTracking: (events: DeliveryTrackingEvent[]) => void
): Unsubscribe {
  const itemsQuery = query(collection(db, 'orders', orderId, 'items'));
  const trackingQuery = query(
    collection(db, 'orders', orderId, 'tracking'),
    orderBy('createdAt', 'asc')
  );

  const unsubItems = onSnapshot(
    itemsQuery,
    (snap) => {
      onItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderItem, 'id'>),
        }))
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `orders/${orderId}/items`)
  );

  const unsubTracking = onSnapshot(
    trackingQuery,
    (snap) => {
      onTracking(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DeliveryTrackingEvent, 'id'>),
        }))
      );
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `orders/${orderId}/tracking`)
  );

  return () => {
    unsubItems();
    unsubTracking();
  };
}

export async function advanceOrderStatus(params: {
  order: Order;
  location: string;
  notes: string;
  updatedBy: string;
}): Promise<OrderStatus> {
  const { order, location, notes, updatedBy } = params;
  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  if (currentIdx === -1 || currentIdx >= ORDER_STATUS_FLOW.length - 1) {
    throw new Error('This order has already reached Delivered status.');
  }

  const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];
  const orderRef = doc(db, 'orders', order.id);
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const trackingRef = doc(db, 'orders', order.id, 'tracking', eventId);

  const batch = writeBatch(db);
  batch.update(orderRef, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
  batch.set(trackingRef, {
    orderId: order.id,
    customerUid: order.customerUid,
    status: nextStatus,
    location: location.trim().slice(0, 150),
    notes: notes.trim().slice(0, 300),
    updatedBy: updatedBy.trim().slice(0, 120),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return nextStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
  }
}

export async function updateCommodityStock(
  commodityId: string,
  newStockQuantity: number,
  lowStockThreshold?: number
): Promise<void> {
  const ref = doc(db, 'commodities', commodityId);
  const safeStock = Math.max(0, Math.floor(newStockQuantity));
  const updates: Record<string, unknown> = {
    stockQuantity: safeStock,
    updatedAt: serverTimestamp(),
  };
  if (typeof lowStockThreshold === 'number' && lowStockThreshold >= 0) {
    updates.lowStockThreshold = Math.floor(lowStockThreshold);
  }
  try {
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `commodities/${commodityId}`);
  }
}

export async function createCommodity(input: Omit<SeedCommodityInput, 'id' | 'currency' | 'isActive'>): Promise<void> {
  const cleanId = `${input.sku.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString().slice(-4)}`;
  const ref = doc(db, 'commodities', cleanId);
  try {
    await setDoc(ref, {
      sku: input.sku.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40),
      name: input.name.trim().slice(0, 120),
      category: input.category,
      description: input.description.trim().slice(0, 500),
      unitLabel: input.unitLabel.trim().slice(0, 40),
      unitPrice: Math.max(0, Number(input.unitPrice)),
      currency: 'KES',
      stockQuantity: Math.max(0, Math.floor(Number(input.stockQuantity))),
      lowStockThreshold: Math.max(0, Math.floor(Number(input.lowStockThreshold))),
      imageUrl: input.imageUrl.trim().slice(0, 300),
      origin: input.origin.trim().slice(0, 80),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `commodities/${cleanId}`);
  }
}

export async function seedDemoWorkspace(adminProfile: UserProfile): Promise<{ seededCatalog: number; seededOrders: number }> {
  let seededCatalog = 0;
  let seededOrders = 0;

  try {
    const existingCommodities = await getDocs(collection(db, 'commodities'));
    if (existingCommodities.empty) {
      const batch = writeBatch(db);
      for (const item of SEED_COMMODITIES) {
        const ref = doc(db, 'commodities', item.id);
        batch.set(ref, {
          sku: item.sku,
          name: item.name,
          category: item.category,
          description: item.description,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice,
          currency: item.currency,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          imageUrl: item.imageUrl,
          origin: item.origin,
          isActive: item.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        seededCatalog += 1;
      }
      await batch.commit();
    }

    const existingOrders = await getDocs(
      query(collection(db, 'orders'), where('customerUid', '==', adminProfile.uid))
    );

    if (existingOrders.empty) {
      const demoOrder1Id = `ord_demo_transit_${adminProfile.uid.slice(0, 8)}`;
      const demoOrder2Id = `ord_demo_packed_${adminProfile.uid.slice(0, 8)}`;
      const orderBatch = writeBatch(db);

      // Demo Order 1: In Transit
      orderBatch.set(doc(db, 'orders', demoOrder1Id), {
        orderReference: 'MVN-2026-1042',
        customerUid: adminProfile.uid,
        customerName: adminProfile.displayName,
        customerEmail: adminProfile.email,
        deliveryPhone: '+254 712 345 678',
        deliveryAddress: 'Juja Town Market Stall 14, Kiambu County',
        deliveryNotes: 'Call gate security upon truck arrival.',
        status: 'In Transit',
        subtotalAmount: 15180,
        deliveryFee: 0,
        totalAmount: 15180,
        currency: 'KES',
        itemCount: 4,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'items', 'item_1'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        commodityId: 'maize_white_50kg',
        commodityName: 'Grade 1 Dry White Maize',
        unitLabel: '50kg bag',
        quantity: 2,
        unitPrice: 3450,
        lineTotal: 6900,
        createdAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'items', 'item_2'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        commodityId: 'beans_rosecoco_50kg',
        commodityName: 'Nyota & Rosecoco Red Beans',
        unitLabel: '50kg bag',
        quantity: 1,
        unitPrice: 6800,
        lineTotal: 6800,
        createdAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'items', 'item_3'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        commodityId: 'oil_sunflower_5l',
        commodityName: 'Pure Refined Sunflower Oil',
        unitLabel: '5L jerrycan',
        quantity: 1,
        unitPrice: 1480,
        lineTotal: 1480,
        createdAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'tracking', 'evt_1'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        status: 'Order Placed',
        location: 'Nairobi Central Fulfillment Hub',
        notes: 'Order confirmed and warehouse inventory allocated.',
        updatedBy: 'System Checkout',
        createdAt: serverTimestamp(),
      });
      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'tracking', 'evt_2'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        status: 'Packed & Ready',
        location: 'Industrial Area Bay 4, Nairobi',
        notes: 'Moisture-checked sacks sealed, weighed, and palletized.',
        updatedBy: adminProfile.displayName,
        createdAt: serverTimestamp(),
      });
      orderBatch.set(doc(db, 'orders', demoOrder1Id, 'tracking', 'evt_3'), {
        orderId: demoOrder1Id,
        customerUid: adminProfile.uid,
        status: 'In Transit',
        location: 'Thika Superhighway · Ruiru Toll Corridor',
        notes: 'Dispatched via Isuzu FRR Cargo Van KDQ 418M en route to Juja.',
        updatedBy: adminProfile.displayName,
        createdAt: serverTimestamp(),
      });

      // Demo Order 2: Packed & Ready
      orderBatch.set(doc(db, 'orders', demoOrder2Id), {
        orderReference: 'MVN-2026-1088',
        customerUid: adminProfile.uid,
        customerName: adminProfile.displayName,
        customerEmail: adminProfile.email,
        deliveryPhone: '+254 712 345 678',
        deliveryAddress: 'Thika Road Annex Depot, Kasarani',
        deliveryNotes: 'Deliver before 4:00 PM.',
        status: 'Packed & Ready',
        subtotalAmount: 11100,
        deliveryFee: 450,
        totalAmount: 11550,
        currency: 'KES',
        itemCount: 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder2Id, 'items', 'item_1'), {
        orderId: demoOrder2Id,
        customerUid: adminProfile.uid,
        commodityId: 'rice_mwea_pishori_25kg',
        commodityName: 'Mwea Pishori Aromatic Rice',
        unitLabel: '25kg bag',
        quantity: 1,
        unitPrice: 4650,
        lineTotal: 4650,
        createdAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder2Id, 'items', 'item_2'), {
        orderId: demoOrder2Id,
        customerUid: adminProfile.uid,
        commodityId: 'sugar_brown_cane_50kg',
        commodityName: 'Unrefined Brown Cane Sugar',
        unitLabel: '50kg bag',
        quantity: 1,
        unitPrice: 6450,
        lineTotal: 6450,
        createdAt: serverTimestamp(),
      });

      orderBatch.set(doc(db, 'orders', demoOrder2Id, 'tracking', 'evt_1'), {
        orderId: demoOrder2Id,
        customerUid: adminProfile.uid,
        status: 'Order Placed',
        location: 'Nairobi Central Fulfillment Hub',
        notes: 'Order confirmed and stock deducted atomically.',
        updatedBy: 'System Checkout',
        createdAt: serverTimestamp(),
      });
      orderBatch.set(doc(db, 'orders', demoOrder2Id, 'tracking', 'evt_2'), {
        orderId: demoOrder2Id,
        customerUid: adminProfile.uid,
        status: 'Packed & Ready',
        location: 'Dispatch Bay 2, Nairobi Depot',
        notes: 'Pishori rice and cane sugar staged for afternoon courier loading.',
        updatedBy: adminProfile.displayName,
        createdAt: serverTimestamp(),
      });

      await orderBatch.commit();
      seededOrders = 2;
    }

    return { seededCatalog, seededOrders };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'commodities/seed');
  }
}

export async function listUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function updateUserRoleByAdmin(uid: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}
