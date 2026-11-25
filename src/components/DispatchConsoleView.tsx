import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Truck,
  Unlock,
  UserCheck,
} from 'lucide-react';
import {
  advanceOrderStatus,
  assignOrderDispatcher,
  createCommodity,
  listUsersForAdmin,
  updateCommodityStock,
  updateUserRoleByAdmin,
} from '../services/firestoreService';
import {
  COMMODITY_CATEGORIES,
  Commodity,
  CommodityCategory,
  formatKes,
  getStockAvailability,
  Order,
  ORDER_STATUS_FLOW,
  UserProfile,
  UserRole,
} from '../types/commerce';

interface DispatchConsoleViewProps {
  user: UserProfile | null;
  commodities: Commodity[];
  orders: Order[];
  onSignIn: () => void;
  onSeedDemo: () => Promise<void>;
  seeding: boolean;
}

const PHOTO_OPTIONS: Array<{ label: string; category: CommodityCategory; imageUrl: string }> = [
  {
    label: 'Solid Dyed Couture Crepe Bolts',
    category: 'Silk & Satin Fabrics',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0005_491395f7.jpg',
  },
  {
    label: 'Shifoni Maua · Scarlet & Cobalt Floral',
    category: 'Silk & Satin Fabrics',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0006_85463d22.jpg',
  },
  {
    label: 'Shifoni Maua · Botanical & Paisley',
    category: 'Silk & Satin Fabrics',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0009_01569df1.jpg',
  },
  {
    label: 'Shifoni Maua · Pastel Rose & Toile',
    category: 'Linen & Cotton Textiles',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0007_d0d76b4e.jpg',
  },
  {
    label: 'Shifoni Maua · Polka Dot & Poppy',
    category: 'Linen & Cotton Textiles',
    imageUrl: '/assets/aistudio/IMG-20261125-WA0010_9c4fe833.jpg',
  },
  {
    label: 'Eau de Parfum Amber Flacon',
    category: 'Eau de Parfum',
    imageUrl: '/src/assets/images/perfume_amber_oud_1795606060003.jpg',
  },
  {
    label: 'Botanical & Oud Attar Dropper',
    category: 'Botanical & Oud Oils',
    imageUrl: '/src/assets/images/perfume_botanical_oil_1795606060646.jpg',
  },
];

const IMAGE_PRESETS: Record<CommodityCategory, string> = {
  'Silk & Satin Fabrics': PHOTO_OPTIONS[0].imageUrl,
  'Linen & Cotton Textiles': PHOTO_OPTIONS[3].imageUrl,
  'Eau de Parfum': PHOTO_OPTIONS[5].imageUrl,
  'Botanical & Oud Oils': PHOTO_OPTIONS[6].imageUrl,
};

type ConsoleTab = 'inventory' | 'dispatch' | 'roles';

