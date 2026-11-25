import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase';
import {
  ensureUserProfile,
  seedDemoWorkspace,
  subscribeAllOrdersForAdmin,
  subscribeCommodities,
  subscribeCustomerOrders,
} from './services/firestoreService';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  CartItem,
  Commodity,
  Order,
  OrderItem,
  UserProfile,
} from './types/commerce';
import { TopBar, AppView } from './components/TopBar';
import { CatalogSection } from './components/CatalogSection';
import { CartDrawer } from './components/CartDrawer';
import { OrdersTrackingView } from './components/OrdersTrackingView';
import { DispatchConsoleView } from './components/DispatchConsoleView';
import { CommodityDetailModal } from './components/CommodityDetailModal';
import { ProfileModal } from './components/ProfileModal';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('catalog');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commoditiesLoading, setCommoditiesLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inspectedCommodity, setInspectedCommodity] = useState<Commodity | null>(null);

  const [trackRefTarget, setTrackRefTarget] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const autoSeedAttempted = useRef(false);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    setTimeout(() => {
      setToast((curr) => (curr?.message === nextToast.message ? null : curr));
    }, 3500);
  };

  // 1. Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOrders([]);
        setAuthLoading(false);
        return;
      }
      try {
        const profile = await ensureUserProfile(firebaseUser);
        setUser(profile);
        setAuthError(null);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Unable to load user profile.');
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Commodity Catalog Listener
  useEffect(() => {
    setCommoditiesLoading(true);
    const unsub = subscribeCommodities(
      (items) => {
        setCommodities(items);
        setCommoditiesLoading(false);

        // Keep cart quantities synced & capped against live warehouse stock
        setCart((prev) =>
          prev
            .map((entry) => {
              const latest = items.find((c) => c.id === entry.commodity.id);
              if (!latest || latest.stockQuantity <= 0) return null;
              return {
                commodity: latest,
                quantity: Math.min(entry.quantity, latest.stockQuantity),
              };
            })
            .filter((entry): entry is CartItem => entry !== null)
        );
      },
      (err) => {
        setCommoditiesLoading(false);
        setAuthError(err.message);
      }
    );
    return () => unsub();
  }, []);

  // 3. Auto-seed starter catalog & sample shipments when admin connects to empty store
  useEffect(() => {
    if (
      !commoditiesLoading &&
      commodities.length === 0 &&
      user?.role === 'admin' &&
      !autoSeedAttempted.current
    ) {
      autoSeedAttempted.current = true;
      setSeeding(true);
      void seedDemoWorkspace(user)
        .then(({ seededCatalog, seededOrders }) => {
          if (seededCatalog > 0 || seededOrders > 0) {
            showToast({
              message: 'Starter warehouse catalog and sample shipments loaded.',
            });
          }
        })
        .catch(() => undefined)
        .finally(() => setSeeding(false));
    }
  }, [commoditiesLoading, commodities.length, user]);

  // 4. Real-time Orders Listener (when signed in)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    const isBootstrapAdmin =
      user.email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

    const unsub = isBootstrapAdmin
      ? subscribeAllOrdersForAdmin(
          (list) => {
            setOrders(list);
            setOrdersLoading(false);
          },
          () => setOrdersLoading(false)
        )
      : subscribeCustomerOrders(
          user.uid,
          (list) => {
            setOrders(list);
            setOrdersLoading(false);
          },
          () => setOrdersLoading(false)
        );

    return () => unsub();
  }, [user]);

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.status !== 'Delivered') || null;
  }, [orders]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Sign-in was cancelled or blocked.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveView('catalog');
  };

  const handleAddToCart = (commodity: Commodity, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.commodity.id === commodity.id);
      if (existing) {
        const capped = Math.min(
          commodity.stockQuantity,
          existing.quantity + quantity
        );
        return prev.map((item) =>
          item.commodity.id === commodity.id
            ? { commodity, quantity: capped }
            : item
        );
      }
      return [
        ...prev,
        {
          commodity,
          quantity: Math.min(commodity.stockQuantity, quantity),
        },
      ];
    });

    showToast({
      message: `Added ${quantity} × ${commodity.name} to cart.`,
      actionLabel: 'Open Cart',
      onAction: () => setCartOpen(true),
    });
  };

  const handleReorderItems = (orderItems: OrderItem[]) => {
    let addedLines = 0;
    let skippedUnavailable = 0;

    setCart((prev) => {
      const nextCart = [...prev];
      for (const orderLine of orderItems) {
        const liveCommodity = commodities.find((c) => c.id === orderLine.commodityId);
        if (!liveCommodity || liveCommodity.stockQuantity <= 0) {
          skippedUnavailable += 1;
          continue;
        }
        const existingIdx = nextCart.findIndex(
          (c) => c.commodity.id === liveCommodity.id
        );
        const existingQty = existingIdx >= 0 ? nextCart[existingIdx].quantity : 0;
        const cappedQty = Math.min(
          liveCommodity.stockQuantity,
          existingQty + orderLine.quantity
        );
        if (cappedQty > existingQty) {
          addedLines += 1;
        } else {
          skippedUnavailable += 1;
        }

        if (existingIdx >= 0) {
          nextCart[existingIdx] = { commodity: liveCommodity, quantity: cappedQty };
        } else {
          nextCart.push({ commodity: liveCommodity, quantity: cappedQty });
        }
      }
      return nextCart;
    });

    if (addedLines > 0) {
      setCartOpen(true);
      showToast({
        message:
          skippedUnavailable > 0
            ? `Added available items to cart (${skippedUnavailable} capped or out of stock).`
            : 'All available items added to your cart.',
      });
    } else {
      showToast({
        message: 'None of the items in this order currently have available stock.',
      });
    }
  };

  const handleUpdateCartQty = (commodityId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.commodity.id !== commodityId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.commodity.id !== commodityId) return item;
        return {
          ...item,
          quantity: Math.min(item.commodity.stockQuantity, nextQty),
        };
      })
    );
  };

  const handleRemoveCartItem = (commodityId: string) => {
    setCart((prev) => prev.filter((item) => item.commodity.id !== commodityId));
  };

  const handleSeedDemo = async () => {
    if (!user) return;
    setSeeding(true);
    setAuthError(null);
    try {
      await seedDemoWorkspace(user);
      showToast({ message: 'Sample catalog and orders seeded.' });
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to seed workspace data.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleTrackRefSubmit = (refCode: string) => {
    setTrackRefTarget(refCode);
    setActiveView('track');
  };

  const handleOrderPlaced = (orderReference: string) => {
    setCartOpen(false);
    setTrackRefTarget(orderReference);
    setActiveView('track');
  };

  const handleProfileSaved = (updated: {
    displayName: string;
    phone: string;
    defaultAddress: string;
  }) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
    showToast({ message: 'Default delivery details saved.' });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const inspectedInCartQty = inspectedCommodity
    ? cart.find((c) => c.commodity.id === inspectedCommodity.id)?.quantity || 0
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-zinc-900">
      <TopBar
        activeView={activeView}
        onNavigate={setActiveView}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        user={user}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {authError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              aria-label="Dismiss error"
              className="text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'catalog' && (
          <CatalogSection
            commodities={commodities}
            loading={commoditiesLoading}
            cart={cart}
            activeOrder={activeOrder}
            onAddToCart={handleAddToCart}
            onInspectCommodity={setInspectedCommodity}
            onTrackRefSubmit={handleTrackRefSubmit}
            user={user}
            onSignIn={handleSignIn}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
          />
        )}

        {(activeView === 'orders' || activeView === 'track') && (
          <OrdersTrackingView
            user={user}
            orders={orders}
            loading={ordersLoading}
            initialSearchRef={trackRefTarget}
            onSignIn={handleSignIn}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
            onReorderItems={handleReorderItems}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}

        {activeView === 'dispatch' && (
          <DispatchConsoleView
            user={user}
            commodities={commodities}
            orders={orders}
            onSignIn={handleSignIn}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Mavuno Direct Commodities. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveView('orders')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveView('track')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Track Delivery
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dispatch')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Dispatch Console
            </button>
          </div>
        </div>
      </footer>

      {/* Live Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 max-w-sm bg-zinc-900 text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="font-semibold text-emerald-300 hover:text-emerald-200 whitespace-nowrap cursor-pointer"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <CommodityDetailModal
        key={inspectedCommodity?.id || 'closed'}
        commodity={inspectedCommodity}
        inCartQty={inspectedInCartQty}
        onClose={() => setInspectedCommodity(null)}
        onAddToCart={handleAddToCart}
      />

      <ProfileModal
        open={profileModalOpen}
        user={user}
        onClose={() => setProfileModalOpen(false)}
        onProfileSaved={handleProfileSaved}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        user={user}
        onSignIn={handleSignIn}
        onOrderPlaced={handleOrderPlaced}
        onProfileUpdated={(updated) =>
          setUser((prev) => (prev ? { ...prev, ...updated } : null))
        }
      />
    </div>
  );
}
