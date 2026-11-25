import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from 'lucide-react';
import { HERO_WAREHOUSE_IMAGE } from '../data/seedCommodities';
import {
  CartItem,
  COMMODITY_CATEGORIES,
  Commodity,
  CommodityCategory,
  formatKes,
  getStockAvailability,
  Order,
  UserProfile,
} from '../types/commerce';
import { CommodityImage } from './CommodityImage';

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'stock-desc';

interface CatalogSectionProps {
  commodities: Commodity[];
  loading: boolean;
  cart: CartItem[];
  activeOrder: Order | null;
  onAddToCart: (commodity: Commodity, quantity: number) => void;
  onInspectCommodity: (commodity: Commodity) => void;
  onTrackRefSubmit: (refCode: string) => void;
  user: UserProfile | null;
  onSignIn: () => void;
  onSeedDemo: () => Promise<void>;
  seeding: boolean;
}

export function CatalogSection({
  commodities,
  loading,
  cart,
  activeOrder,
  onAddToCart,
  onInspectCommodity,
  onTrackRefSubmit,
  user,
  onSignIn,
  onSeedDemo,
  seeding,
}: CatalogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CommodityCategory>('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [quickRef, setQuickRef] = useState('');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.commodity.id] = item.quantity;
    }
    return map;
  }, [cart]);

  const filteredCommodities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = commodities.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (inStockOnly && item.stockQuantity <= 0) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.unitPrice - b.unitPrice;
      if (sortBy === 'price-desc') return b.unitPrice - a.unitPrice;
      if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
      return a.name.localeCompare(b.name);
    });
  }, [commodities, selectedCategory, inStockOnly, searchQuery, sortBy]);

  const handleStepDraft = (commodity: Commodity, delta: number) => {
    const inCart = cartQtyMap[commodity.id] || 0;
    const maxAddable = Math.max(0, commodity.stockQuantity - inCart);
    const current = draftQuantities[commodity.id] ?? 1;
    const next = Math.max(1, Math.min(maxAddable || 1, current + delta));
    setDraftQuantities((prev) => ({ ...prev, [commodity.id]: next }));
  };

  const handleAdd = (commodity: Commodity) => {
    const inCart = cartQtyMap[commodity.id] || 0;
    const maxAddable = Math.max(0, commodity.stockQuantity - inCart);
    if (maxAddable <= 0) return;

    const requested = Math.min(maxAddable, draftQuantities[commodity.id] ?? 1);
    onAddToCart(commodity, requested);
    setDraftQuantities((prev) => ({ ...prev, [commodity.id]: 1 }));
    setAddedFeedbackId(commodity.id);
    setTimeout(() => {
      setAddedFeedbackId((curr) => (curr === commodity.id ? null : curr));
    }, 1500);
  };

  const handleTrackForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRef.trim()) return;
    onTrackRefSubmit(quickRef.trim().toUpperCase());
  };

  const inStockCount = commodities.filter((c) => c.stockQuantity > c.lowStockThreshold).length;
  const lowStockCount = commodities.filter(
    (c) => c.stockQuantity > 0 && c.stockQuantity <= c.lowStockThreshold
  ).length;

  return (
    <div className="space-y-12 pb-16">
      {/* Contextual Active Shipment Bar for Signed-In Customers */}
      {user && activeOrder && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-xs">
              <Truck className="w-4 h-4 text-emerald-900 shrink-0" />
              <span className="text-stone-600">Active shipment:</span>
              <span className="font-mono font-semibold text-zinc-900">
                {activeOrder.orderReference}
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="font-medium text-emerald-900">{activeOrder.status}</span>
            </div>
            <button
              type="button"
              onClick={() => onTrackRefSubmit(activeOrder.orderReference)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-700 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              View Live Timeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Split Storefront Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                <span>Nairobi Central Depot</span>
                <span aria-hidden="true">·</span>
                <span>Wholesale & Household Staples</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-stone-700">
                  {commodities.length} Active SKUs
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight text-zinc-900 leading-[1.12] [text-wrap:balance]">
                Verified grain, pulses, and pantry staples with live warehouse stock.
              </h1>

              <p className="text-base text-stone-600 leading-relaxed max-w-xl">
                Order maize, beans, Mwea Pishori rice, cane sugar, and cooking oil directly from
                depot inventory. Stock is reserved atomically at checkout with live 5-stage
                delivery tracking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#catalog-grid"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Browse Commodities
                  <ArrowRight className="w-4 h-4" />
                </a>

                {!user && (
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-stone-300 bg-white text-zinc-900 text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign In to Order & Track
                  </button>
                )}
              </div>

              {/* Quick Order Reference Lookup */}
              <form
                onSubmit={handleTrackForm}
                className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5 sm:items-center"
              >
                <label htmlFor="quick-track-ref" className="text-xs font-medium text-stone-600 whitespace-nowrap">
                  Track shipment:
                </label>
                <div className="flex flex-1 max-w-sm gap-2">
                  <input
                    id="quick-track-ref"
                    type="text"
                    value={quickRef}
                    onChange={(e) => setQuickRef(e.target.value)}
                    placeholder="Enter reference e.g. MVN-2026-1042"
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-[#F7F7F5] border border-stone-300 rounded-lg text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-white text-zinc-800 hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 min-h-[260px] lg:min-h-[420px] relative bg-stone-100">
            <CommodityImage
              src={HERO_WAREHOUSE_IMAGE}
              alt="Mavuno Direct agricultural commodity warehouse with stacked grain sacks and pantry jars"
              className="lg:h-full"
            />
          </div>
        </div>

        {/* Full-width 4-column summary strip below hero */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3.5">
            <p className="text-xs text-stone-500">Catalog Availability</p>
            <p className="mt-1 font-mono tabular-nums text-lg font-semibold text-zinc-900">
              {inStockCount} In Stock
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3.5">
            <p className="text-xs text-stone-500">Low Stock Alerts</p>
            <p className="mt-1 font-mono tabular-nums text-lg font-semibold text-amber-800">
              {lowStockCount} Low Stock
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3.5">
            <p className="text-xs text-stone-500">Free Regional Delivery</p>
            <p className="mt-1 font-mono tabular-nums text-lg font-semibold text-zinc-900">
              KES 15,000+
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3.5">
            <p className="text-xs text-stone-500">Fulfillment Standard</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">5-Stage Tracking</p>
          </div>
        </div>
      </section>

      {/* Catalog Toolbar & Commodity Grid */}
      <section id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">
              Live Commodity Catalog
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">
              Click any item for full origin specifications, or add quantities directly to your cart.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search maize, rice, origin..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-800"
              />
            </div>

            <select
              aria-label="Sort commodities"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-xs font-medium bg-white border border-stone-300 rounded-lg text-zinc-800 focus:outline-none focus:border-emerald-800 cursor-pointer"
            >
              <option value="name">Sort: Name (A–Z)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-desc">Highest Stock First</option>
            </select>

            <button
              type="button"
              onClick={() => setInStockOnly((v) => !v)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                inStockOnly
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              {inStockOnly ? 'Available Only' : 'All Stock'}
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl overflow-x-auto max-w-full">
            {COMMODITY_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-stone-500 font-mono tabular-nums">
            Showing {filteredCommodities.length} of {commodities.length} items
          </span>
        </div>

        {/* Empty / Loading / Grid States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-stone-200 rounded" />
                  <div className="h-5 w-3/4 bg-stone-200 rounded" />
                  <div className="h-4 w-full bg-stone-100 rounded" />
                  <div className="h-9 w-full bg-stone-200 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : commodities.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
            <h3 className="font-display text-lg font-semibold text-zinc-900">
              Catalog inventory is not initialized yet
            </h3>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {user?.role === 'admin' || user?.role === 'dispatcher'
                ? 'Load the starter catalog of agricultural grains, legumes, sugar, cooking oil, and sample in-transit orders into Firestore.'
                : 'Sign in with an administrator account to initialize the live commodity catalog and sample shipments.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {user?.role === 'admin' || user?.role === 'dispatcher' ? (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={() => void onSeedDemo()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {seeding ? 'Seeding Warehouse...' : 'Seed Sample Catalog & Orders'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-800 cursor-pointer"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        ) : filteredCommodities.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-zinc-900">
              No commodities match your current filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setInStockOnly(false);
                setSortBy('name');
              }}
              className="mt-3 text-xs font-medium text-emerald-900 underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommodities.map((commodity) => {
              const availability = getStockAvailability(commodity);
              const inCart = cartQtyMap[commodity.id] || 0;
              const maxAddable = Math.max(0, commodity.stockQuantity - inCart);
              const draftQty = Math.min(
                Math.max(1, draftQuantities[commodity.id] ?? 1),
                Math.max(1, maxAddable)
              );
              const isOut = availability === 'Out of Stock';
              const isMaxedInCart = !isOut && maxAddable === 0;
              const justAdded = addedFeedbackId === commodity.id;

              return (
                <article
                  key={commodity.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => onInspectCommodity(commodity)}
                    className="aspect-[4/3] bg-stone-100 overflow-hidden block w-full text-left cursor-pointer group relative"
                  >
                    <CommodityImage
                      src={commodity.imageUrl}
                      alt={commodity.name}
                      className="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      {/* Unboxed metadata with typographic separators */}
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{commodity.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{commodity.origin}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onInspectCommodity(commodity)}
                          className="inline-flex items-center gap-1 text-stone-500 hover:text-zinc-900 shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInspectCommodity(commodity)}
                        className="text-left block w-full cursor-pointer"
                      >
                        <h3 className="font-display text-base font-semibold text-zinc-900 hover:text-emerald-900 transition-colors leading-snug">
                          {commodity.name}
                        </h3>
                      </button>

                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                        {commodity.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      {/* Price & Live Stock Readout */}
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="font-mono tabular-nums text-lg font-semibold text-zinc-900">
                            {formatKes(commodity.unitPrice)}
                          </span>
                          <span className="text-xs text-stone-500 ml-1.5">
                            / {commodity.unitLabel}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-stone-400">
                          {commodity.sku}
                        </span>
                      </div>

                      {/* Semantic Stock Status (icon + explicit label, no pill enclosure) */}
                      <div className="flex items-center justify-between text-xs">
                        {availability === 'In Stock' && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>In Stock</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {commodity.stockQuantity} available
                            </span>
                          </span>
                        )}
                        {availability === 'Low Stock' && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Low Stock</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Only {commodity.stockQuantity} left
                            </span>
                          </span>
                        )}
                        {availability === 'Out of Stock' && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Out of Stock</span>
                          </span>
                        )}

                        {inCart > 0 && (
                          <span className="font-mono tabular-nums text-stone-600">
                            {inCart} in cart
                          </span>
                        )}
                      </div>

                      {/* Stepper + Add CTA */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="inline-flex items-center border border-stone-300 rounded-lg bg-[#F7F7F5]">
                          <button
                            type="button"
                            disabled={isOut || isMaxedInCart || draftQty <= 1}
                            onClick={() => handleStepDraft(commodity, -1)}
                            aria-label={`Decrease quantity for ${commodity.name}`}
                            className="p-2 text-stone-700 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono tabular-nums text-xs font-medium text-zinc-900">
                            {isOut || isMaxedInCart ? 0 : draftQty}
                          </span>
                          <button
                            type="button"
                            disabled={isOut || isMaxedInCart || draftQty >= maxAddable}
                            onClick={() => handleStepDraft(commodity, 1)}
                            aria-label={`Increase quantity for ${commodity.name}`}
                            className="p-2 text-stone-700 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isOut || isMaxedInCart}
                          onClick={() => handleAdd(commodity)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                            isOut || isMaxedInCart
                              ? 'bg-stone-200 text-stone-500'
                              : justAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-900 text-white hover:bg-emerald-800'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {isOut
                            ? 'Unavailable'
                            : isMaxedInCart
                            ? 'Max Stock in Cart'
                            : justAdded
                            ? 'Added to Cart'
                            : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
