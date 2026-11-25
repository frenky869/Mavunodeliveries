import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  placeOrderTransaction,
  updateUserProfileDetails,
} from '../services/firestoreService';
import { CartItem, formatKes, UserProfile } from '../types/commerce';
import { AddressLocationPicker } from './AddressLocationPicker';
import { CommodityImage } from './CommodityImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (commodityId: string, nextQty: number) => void;
  onRemoveItem: (commodityId: string) => void;
  onClearCart: () => void;
  user: UserProfile | null;
  onSignIn: () => void;
  onOrderPlaced: (orderReference: string) => void;
  onProfileUpdated: (updated: { displayName: string; phone: string; defaultAddress: string }) => void;
}

export function CartDrawer({
  open,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  user,
  onSignIn,
  onOrderPlaced,
  onProfileUpdated,
}: CartDrawerProps) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.defaultAddress || '');
  const [notes, setNotes] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedRef, setPlacedRef] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPhone((prev) => prev || user.phone || '');
      setAddress((prev) => prev || user.defaultAddress || '');
    }
  }, [user]);

  if (!open) return null;

  const subtotal = cart.reduce(
    (acc, item) => acc + item.commodity.unitPrice * item.quantity,
    0
  );
  const deliveryFee = cart.length === 0 ? 0 : subtotal >= 15000 ? 0 : 450;
  const total = subtotal + deliveryFee;
  const freeDeliveryRemaining = Math.max(0, 15000 - subtotal);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      onSignIn();
      return;
    }

    if (phone.trim().length < 5) {
      setErrorMsg('Please enter a valid contact phone number (minimum 5 characters).');
      return;
    }

    if (address.trim().length < 5) {
      setErrorMsg('Please provide a delivery street, studio, or residence address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeOrderTransaction({
        user,
        cartItems: cart,
        deliveryPhone: phone,
        deliveryAddress: address,
        deliveryNotes: notes,
      });

      if (saveAsDefault) {
        const nextProfile = {
          displayName: user.displayName,
          phone: phone.trim(),
          defaultAddress: address.trim(),
        };
        await updateUserProfileDetails(user.uid, nextProfile).catch(() => undefined);
        onProfileUpdated(nextProfile);
      }

      onClearCart();
      setNotes('');
      setPlacedRef(result.orderReference);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not complete order. Please verify stock.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-stone-200 shadow-xl">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-zinc-900" />
            <h2 className="font-display text-2xl font-semibold text-zinc-900">
              Shopping Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="p-2 rounded-lg text-stone-500 hover:text-zinc-900 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {placedRef && (
            <div className="bg-[#FAF8F5] border border-stone-300 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Order Confirmed &amp; Stock Reserved
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    Reference:{' '}
                    <span className="font-mono font-semibold text-zinc-900">{placedRef}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const ref = placedRef;
                  setPlacedRef(null);
                  onOrderPlaced(ref);
                }}
                className="w-full py-2 px-3 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 cursor-pointer"
              >
                View Live Delivery Timeline
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-900">Your bag is empty</p>
              <p className="text-xs text-stone-500">
                Add fine silk, Belgian linen, Eau de Parfum, or oud oils from the collection.
              </p>
            </div>
          ) : (
            <>
              {freeDeliveryRemaining > 0 ? (
                <div className="bg-[#FAF8F5] border border-stone-200 rounded-lg px-3.5 py-2.5 text-xs text-stone-700">
                  Add{' '}
                  <span className="font-mono font-semibold text-zinc-900">
                    {formatKes(freeDeliveryRemaining)}
                  </span>{' '}
                  more for complimentary atelier courier delivery.
                </div>
              ) : (
                <div className="bg-[#F3EFE8] border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-zinc-900 font-medium">
                  Complimentary atelier courier unlocked on this order.
                </div>
              )}

              <ul className="divide-y divide-stone-200">
                {cart.map(({ commodity, quantity }) => {
                  const atMax = quantity >= commodity.stockQuantity;
                  return (
                    <li key={commodity.id} className="py-4 flex gap-3.5">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F3EFE8] shrink-0 border border-stone-200">
                        <CommodityImage src={commodity.imageUrl} alt={commodity.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {commodity.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(commodity.id)}
                            aria-label={`Remove ${commodity.name}`}
                            className="text-stone-400 hover:text-rose-700 cursor-pointer p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          <span className="font-mono tabular-nums">
                            {formatKes(commodity.unitPrice)}
                          </span>{' '}
                          / {commodity.unitLabel}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-stone-300 rounded-md bg-[#FAF8F5]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(commodity.id, quantity - 1)}
                              className="p-1.5 text-stone-700 hover:text-zinc-900 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono tabular-nums text-xs font-medium">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={atMax}
                              onClick={() => onUpdateQty(commodity.id, quantity + 1)}
                              className="p-1.5 text-stone-700 hover:text-zinc-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono tabular-nums text-sm font-semibold text-zinc-900">
                            {formatKes(commodity.unitPrice * quantity)}
                          </span>
                        </div>

                        {atMax && (
                          <p className="text-[11px] text-amber-800 mt-1">
                            Maximum available vault stock ({commodity.stockQuantity}) selected.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Delivery Form */}
              <form
                id="checkout-form"
                onSubmit={handleCheckout}
                className="space-y-3.5 pt-3 border-t border-stone-200"
              >
                <h3 className="text-xs font-semibold text-zinc-900">
                  Courier Destination
                </h3>

                <div>
                  <label htmlFor="delivery-phone" className="block text-xs text-stone-600 mb-1">
                    Recipient Phone
                  </label>
                  <input
                    id="delivery-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <AddressLocationPicker
                  id="delivery-address"
                  label="Delivery Address / Studio / Residence"
                  required
                  rows={2}
                  value={address}
                  onChange={setAddress}
                  placeholder="e.g. Riverside Drive Suite 4B, Westlands, Nairobi"
                />

                <div>
                  <label htmlFor="delivery-notes" className="block text-xs text-stone-600 mb-1">
                    Tailoring or Packaging Notes (optional)
                  </label>
                  <input
                    id="delivery-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Gift wrap or continuous uncut fabric yardage"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {user && (
                  <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveAsDefault}
                      onChange={(e) => setSaveAsDefault(e.target.checked)}
                      className="rounded border-stone-300 text-zinc-900 focus:ring-zinc-900"
                    />
                    <span>Save phone &amp; address as default for future orders</span>
                  </label>
                )}
              </form>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-stone-200 bg-[#FAF8F5] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatKes(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Atelier Courier Fee</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'Complimentary' : formatKes(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900 pt-2 border-t border-stone-200">
                <span>Total</span>
                <span className="font-mono tabular-nums text-base">{formatKes(total)}</span>
              </div>
            </div>

            {user ? (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Reserving Stock & Placing Order...' : 'Place Order'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Place Order
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
