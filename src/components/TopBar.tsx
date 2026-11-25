import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, LogOut, MapPin, Package, ShoppingBag } from 'lucide-react';
import { UserProfile } from '../types/commerce';

export type AppView = 'catalog' | 'orders' | 'track' | 'dispatch' | 'login';

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile | null;
  pendingVerificationEmail?: string | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
}

export function TopBar({
  activeView,
  onNavigate,
  cartCount,
  onOpenCart,
  user,
  pendingVerificationEmail,
  authLoading,
  onSignIn,
  onSignOut,
  onOpenProfile,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navItems: { id: AppView; label: string }[] = [
    { id: 'catalog', label: 'Collection' },
    { id: 'orders', label: 'My Orders' },
    { id: 'track', label: 'Track Delivery' },
    { id: 'dispatch', label: 'Atelier Console' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className="font-display text-2xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 rounded"
        >
          Sable &amp; Silk
        </button>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-zinc-900 border-zinc-900'
                    : 'text-stone-600 border-transparent hover:text-zinc-900 hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Account Menu & Primary Bag Action */}
        <div className="flex items-center gap-3 shrink-0">
          {!authLoading && (
            user ? (
              <div ref={menuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 transition-colors"
                >
                  <span className="max-w-[120px] truncate">{user.displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-40">
                    <div className="px-3.5 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-zinc-900 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      Saved Delivery Address
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('orders');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-stone-400" />
                      My Orders
                    </button>
                    <div className="my-1 border-t border-stone-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer py-2 px-3 rounded-lg border transition-colors ${
                  activeView === 'login'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : pendingVerificationEmail
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-stone-300 bg-white text-stone-700 hover:text-zinc-900 hover:bg-stone-50'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                {pendingVerificationEmail ? 'Verify Email' : 'Sign In'}
              </button>
            )
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            <span className="font-mono tabular-nums text-stone-300">({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <div className="md:hidden border-t border-stone-200 px-4 py-2 flex items-center gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                isActive
                  ? 'text-zinc-900 border-zinc-900'
                  : 'text-stone-600 border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
        {!authLoading && (user ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="ml-auto text-xs font-medium text-stone-600 whitespace-nowrap shrink-0 py-1"
          >
            Address
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className={`ml-auto text-xs font-medium whitespace-nowrap shrink-0 py-1 ${
              pendingVerificationEmail ? 'text-amber-800' : 'text-zinc-900'
            }`}
          >
            {pendingVerificationEmail ? 'Verify Email' : 'Sign In'}
          </button>
        ))}
      </div>
    </header>
  );
}
