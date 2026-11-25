import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase';
import { SEED_COMMODITIES } from './data/seedCommodities';
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
  VALID_BOUTIQUE_CATEGORIES,
} from './types/commerce';
import { TopBar, AppView } from './components/TopBar';
import { CatalogSection } from './components/CatalogSection';
import { CartDrawer } from './components/CartDrawer';
import { OrdersTrackingView } from './components/OrdersTrackingView';
import { DispatchConsoleView } from './components/DispatchConsoleView';
import { CommodityDetailModal } from './components/CommodityDetailModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginPage } from './components/LoginPage';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('catalog');
  const [returnView, setReturnView] = useState<Exclude<AppView, 'login'>>('catalog');
  const [reopenBagAfterLogin, setReopenBagAfterLogin] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<FirebaseUser | null>(null);
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
        setPendingVerificationUser(null);
        setOrders([]);
        setAuthLoading(false);
        return;
      }
      if (!firebaseUser.emailVerified) {
        setUser(null);
        setPendingVerificationUser(firebaseUser);
        setAuthLoading(false);
        return;
      }
      setPendingVerificationUser(null);
      try {
        await firebaseUser.getIdToken();
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

  // 1b. Auto-detect email verification when user verifies in another tab and returns
  useEffect(() => {
    if (!pendingVerificationUser) return;

    let cancelled = false;
    const checkNow = async () => {
      const current = auth.currentUser;
      if (!current || cancelled) return;
      try {
        await current.reload();
        if (current.emailVerified && !cancelled) {
          await current.getIdToken(true);
          const profile = await ensureUserProfile(current);
          if (cancelled) return;
          setPendingVerificationUser(null);
          setUser(profile);
          setAuthError(null);
          showToast({ message: 'Email verified! You can now place your order.' });
          setActiveView((curr) => (curr === 'login' ? returnView || 'catalog' : curr));
          if (reopenBagAfterLogin) {
            setCartOpen(true);
            setReopenBagAfterLogin(false);
          }
        }
      } catch {
        // Ignore transient network errors during background verification checks
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void checkNow();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const interval = window.setInterval(() => {
      void checkNow();
    }, 4000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(interval);
    };
  }, [pendingVerificationUser, returnView, reopenBagAfterLogin]);

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

  // Normalize deprecated pre-upload fabric paths on read while preserving live Firestore stock & pricing
  const displayCommodities = useMemo(() => {
    const seedById = new Map(SEED_COMMODITIES.map((s) => [s.id, s]));
    return commodities
      .filter(
        (c) =>
          !(
            c.id === 'wool_boucle_ivory' &&
            c.imageUrl.includes('/src/assets/images/fabric_')
          )
      )
      .map((c) => {
        const seed = seedById.get(c.id);
        if (seed && c.imageUrl.includes('/src/assets/images/fabric_')) {
          return {
            ...c,
            sku: seed.sku,
            name: seed.name,
            description: seed.description,
            origin: seed.origin,
            unitLabel: seed.unitLabel,
            imageUrl: seed.imageUrl,
          };
        }
        return c;
      });
  }, [commodities]);

  // 3. Auto-seed boutique catalog & sample orders when admin connects to empty or out-of-sync store
  useEffect(() => {
    const needsBoutiqueMigration =
      commodities.length === 0 ||
      commodities.some(
        (c) =>
          !VALID_BOUTIQUE_CATEGORIES.includes(c.category) ||
          c.imageUrl.includes('/src/assets/images/fabric_') ||
          c.id === 'wool_boucle_ivory'
      ) ||
      SEED_COMMODITIES.some((seed) => {
        const live = commodities.find((c) => c.id === seed.id);
        return (
          !live ||
          live.imageUrl !== seed.imageUrl ||
          live.name !== seed.name ||
          live.sku !== seed.sku
        );
      });

    if (
      !commoditiesLoading &&
      needsBoutiqueMigration &&
      user?.role === 'admin' &&
      !autoSeedAttempted.current
    ) {
      autoSeedAttempted.current = true;
      setSeeding(true);
      void seedDemoWorkspace(user)
        .then(({ seededCatalog, seededOrders }) => {
          if (seededCatalog > 0 || seededOrders > 0) {
            showToast({
              message: 'All 5 fabric photos and perfume collection synced.',
            });
          }
        })
        .catch((err) => {
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Unable to sync boutique catalog automatically.'
          );
        })
        .finally(() => setSeeding(false));
    }
  }, [commoditiesLoading, commodities, user]);

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

  const openLoginPage = (targetAfterLogin?: Exclude<AppView, 'login'>, openBag = false) => {
    setAuthError(null);
    if (targetAfterLogin) {
      setReturnView(targetAfterLogin);
    } else if (activeView !== 'login') {
      setReturnView(activeView);
    }
    setReopenBagAfterLogin(openBag);
    setCartOpen(false);
    setActiveView('login');
  };

  const completeAuthenticatedNavigation = () => {
    const nextView = returnView || 'catalog';
    setActiveView(nextView);
    if (reopenBagAfterLogin) {
      setCartOpen(true);
      setReopenBagAfterLogin(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const cred = await signInWithPopup(auth, googleAuthProvider);
    if (cred.user.emailVerified) {
      await cred.user.getIdToken(true);
      const profile = await ensureUserProfile(cred.user);
      setPendingVerificationUser(null);
      setUser(profile);
      completeAuthenticatedNavigation();
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setAuthError(null);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.reload();
    if (!cred.user.emailVerified) {
      setPendingVerificationUser(cred.user);
      return;
    }
    await cred.user.getIdToken(true);
    const profile = await ensureUserProfile(cred.user);
    setPendingVerificationUser(null);
    setUser(profile);
    completeAuthenticatedNavigation();
  };

  const handleEmailSignUp = async (fullName: string, email: string, password: string) => {
    setAuthError(null);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    setPendingVerificationUser(cred.user);
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Verification screen allows resending if initial send is rate-limited
    }
  };

  const handlePasswordReset = async (email: string) => {
    setAuthError(null);
    await sendPasswordResetEmail(auth, email);
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const handleCheckVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      await auth.currentUser.getIdToken(true);
      const profile = await ensureUserProfile(auth.currentUser);
      setPendingVerificationUser(null);
      setUser(profile);
      setAuthError(null);
      completeAuthenticatedNavigation();
      return true;
    }
    return false;
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setPendingVerificationUser(null);
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
      message: `Added ${quantity} × ${commodity.name} to bag.`,
      actionLabel: 'Open Bag',
      onAction: () => setCartOpen(true),
    });
  };

  const handleOrderNow = (commodity: Commodity, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.commodity.id === commodity.id);
      if (existing) {
        if (existing.quantity >= commodity.stockQuantity) return prev;
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
      if (commodity.stockQuantity <= 0) return prev;
      return [
        ...prev,
        {
          commodity,
          quantity: Math.min(commodity.stockQuantity, quantity),
        },
      ];
    });
    setCartOpen(true);
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
            ? `Added available pieces to bag (${skippedUnavailable} capped or sold out).`
            : 'All available pieces added to your bag.',
      });
    } else {
      showToast({
        message: 'None of the pieces in this order currently have available stock.',
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
      showToast({ message: 'Boutique fabric & perfume collection seeded.' });
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-zinc-900">
      <TopBar
        activeView={activeView}
        onNavigate={setActiveView}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        user={user}
        pendingVerificationEmail={pendingVerificationUser?.email ?? null}
        authLoading={authLoading}
        onSignIn={() => openLoginPage()}
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
        {activeView === 'login' && (
          <LoginPage
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            onPasswordReset={handlePasswordReset}
            pendingVerificationUser={pendingVerificationUser}
            onResendVerification={handleResendVerification}
            onCheckVerification={handleCheckVerification}
            onSignOutUnverified={handleSignOut}
            onBackToStore={() => setActiveView('catalog')}
          />
        )}

        {activeView === 'catalog' && (
          <CatalogSection
            commodities={displayCommodities}
            loading={commoditiesLoading}
            cart={cart}
            activeOrder={activeOrder}
            onAddToCart={handleAddToCart}
            onOrderNow={handleOrderNow}
            onInspectCommodity={setInspectedCommodity}
            onTrackRefSubmit={handleTrackRefSubmit}
            user={user}
            onSignIn={() => openLoginPage('catalog')}
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
            onSignIn={() => openLoginPage(activeView === 'track' ? 'track' : 'orders')}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
            onReorderItems={handleReorderItems}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}

        {activeView === 'dispatch' && (
          <DispatchConsoleView
            user={user}
            commodities={displayCommodities}
            orders={orders}
            onSignIn={() => openLoginPage('dispatch')}
            onSeedDemo={handleSeedDemo}
            seeding={seeding}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Sable &amp; Silk Atelier. Fine Fabrics &amp; Artisanal Perfumes.</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className="hover:text-zinc-900 cursor-pointer"
            >
              Collection
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
              Atelier Console
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
          <CheckCircle2 className="w-4 h-4 text-[#D6B588] shrink-0" />
          <span className="flex-1">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="font-semibold text-[#E8CFA6] hover:text-white whitespace-nowrap cursor-pointer"
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
        onOrderNow={handleOrderNow}
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
        pendingVerificationEmail={pendingVerificationUser?.email ?? null}
        onCheckVerification={handleCheckVerification}
        onResendVerification={handleResendVerification}
        onGoogleSignIn={handleGoogleSignIn}
        onSignIn={() => openLoginPage('catalog', true)}
        onOrderPlaced={handleOrderPlaced}
        onProfileUpdated={(updated) =>
          setUser((prev) => (prev ? { ...prev, ...updated } : null))
        }
      />
    </div>
  );
}
