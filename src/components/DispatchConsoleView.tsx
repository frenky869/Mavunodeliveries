import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  advanceOrderStatus,
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

const IMAGE_PRESETS: Record<CommodityCategory, string> = {
  'Grains & Cereals': '/src/assets/images/commodity_maize_grain_1795601314397.jpg',
  'Pulses & Legumes': '/src/assets/images/commodity_beans_pulses_1795601314512.jpg',
  'Sugar & Sweeteners': '/src/assets/images/commodity_cane_sugar_1795601315533.jpg',
  'Oils & Pantry': '/src/assets/images/commodity_cooking_oil_1795601315949.jpg',
};

export function DispatchConsoleView({
  user,
  commodities,
  orders,
  onSignIn,
  onSeedDemo,
  seeding,
}: DispatchConsoleViewProps) {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'inventory' | 'roles'>('dispatch');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Per-order location and note drafts for advancing status
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Restock inputs
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [restockingId, setRestockingId] = useState<string | null>(null);

  // New commodity form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CommodityCategory>('Grains & Cereals');
  const [newUnitLabel, setNewUnitLabel] = useState('50kg bag');
  const [newUnitPrice, setNewUnitPrice] = useState('3200');
  const [newStock, setNewStock] = useState('25');
  const [newThreshold, setNewThreshold] = useState('8');
  const [newOrigin, setNewOrigin] = useState('Nakuru');
  const [newDescription, setNewDescription] = useState('');

  // Team roles (Admin only)
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);

  const isPrivileged = user?.role === 'admin' || user?.role === 'dispatcher';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin && activeTab === 'roles') {
      void listUsersForAdmin()
        .then(setTeamUsers)
        .catch(() => setTeamUsers([]));
    }
  }, [isAdmin, activeTab]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <h1 className="font-display text-2xl font-semibold text-zinc-900">
            Dispatcher & Warehouse Console
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Sign in with an authorized dispatcher or administrator account to restock commodities
            and update shipment milestones.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-800 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In with Google
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
            <h1 className="font-display text-xl font-semibold text-zinc-900">
              Dispatcher or Admin Role Required
            </h1>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            You are signed in as <span className="font-medium text-zinc-900">{user.email}</span>{' '}
            with role <span className="font-mono font-semibold">{user.role}</span>. Only accounts
            assigned <span className="font-mono">dispatcher</span> or{' '}
            <span className="font-mono">admin</span> permissions can modify warehouse stock or
            advance delivery statuses.
          </p>
        </div>
      </div>
    );
  }

  const handleAdvanceStatus = async (order: Order) => {
    const idx = ORDER_STATUS_FLOW.indexOf(order.status);
    const nextStage = ORDER_STATUS_FLOW[idx + 1];
    if (!nextStage) return;

    const location =
      locationDrafts[order.id]?.trim() ||
      (nextStage === 'Packed & Ready'
        ? 'Nairobi Central Dispatch Bay'
        : nextStage === 'In Transit'
        ? 'Regional Highway Transit Corridor'
        : nextStage === 'Out for Delivery'
        ? 'Local Delivery Van · Last Mile'
        : order.deliveryAddress);

    const notes =
      noteDrafts[order.id]?.trim() ||
      `Shipment progressed to ${nextStage} by dispatch team.`;

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
        imageUrl: IMAGE_PRESETS[newCategory],
        origin: newOrigin,
      });
      setStatusFeedback({
        type: 'success',
        text: `${newName} added to live catalog.`,
      });
      setShowAddForm(false);
      setNewSku('');
      setNewName('');
      setNewDescription('');
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not add commodity.',
      });
    }
  };

  const handleRoleChange = async (targetUid: string, nextRole: UserRole) => {
    try {
      await updateUserRoleByAdmin(targetUid, nextRole);
      setTeamUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: nextRole } : u))
      );
      setStatusFeedback({
        type: 'success',
        text: 'User role updated.',
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">
            Dispatch & Inventory Console
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Signed in as <span className="font-medium text-zinc-900">{user.displayName}</span> ·
            Role: <span className="font-mono font-semibold text-emerald-900">{user.role}</span>
          </p>
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={() => void onSeedDemo()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 bg-white text-zinc-900 text-xs font-medium hover:bg-stone-50 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-900" />
          {seeding ? 'Seeding Workspace...' : 'Seed Demo Catalog & Orders'}
        </button>
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

      {/* Segmented Console Tabs */}
      <div className="inline-flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'dispatch' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Delivery Dispatch Queue ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'inventory' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Warehouse Stock ({commodities.length})
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'roles' ? 'bg-white text-zinc-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            Team Roles
          </button>
        )}
      </div>

      {/* Dispatch Queue Tab */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-600">
              No orders in the dispatch queue yet.
            </div>
          ) : (
            orders.map((order) => {
              const idx = ORDER_STATUS_FLOW.indexOf(order.status);
              const nextStage = ORDER_STATUS_FLOW[idx + 1] || null;
              const isDelivered = order.status === 'Delivered';

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
                          isDelivered ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {nextStage ? (
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
                          placeholder="e.g. Thika Highway · Juja Weighbridge"
                          className="w-full px-3 py-2 text-xs bg-[#F7F7F5] border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-medium text-stone-500 mb-1">
                          Dispatch Note
                        </label>
                        <input
                          type="text"
                          value={noteDrafts[order.id] ?? ''}
                          onChange={(e) =>
                            setNoteDrafts((p) => ({ ...p, [order.id]: e.target.value }))
                          }
                          placeholder="e.g. Driver departed bay with sealed manifest"
                          className="w-full px-3 py-2 text-xs bg-[#F7F7F5] border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <button
                          type="button"
                          disabled={advancingId === order.id}
                          onClick={() => void handleAdvanceStatus(order)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          {advancingId === order.id
                            ? 'Updating...'
                            : `Mark ${nextStage}`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Fulfillment complete — customer delivery confirmed.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Inventory & Restock Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              {showAddForm ? 'Cancel New Commodity' : 'Add Commodity'}
            </button>
          </div>

          {showAddForm && (
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
                  placeholder="GRN-FLR-25KG"
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Commodity Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Fortified Maize Flour"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CommodityCategory)}
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
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs text-stone-600 mb-1">Description</label>
                <input
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Grade, moisture level, and packaging details"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800 cursor-pointer"
                >
                  Save Commodity
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F7F5] text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Commodity</th>
                  <th className="text-left font-medium px-4 py-3">Unit Price</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">On Hand</th>
                  <th className="text-right font-medium px-4 py-3">Restock Actions</th>
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
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-zinc-900">
                        {c.stockQuantity}
                      </td>
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
                            onClick={() => void handleQuickRestock(c, 50)}
                            className="px-2.5 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-50 font-mono text-[11px] font-medium cursor-pointer"
                          >
                            +50
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
                            className="px-2.5 py-1.5 rounded bg-emerald-900 text-white text-[11px] font-medium hover:bg-emerald-800 disabled:opacity-40 cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Roles Tab (Admin) */}
      {activeTab === 'roles' && isAdmin && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#F7F7F5] text-stone-600 border-b border-stone-200">
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
                  <td className="px-4 py-3 font-mono text-emerald-900">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
}