export function DispatchConsoleView({
  user,
  commodities,
  orders,
  onSignIn,
  onSeedDemo,
  seeding,
}: DispatchConsoleViewProps) {
  const isAdmin = user?.role === 'admin';
  const isDispatcherOnly = user?.role === 'dispatcher';
  const isPrivileged = isAdmin || isDispatcherOnly;

  // Admins land on Vault Inventory; Dispatchers land on their Assigned Deliveries
  const [activeTab, setActiveTab] = useState<ConsoleTab>(isAdmin ? 'inventory' : 'dispatch');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [adminOverrideIds, setAdminOverrideIds] = useState<Record<string, boolean>>({});

  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CommodityCategory>('Silk & Satin Fabrics');
  const [newUnitLabel, setNewUnitLabel] = useState('per meter');
  const [newUnitPrice, setNewUnitPrice] = useState('3800');
  const [newStock, setNewStock] = useState('25');
  const [newThreshold, setNewThreshold] = useState('6');
  const [newOrigin, setNewOrigin] = useState('Fathy Textiles');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState(IMAGE_PRESETS['Silk & Satin Fabrics']);

  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (isDispatcherOnly) {
      setActiveTab((curr) => (curr === 'roles' ? 'dispatch' : curr));
    } else if (isAdmin) {
      setActiveTab((curr) => (curr === 'dispatch' ? 'inventory' : curr));
    }
  }, [isAdmin, isDispatcherOnly]);

  useEffect(() => {
    if (isAdmin) {
      void listUsersForAdmin()
        .then(setTeamUsers)
        .catch(() => setTeamUsers([]));
    }
  }, [isAdmin, activeTab]);

  const dispatchersList = useMemo(
    () => teamUsers.filter((m) => m.role === 'dispatcher' || m.role === 'admin'),
    [teamUsers]
  );

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <h1 className="font-display text-3xl font-semibold text-zinc-900">
            Atelier Dispatch &amp; Vault Console
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Sign in with an authorized administrator or courier dispatcher account to manage
            inventory or advance assigned deliveries.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isPrivileged) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <h1 className="font-display text-2xl font-semibold text-zinc-900">
              Dispatcher or Admin Role Required
            </h1>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            You are signed in as <span className="font-medium text-zinc-900">{user.email}</span>{' '}
            with role <span className="font-mono font-semibold">{user.role}</span>. Only accounts
            assigned <span className="font-mono">dispatcher</span> or{' '}
            <span className="font-mono">admin</span> permissions can open this workspace.
          </p>
        </div>
      </div>
    );
  }

  const handleAssignDispatcher = async (order: Order, nextDispatcherUid: string) => {
    if (!isAdmin) return;
    const targetMember = dispatchersList.find((m) => m.uid === nextDispatcherUid);
    const nextName = targetMember?.displayName || '';

    setAssigningId(order.id);
    setStatusFeedback(null);
    try {
      await assignOrderDispatcher(order.id, nextDispatcherUid, nextName);
      setStatusFeedback({
        type: 'success',
        text: nextDispatcherUid
          ? `Order ${order.orderReference} assigned to ${nextName}.`
          : `Order ${order.orderReference} unassigned from courier.`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to assign dispatcher.',
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    const idx = ORDER_STATUS_FLOW.indexOf(order.status);
    const nextStage = ORDER_STATUS_FLOW[idx + 1];
    if (!nextStage) return;

    const location =
      locationDrafts[order.id]?.trim() ||
      (nextStage === 'Packed & Ready'
        ? 'Lavington Tailoring & Fragrance Vault'
        : nextStage === 'In Transit'
        ? 'Waiyaki Way · Boutique Courier Corridor'
        : nextStage === 'Out for Delivery'
        ? 'Local Climate-Controlled Courier Van'
        : order.deliveryAddress);

    const notes =
      noteDrafts[order.id]?.trim() ||
      `Parcel progressed to ${nextStage} by ${isDispatcherOnly ? 'assigned dispatcher' : 'admin override'}.`;

    setAdvancingId(order.id);
    setStatusFeedback(null);
    try {
      await advanceOrderStatus({
        order,
        location,
        notes,
        updatedBy: user.displayName,
      });
      setStatusFeedback({
        type: 'success',
        text: `Order ${order.orderReference} advanced to ${nextStage}.`,
      });
      setLocationDrafts((p) => ({ ...p, [order.id]: '' }));
      setNoteDrafts((p) => ({ ...p, [order.id]: '' }));
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to advance order status.',
      });
    } finally {
      setAdvancingId(null);
    }
  };

  const handleQuickRestock = async (commodity: Commodity, delta: number) => {
    if (!isAdmin) return;
    setRestockingId(commodity.id);
    setStatusFeedback(null);
    try {
      await updateCommodityStock(commodity.id, commodity.stockQuantity + delta);
      setStatusFeedback({
        type: 'success',
        text: `${commodity.name} restocked (+${delta} ${commodity.unitLabel}).`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Restock failed.',
      });
    } finally {
      setRestockingId(null);
    }
  };

  const handleSetExactStock = async (commodity: Commodity) => {
    if (!isAdmin) return;
    const raw = stockDrafts[commodity.id];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;

    setRestockingId(commodity.id);
    setStatusFeedback(null);
    try {
      await updateCommodityStock(commodity.id, Math.floor(parsed));
      setStatusFeedback({
        type: 'success',
        text: `${commodity.name} stock updated to ${Math.floor(parsed)}.`,
      });
      setStockDrafts((p) => ({ ...p, [commodity.id]: '' }));
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Stock update failed.',
      });
    } finally {
      setRestockingId(null);
    }
  };

  const handleCreateCommodity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setStatusFeedback(null);
    try {
      await createCommodity({
        sku: newSku,
        name: newName,
        category: newCategory,
        description: newDescription,
        unitLabel: newUnitLabel,
        unitPrice: Number(newUnitPrice),
        stockQuantity: Number(newStock),
        lowStockThreshold: Number(newThreshold),
        imageUrl: newImageUrl || IMAGE_PRESETS[newCategory],
        origin: newOrigin,
      });
      setStatusFeedback({
        type: 'success',
        text: `${newName} added to boutique catalog.`,
      });
      setShowAddForm(false);
      setNewSku('');
      setNewName('');
      setNewDescription('');
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not add item.',
      });
    }
  };

  const handleRoleChange = async (targetUid: string, nextRole: UserRole) => {
    if (!isAdmin) return;
    try {
      await updateUserRoleByAdmin(targetUid, nextRole);
      setTeamUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: nextRole } : u))
      );
      setStatusFeedback({
        type: 'success',
        text: 'Team member role updated.',
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Role update failed.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Role-Specific Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-zinc-900">
            {isAdmin ? 'Boutique Admin & Vault Console' : 'Courier Dispatch Desk'}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Signed in as <span className="font-medium text-zinc-900">{user.displayName}</span> ·
            Role:{' '}
            <span className="font-mono font-semibold text-zinc-900">{user.role}</span> ·{' '}
            <span>
              {isAdmin
                ? 'Owns catalog, pricing, vault stock, team roles & dispatcher assignment'
                : 'Owns fulfillment milestones & courier tracking on assigned orders'}
            </span>
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            disabled={seeding}
            onClick={() => void onSeedDemo()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 bg-white text-zinc-900 text-xs font-medium hover:bg-stone-50 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C5C38]" />
            {seeding ? 'Syncing Catalog...' : 'Sync Fabric & Perfume Catalog'}
          </button>
        )}
      </div>

      {statusFeedback && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-medium border flex items-center gap-2 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {/* Role-Scoped Console Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl overflow-x-auto max-w-full">
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Vault Inventory ({commodities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'roles' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Team Roles ({teamUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'dispatch' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Order Assignment &amp; Oversight ({orders.length})
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'dispatch' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              My Assigned Deliveries ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Stock Reference (Read-Only)
            </button>
          </>
        )}
      </div>

      {/* Dispatch Queue (Dispatcher) OR Order Assignment & Oversight (Admin) */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#7C5C38] shrink-0" />
                <span>
                  Assign each incoming order to a <span className="font-mono font-semibold">dispatcher</span> below. Delivery progression stays locked from accidental admin edits unless you unlock override for an order.
                </span>
              </div>
              {dispatchersList.filter((m) => m.role === 'dispatcher').length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('roles')}
                  className="font-semibold text-zinc-900 underline whitespace-nowrap cursor-pointer self-start sm:self-auto"
                >
                  Promote a Dispatcher in Team Roles
                </button>
              )}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-900">
                {isDispatcherOnly
                  ? 'No orders are currently assigned to you.'
                  : 'No orders in the atelier dispatch queue yet.'}
              </p>
              {isDispatcherOnly && (
                <p className="text-xs text-stone-500">
                  Your administrator assigns orders to your courier account from the Admin Console so dispatchers never collide on the same parcel.
                </p>
              )}
            </div>
          ) : (
            orders.map((order) => {
              const idx = ORDER_STATUS_FLOW.indexOf(order.status);
              const nextStage = ORDER_STATUS_FLOW[idx + 1] || null;
              const isDelivered = order.status === 'Delivered';
              const isAssigned = Boolean(order.assignedDispatcherUid);
              const adminUnlocked = Boolean(adminOverrideIds[order.id]);
              const canAdvanceNow = isDispatcherOnly || (isAdmin && adminUnlocked);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-900">
                        {order.orderReference}
                      </span>
                      <span aria-hidden="true" className="text-stone-300">
                        ·
                      </span>
                      <span className="text-xs text-stone-600">{order.customerName}</span>
                      <span aria-hidden="true" className="text-stone-300">
                        ·
                      </span>
                      <span className="text-xs text-stone-600">{order.deliveryAddress}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-sm font-semibold text-zinc-900">
                        {formatKes(order.totalAmount)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isDelivered ? 'text-emerald-800' : 'text-[#7C5C38]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Admin Assignment Bar */}
                  {isAdmin && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] border border-stone-200 rounded-lg px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <label
                          htmlFor={`assign-${order.id}`}
                          className="font-medium text-stone-700 whitespace-nowrap"
                        >
                          Assigned Dispatcher:
                        </label>
                        <select
                          id={`assign-${order.id}`}
                          disabled={assigningId === order.id}
                          value={order.assignedDispatcherUid || ''}
                          onChange={(e) => void handleAssignDispatcher(order, e.target.value)}
                          className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
                        >
                          <option value="">Unassigned (Admin Queue)</option>
                          {dispatchersList.map((member) => (
                            <option key={member.uid} value={member.uid}>
                              {member.displayName} ({member.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      {nextStage && (
                        <button
                          type="button"
                          onClick={() =>
                            setAdminOverrideIds((prev) => ({
                              ...prev,
                              [order.id]: !prev[order.id],
                            }))
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-zinc-900 cursor-pointer self-start sm:self-auto"
                        >
                          {adminUnlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-amber-700" />
                              Lock Status Editing
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-stone-500" />
                              {isAssigned
                                ? `Handled by ${order.assignedDispatcherName || 'Dispatcher'} · Override`
                                : 'Unlock Admin Status Override'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {nextStage ? (
                    canAdvanceNow ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-medium text-stone-500 mb-1">
                            Checkpoint Location
                          </label>
                          <input
                            type="text"
                            value={locationDrafts[order.id] ?? ''}
                            onChange={(e) =>
                              setLocationDrafts((p) => ({ ...p, [order.id]: e.target.value }))
                            }
                            placeholder="e.g. Waiyaki Way · Westlands Courier"
                            className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-[11px] font-medium text-stone-500 mb-1">
                            Atelier / Courier Note
                          </label>
                          <input
                            type="text"
                            value={noteDrafts[order.id] ?? ''}
                            onChange={(e) =>
                              setNoteDrafts((p) => ({ ...p, [order.id]: e.target.value }))
                            }
                            placeholder="e.g. Silk rolled on tissue tube; parcel sealed"
                            className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <button
                            type="button"
                            disabled={advancingId === order.id}
                            onClick={() => void handleAdvanceStatus(order)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            {advancingId === order.id ? 'Updating...' : `Mark ${nextStage}`}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500">
                        {isAssigned
                          ? `Fulfillment locked to ${order.assignedDispatcherName || 'assigned dispatcher'} to prevent overlapping updates.`
                          : 'Assign a dispatcher above or click Unlock Admin Status Override to advance this order.'}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Courier handoff complete — client delivery confirmed.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vault Inventory Tab: Editable for Admin, Read-Only Reference for Dispatcher */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {isAdmin ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                {showAddForm ? 'Cancel New Item' : 'Add Fabric or Perfume'}
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-700">
              Read-only stock reference for packing verification. Only Administrators can add items, adjust prices, or restock vault quantities.
            </div>
          )}

          {isAdmin && showAddForm && (
            <form
              onSubmit={handleCreateCommodity}
              className="bg-white border border-stone-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs text-stone-600 mb-1">SKU</label>
                <input
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="PRF-ROS-50"
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Item Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Damask Rose Eau de Parfum"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as CommodityCategory;
                    setNewCategory(nextCat);
                    setNewImageUrl(IMAGE_PRESETS[nextCat]);
                  }}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {COMMODITY_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Origin</label>
                <input
                  required
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Unit Label</label>
                <input
                  required
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Unit Price (KES)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Initial Stock</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs text-stone-600 mb-1">
                  Weave / Scent Notes Description
                </label>
                <input
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Fabric weight/composition or fragrance top, heart, and base notes"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs text-stone-600 mb-1">Product Photo</label>
                <select
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                >
                  {PHOTO_OPTIONS.map((opt) => (
                    <option key={opt.imageUrl} value={opt.imageUrl}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer"
                >
                  Save to Collection
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF8F5] text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Fabric / Fragrance</th>
                  <th className="text-left font-medium px-4 py-3">Unit Price</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">On Hand</th>
                  {isAdmin && (
                    <th className="text-right font-medium px-4 py-3">Restock Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {commodities.map((c) => {
                  const status = getStockAvailability(c);
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{c.name}</p>
                        <p className="text-[11px] font-mono text-stone-500">
                          {c.sku} · {c.unitLabel}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-zinc-900">
                        {formatKes(c.unitPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            status === 'In Stock'
                              ? 'text-emerald-800'
                              : status === 'Low Stock'
                              ? 'text-amber-800'
                              : 'text-rose-700'
                          }`}
                        >
                          {status === 'Out of Stock' ? 'Sold Out' : status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-zinc-900">
                        {c.stockQuantity}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={restockingId === c.id}
                              onClick={() => void handleQuickRestock(c, 10)}
                              className="px-2.5 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 font-mono text-[11px] font-medium cursor-pointer"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              disabled={restockingId === c.id}
                              onClick={() => void handleQuickRestock(c, 25)}
                              className="px-2.5 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 font-mono text-[11px] font-medium cursor-pointer"
                            >
                              +25
                            </button>
                            <input
                              type="number"
                              min={0}
                              placeholder="Set"
                              value={stockDrafts[c.id] ?? ''}
                              onChange={(e) =>
                                setStockDrafts((p) => ({ ...p, [c.id]: e.target.value }))
                              }
                              className="w-16 px-2 py-1.5 rounded border border-stone-300 font-mono text-[11px]"
                            />
                            <button
                              type="button"
                              disabled={restockingId === c.id || !stockDrafts[c.id]}
                              onClick={() => void handleSetExactStock(c)}
                              className="px-2.5 py-1.5 rounded bg-zinc-900 text-white text-[11px] font-medium hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Roles Tab (Admin Only) */}
      {activeTab === 'roles' && isAdmin && (
        <div className="space-y-3">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-700">
            Assign <span className="font-mono font-semibold">dispatcher</span> to courier staff so they only access and update deliveries assigned to them without changing inventory prices or team permissions.
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF8F5] text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="text-left font-medium px-4 py-3">User</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Current Role</th>
                  <th className="text-right font-medium px-4 py-3">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {teamUsers.map((member) => (
                  <tr key={member.uid}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{member.displayName}</td>
                    <td className="px-4 py-3 text-stone-600">{member.email}</td>
                    <td className="px-4 py-3 font-mono text-zinc-900">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7C5C38]" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          void handleRoleChange(member.uid, e.target.value as UserRole)
                        }
                        className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                      >
                        <option value="customer">customer</option>
                        <option value="dispatcher">dispatcher</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
