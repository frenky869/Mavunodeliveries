import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  X,
  XCircle,
} from 'lucide-react';
import {
  Commodity,
  formatKes,
  getStockAvailability,
} from '../types/commerce';
import { CommodityImage } from './CommodityImage';

interface CommodityDetailModalProps {
  commodity: Commodity | null;
  inCartQty: number;
  onClose: () => void;
  onAddToCart: (commodity: Commodity, quantity: number) => void;
  onOrderNow: (commodity: Commodity, quantity: number) => void;
}

export function CommodityDetailModal({
  commodity,
  inCartQty,
  onClose,
  onAddToCart,
  onOrderNow,
}: CommodityDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!commodity) return null;

  const availability = getStockAvailability(commodity);
  const maxAddable = Math.max(0, commodity.stockQuantity - inCartQty);
  const safeQty = maxAddable > 0 ? Math.min(quantity, maxAddable) : 0;
  const isOut = availability === 'Out of Stock';
  const isMaxed = !isOut && maxAddable === 0;

  const handleConfirmAdd = () => {
    if (safeQty <= 0) return;
    onAddToCart(commodity, safeQty);
    onClose();
  };

  const handleDirectOrder = () => {
    if (isOut) return;
    onOrderNow(commodity, safeQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commodity-modal-title"
        className="relative z-10 w-full max-w-3xl bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12 items-stretch"
      >
        <div className="md:col-span-6 bg-[#F3EFE8] min-h-[240px]">
          <CommodityImage src={commodity.imageUrl} alt={commodity.name} className="md:h-full" />
        </div>

        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5">
                <span>{commodity.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{commodity.sku}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close product details"
                className="p-1.5 rounded-lg text-stone-400 hover:text-zinc-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2
              id="commodity-modal-title"
              className="font-display text-3xl font-semibold text-zinc-900 leading-tight"
            >
              {commodity.name}
            </h2>

            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
              <MapPin className="w-3.5 h-3.5 text-[#7C5C38]" />
              Crafted in {commodity.origin}
            </p>

            <p className="text-sm text-stone-600 leading-relaxed">{commodity.description}</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono tabular-nums text-2xl font-bold text-zinc-900">
                  {formatKes(commodity.unitPrice)}
                </span>
                <span className="text-xs text-stone-500 ml-1.5">/ {commodity.unitLabel}</span>
              </div>

              {availability === 'In Stock' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  In Stock ({commodity.stockQuantity})
                </span>
              )}
              {availability === 'Low Stock' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  Low Stock ({commodity.stockQuantity} left)
                </span>
              )}
              {availability === 'Out of Stock' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                  <XCircle className="w-4 h-4" />
                  Sold Out
                </span>
              )}
            </div>

            {inCartQty > 0 && (
              <p className="text-xs text-stone-600">
                Currently in your bag:{' '}
                <span className="font-mono font-semibold text-zinc-900">{inCartQty}</span>{' '}
                {commodity.unitLabel}
              </p>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-stone-300 rounded-lg bg-[#FAF8F5]">
                  <button
                    type="button"
                    disabled={isOut || isMaxed || safeQty <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-2.5 text-stone-700 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-mono tabular-nums text-sm font-semibold">
                    {safeQty}
                  </span>
                  <button
                    type="button"
                    disabled={isOut || isMaxed || safeQty >= maxAddable}
                    onClick={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
                    aria-label="Increase quantity"
                    className="p-2.5 text-stone-700 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOut || isMaxed}
                  onClick={handleConfirmAdd}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-zinc-900 text-sm font-medium hover:bg-stone-50 disabled:bg-stone-100 disabled:border-stone-200 disabled:text-stone-400 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isOut ? 'Sold Out' : isMaxed ? 'Max in Bag' : 'Add to Bag'}
                </button>
              </div>

              <button
                type="button"
                disabled={isOut}
                onClick={handleDirectOrder}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:bg-stone-200 disabled:text-stone-500 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span>
                  {isOut
                    ? 'Sold Out'
                    : isMaxed
                    ? `Order Now (${inCartQty} in bag)`
                    : `Order Now · ${formatKes(commodity.unitPrice * safeQty)}`}
                </span>
                {!isOut && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
