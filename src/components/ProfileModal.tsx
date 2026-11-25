import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Phone, User, X } from 'lucide-react';
import { updateUserProfileDetails } from '../services/firestoreService';
import { UserProfile } from '../types/commerce';

interface ProfileModalProps {
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onProfileSaved: (updated: { displayName: string; phone: string; defaultAddress: string }) => void;
}

export function ProfileModal({
  open,
  user,
  onClose,
  onProfileSaved,
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && open) {
      setDisplayName(user.displayName);
      setPhone(user.phone || '');
      setDefaultAddress(user.defaultAddress || '');
      setError(null);
    }
  }, [user, open]);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        defaultAddress: defaultAddress.trim(),
      };
      await updateUserProfileDetails(user.uid, payload);
      onProfileSaved(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save delivery profile.');
    } finally {
      setSaving(false);
    }
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
        aria-labelledby="profile-modal-title"
        className="relative z-10 w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="profile-modal-title" className="font-display text-lg font-semibold text-zinc-900">
              Delivery Profile & Account
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Save your contact number and drop-off address for faster checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery profile"
            className="p-1.5 rounded-lg text-stone-400 hover:text-zinc-900 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#F7F7F5] border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-600 flex items-center justify-between">
          <span className="truncate">{user.email}</span>
          <span className="font-mono font-medium text-emerald-900 shrink-0 ml-2">
            {user.role}
          </span>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="flex items-center gap-1.5 text-xs font-medium text-stone-700 mb-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Recipient Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="flex items-center gap-1.5 text-xs font-medium text-stone-700 mb-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              Default Delivery Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 712 345 678"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
            />
          </div>

          <div>
            <label htmlFor="profile-address" className="flex items-center gap-1.5 text-xs font-medium text-stone-700 mb-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              Default Drop-Off Address
            </label>
            <textarea
              id="profile-address"
              rows={2}
              maxLength={300}
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              placeholder="e.g. Juja Town Market Stall 14, Kiambu County"
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Defaults'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
