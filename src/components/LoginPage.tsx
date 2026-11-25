import { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { HERO_WAREHOUSE_IMAGE } from '../data/seedCommodities';
import { CommodityImage } from './CommodityImage';

type AuthMode = 'signin' | 'signup' | 'reset';

interface LoginPageProps {
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (fullName: string, email: string, password: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  pendingVerificationUser: FirebaseUser | null;
  onResendVerification: () => Promise<void>;
  onCheckVerification: () => Promise<boolean>;
  onSignOutUnverified: () => Promise<void>;
  onBackToStore: () => void;
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Sign-in is blocked because "${host}" is not listed in Firebase Authorized Domains yet. Add "${host}" under Firebase Console → Security → Authentication → Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'Email & password sign-in is not enabled in Firebase Console yet. Enable it under Security → Authentication → Sign-in method → Email/Password, or use Continue with Google above.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email address or password. Please check your details and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing authentication.';
    default:
      return err instanceof Error ? err.message : 'Authentication could not be completed.';
  }
}

export function LoginPage({
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  pendingVerificationUser,
  onResendVerification,
  onCheckVerification,
  onSignOutUnverified,
  onBackToStore,
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleModeChange = (next: AuthMode) => {
    setMode(next);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setGoogleSubmitting(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'reset') {
        await onPasswordReset(trimmedEmail);
        setInfoMsg(`Password reset instructions have been sent to ${trimmedEmail}.`);
      } else if (mode === 'signup') {
        if (fullName.trim().length < 2) {
          setErrorMsg('Please enter your full name (at least 2 characters).');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await onEmailSignUp(fullName.trim(), trimmedEmail, password);
        setInfoMsg(
          `Account created! We sent a verification link to ${trimmedEmail}. Verify your inbox to activate ordering.`
        );
      } else {
        await onEmailSignIn(trimmedEmail, password);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await onResendVerification();
      setInfoMsg(
        `A fresh verification email has been sent to ${pendingVerificationUser?.email || 'your inbox'}.`
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const verified = await onCheckVerification();
      if (!verified) {
        setErrorMsg(
          'Your email is still marked unverified. Open the link in your inbox, then click this button again.'
        );
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div>
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-zinc-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Collection
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Editorial Showcase */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[540px] bg-[#F3EFE8] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <CommodityImage
              src={HERO_WAREHOUSE_IMAGE}
              alt="Sable & Silk draped mulberry silk, Belgian linen bolts, and amber perfume flacons"
              className="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 text-white space-y-4">
            <p className="text-xs font-medium text-stone-300">
              Sable &amp; Silk Client Atelier
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-white [text-wrap:balance]">
              Reserve couture fabrics and bespoke fragrances with live courier tracking.
            </h2>
            <ul className="space-y-1.5 text-xs text-stone-200 pt-1">
              <li>Saved Nairobi &amp; regional delivery addresses</li>
              <li>Real-time vault stock reservation at checkout</li>
              <li>5-stage atelier packaging &amp; courier checkpoints</li>
            </ul>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {pendingVerificationUser ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold text-zinc-900">
                  Verify your email address
                </h1>
                <p className="text-sm text-stone-600 leading-relaxed">
                  To protect your orders and delivery details, verify{' '}
                  <span className="font-medium text-zinc-900">
                    {pendingVerificationUser.email}
                  </span>{' '}
                  using the link we sent to your inbox.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRefreshVerification()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4" />
                  {submitting ? 'Checking...' : "I've Verified — Continue"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleResend()}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-lg border border-stone-300 bg-white text-zinc-900 text-sm font-medium hover:bg-stone-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  Resend Email
                </button>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => void onSignOutUnverified()}
                  className="text-stone-600 hover:text-zinc-900 underline cursor-pointer"
                >
                  Use a different account
                </button>
                <button
                  type="button"
                  onClick={() => void handleGoogleClick()}
                  className="font-medium text-zinc-900 hover:text-[#7C5C38] cursor-pointer"
                >
                  Continue with Google instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="font-display text-3xl font-semibold text-zinc-900">
                  {mode === 'signin'
                    ? 'Sign in to Sable & Silk'
                    : mode === 'signup'
                    ? 'Create your atelier account'
                    : 'Reset your password'}
                </h1>
                <p className="text-sm text-stone-600">
                  {mode === 'signin'
                    ? 'Access your saved delivery profile, active orders, and courier tracking.'
                    : mode === 'signup'
                    ? 'Register to place fabric or fragrance orders and track every dispatch.'
                    : 'Enter your account email and we will send a password reset link.'}
                </p>
              </div>

              {/* Primary Instant Auth: Google Sign-In */}
              <button
                type="button"
                disabled={googleSubmitting || submitting}
                onClick={() => void handleGoogleClick()}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-stone-300 bg-white hover:bg-[#FAF8F5] text-sm font-medium text-zinc-900 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>
                  {googleSubmitting ? 'Signing in with Google...' : 'Continue with Google'}
                </span>
              </button>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="px-3 text-xs text-stone-400">or use email</span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              {/* Segmented Sign In / Create Account Switcher */}
              <div className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'signin'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'signup'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('reset')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'reset'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Reset Password
                </button>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-900"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div
                  role="status"
                  className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="login-fullname"
                      className="block text-xs font-medium text-stone-700 mb-1"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-fullname"
                        type="text"
                        required
                        maxLength={100}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Amina Wanjiku"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-300 rounded-lg text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-300 rounded-lg text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-stone-700"
                      >
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('reset')}
                          className="text-xs text-stone-500 hover:text-zinc-900 cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter password'}
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-stone-300 rounded-lg text-zinc-900 placeholder:text-stone-400 focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-zinc-900 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="w-full py-3 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Please wait...'
                    : mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
