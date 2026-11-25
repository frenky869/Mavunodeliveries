import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  LogIn,
  MapPin,
  PackageCheck,
  RotateCcw,
  Search,
  Settings,
  Truck,
} from 'lucide-react';
import { subscribeOrderDetails } from '../services/firestoreService';
import {
  DeliveryTrackingEvent,
  formatKes,
  Order,
  OrderItem,
  ORDER_STATUS_FLOW,
  OrderStatus,
  UserProfile,
} from '../types/commerce';

interface OrdersTrackingViewProps {
  user: UserProfile | null;
  orders: Order[];
  loading: boolean;
  initialSearchRef?: string;
  onSignIn: () => void;
  onSeedDemo: () => Promise<void>;
  seeding: boolean;
  onReorderItems: (items: OrderItem[]) => void;
  onOpenProfile: () => void;
}

function formatTimestamp(ts?: { toDate?: () => Date }): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Pending timestamp';
  return ts.toDate().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'Delivered':
      return CheckCircle2;
    case 'In Transit':
    case 'Out for Delivery':
      return Truck;
    case 'Packed & Ready':
      return PackageCheck;
    default:
      return Clock;
  }
}

export function OrdersTrackingView({
  user,
  orders,
  loading,
  initialSearchRef = '',
  onSignIn,
  onSeedDemo,
  seeding,
  onReorderItems,
  onOpenProfile,
}: OrdersTrackingViewProps) {
  const [searchRef, setSearchRef] = useState(initialSearchRef);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<DeliveryTrackingEvent[]>([]);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (initialSearchRef) {
      setSearchRef(initialSearchRef);
      const match = orders.find(
        (o) => o.orderReference.toUpperCase() === initialSearchRef.toUpperCase()
      );
      if (match) setSelectedOrderId(match.id);
    }
  }, [initialSearchRef, orders]);

  const filteredOrders = useMemo(() => {
    const q = searchRef.trim().toUpperCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderReference.toUpperCase().includes(q) ||
        o.deliveryAddress.toUpperCase().includes(q)
    );
  }, [orders, searchRef]);

  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return filteredOrders[0] || null;
  }, [orders, filteredOrders, selectedOrderId]);

  useEffect(() => {
    if (!activeOrder) {
      setItems([]);
      setTrackingEvents([]);
      return;
    }
    return subscribeOrderDetails(activeOrder.id, setItems, setTrackingEvents);
  }, [activeOrder?.id]);

  const handleCopyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <h1 className="font-display text-3xl font-semibold text-zinc-900">
            Sign in to view your orders &amp; live delivery timeline
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            Order history, courier addresses, and shipment milestones are protected per client
            account. Sign in to inspect your active dispatches.
          </p>
          <div className="pt-2">
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
      </div>
    );
  }

  const currentStageIndex = activeOrder
    ? ORDER_STATUS_FLOW.indexOf(activeOrder.status)
    : -1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header, Default Address Shortcut & Reference Lookup */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-zinc-900">
            Orders &amp; Courier Tracking
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Look up an order reference, reorder fabrics or perfumes in one click, or follow live
            courier checkpoints.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            Delivery Defaults
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Filter reference e.g. SSL-2026-2041"
              className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-sm text-stone-500">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-3">
          <h2 className="font-display text-2xl font-semibold text-zinc-900">
            No orders found for {user.displayName}
          </h2>
          <p className="text-sm text-stone-600">
            Place an order from the fabric &amp; fragrance collection, or load sample atelier
            shipments if signed in as an administrator.
          </p>
          {(user.role === 'admin' || user.role === 'dispatcher') && (
            <button
              type="button"
              disabled={seeding}
              onClick={() => void onSeedDemo()}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer"
            >
              {seeding ? 'Loading...' : 'Load Sample Atelier Orders'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order Cards */}
          <div className="lg:col-span-5 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-sm text-stone-600 space-y-2">
                <p>No orders match "{searchRef}".</p>
                <button
                  type="button"
                  onClick={() => setSearchRef('')}
                  className="text-xs font-medium text-zinc-900 underline cursor-pointer"
                >
                  Show all orders
                </button>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = activeOrder?.id === order.id;
                const Icon = getStatusIcon(order.status);
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left bg-white rounded-xl p-4 border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 ring-1 ring-zinc-900'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-zinc-900">
                          {order.orderReference}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {formatTimestamp(order.createdAt)} ·{' '}
                          <span className="font-mono tabular-nums">{order.itemCount}</span> units
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                          order.status === 'Delivered'
                            ? 'text-emerald-800'
                            : 'text-[#7C5C38]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-600 truncate max-w-[65%]">
                        {order.deliveryAddress}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-zinc-900">
                        {formatKes(order.totalAmount)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Step-by-Step Timeline & Receipt */}
          {activeOrder && (
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
                <div>
                  <p className="text-xs text-stone-500">Order Reference</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="font-mono text-xl font-bold text-zinc-900">
                      {activeOrder.orderReference}
                    </h2>
                    <button
                      type="button"
                      onClick={() => void handleCopyRef(activeOrder.orderReference)}
                      title="Copy reference number"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-[11px] text-stone-600 hover:text-zinc-900 hover:bg-stone-50 cursor-pointer"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-800" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={items.length === 0}
                    onClick={() => onReorderItems(items)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-zinc-900 hover:bg-stone-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-900" />
                    Reorder Items
                  </button>
                </div>
              </div>

              {/* Horizontal 5-Stage Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-600">Shipment Progress</span>
                  <span className="font-semibold text-zinc-900">{activeOrder.status}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {ORDER_STATUS_FLOW.map((stage, idx) => {
                    const reached = idx <= currentStageIndex;
                    return (
                      <div key={stage} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            reached ? 'bg-zinc-900' : 'bg-stone-200'
                          }`}
                        />
                        <p
                          className={`text-[11px] leading-tight truncate ${
                            reached ? 'font-medium text-zinc-900' : 'text-stone-400'
                          }`}
                          title={stage}
                        >
                          {stage}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Step-by-Step Delivery Timeline */}
              <div className="space-y-4 pt-2 border-t border-stone-100">
                <h3 className="font-display text-2xl font-semibold text-zinc-900">
                  Courier Checkpoint Log
                </h3>

                <ol className="space-y-4">
                  {ORDER_STATUS_FLOW.map((stage, index) => {
                    const completed = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const event = [...trackingEvents]
                      .reverse()
                      .find((ev) => ev.status === stage);
                    const StageIcon = getStatusIcon(stage);

                    return (
                      <li key={stage} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                              completed
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-[#FAF8F5] border-stone-300 text-stone-400'
                            }`}
                          >
                            <StageIcon className="w-4 h-4" />
                          </div>
                          {index < ORDER_STATUS_FLOW.length - 1 && (
                            <div
                              className={`w-px flex-1 min-h-[24px] mt-1 ${
                                index < currentStageIndex ? 'bg-zinc-900' : 'bg-stone-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className="pb-4 flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                completed ? 'text-zinc-900' : 'text-stone-400'
                              }`}
                            >
                              {stage}
                              {isCurrent ? ' (Current)' : ''}
                            </p>
                            <span className="text-xs font-mono text-stone-500">
                              {event ? formatTimestamp(event.createdAt) : 'Pending'}
                            </span>
                          </div>

                          {event ? (
                            <div className="mt-1 space-y-1">
                              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700">
                                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                {event.location}
                              </p>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                {event.notes}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                Logged by {event.updatedBy}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 mt-1">
                              Awaiting atelier dispatch update.
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Itemized Receipt & Delivery Destination */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
                  <div>
                    <p className="text-stone-500">Delivery Address</p>
                    <p className="font-medium text-zinc-900 mt-0.5">
                      {activeOrder.deliveryAddress}
                    </p>
                    {activeOrder.deliveryNotes && (
                      <p className="text-stone-600 mt-1">{activeOrder.deliveryNotes}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-stone-500">Recipient Contact</p>
                    <p className="font-medium text-zinc-900 mt-0.5">
                      {activeOrder.customerName} · {activeOrder.deliveryPhone}
                    </p>
                    <p className="text-stone-600 mt-0.5">{activeOrder.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Delivery Person</p>
                    <p className="font-medium text-zinc-900 mt-0.5">
                      {activeOrder.assignedDispatcherName || 'Awaiting Admin assignment'}
                    </p>
                    <p className="text-stone-600 mt-0.5">
                      {activeOrder.assignedDispatcherUid
                        ? 'Updating parcel progress live'
                        : 'Admin will assign a courier shortly'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 mb-2">
                    Ordered Fabrics &amp; Fragrances
                  </h3>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#FAF8F5] text-stone-600 border-b border-stone-200">
                        <tr>
                          <th className="text-left font-medium px-3.5 py-2.5">Item</th>
                          <th className="text-right font-medium px-3.5 py-2.5">Qty</th>
                          <th className="text-right font-medium px-3.5 py-2.5">Unit Price</th>
                          <th className="text-right font-medium px-3.5 py-2.5">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3.5 py-2.5 text-zinc-900 font-medium">
                              {item.commodityName}{' '}
                              <span className="text-stone-500 font-normal">
                                ({item.unitLabel})
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono tabular-nums text-stone-600">
                              {formatKes(item.unitPrice)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono tabular-nums font-semibold text-zinc-900">
                              {formatKes(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#FAF8F5] border-t border-stone-200">
                        <tr>
                          <td colSpan={3} className="px-3.5 py-2 text-right text-stone-600">
                            Courier Fee
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono tabular-nums">
                            {activeOrder.deliveryFee === 0
                              ? 'Complimentary'
                              : formatKes(activeOrder.deliveryFee)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3.5 py-2.5 text-right font-semibold text-zinc-900"
                          >
                            Total
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums font-bold text-zinc-900">
                            {formatKes(activeOrder.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
