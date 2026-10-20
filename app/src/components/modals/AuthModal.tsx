import React, { useEffect, useState } from 'react';
import { Apple, Chrome, QrCode } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { GoldButton } from '../ui/primitives';
import { useAuth } from '../../state/AuthContext';
import { useUi } from '../../state/UiContext';
import { BRAND } from '../../data/constants';

type Mode = 'login' | 'signup' | 'forgot';

export interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onDone?: () => void;
}

/**
 * Combined Log In / Sign Up / Forgot-password modal.
 * Credentials are validated for shape only and never leave the browser.
 */
export function AuthModal({ open, initialMode = 'login', onClose, onDone }: AuthModalProps): React.ReactElement {
  const { login, register } = useAuth();
  const { pushToast, openModal } = useUi();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
    }
  }, [open, initialMode]);

  const submit = () => {
    setError(null);
    if (mode === 'forgot') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setError('Enter a valid email address');
        return;
      }
      pushToast({
        tone: 'info',
        title: 'Reset link simulated',
        body: `In this demo no email is sent. A reset link for ${email} would be issued here.`,
      });
      setMode('login');
      return;
    }
    if (mode === 'signup' && confirm !== password) {
      setError('Passwords do not match');
      return;
    }
    const res = mode === 'login' ? login(email, password) : register(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Invalid input');
      return;
    }
    pushToast({
      tone: 'success',
      title: mode === 'login' ? 'Signed in (demo)' : 'Account created (demo)',
      body: BRAND.demoNotice,
    });
    onClose();
    onDone?.();
  };

  const social = (provider: string) => {
    pushToast({
      tone: 'info',
      title: `${provider} sign-in simulated`,
      body: 'OAuth handshakes are not performed in this demo; no third-party data is exchanged.',
    });
  };

  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div className="pt-6">
        <h2 className="text-[20px] font-bold text-txt-dark">
          {mode === 'login' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
        </h2>
        <p className="mt-1 text-[12px] text-txt-darksec">
          {mode === 'forgot'
            ? 'Enter your email to receive a simulated reset link.'
            : 'Welcome to Bityaris — demo accounts only, no real funds.'}
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-txt-dark">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="off"
              className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] text-txt-dark outline-none focus:border-accent"
            />
          </label>
          {mode !== 'forgot' && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-txt-dark">
                {mode === 'login' ? 'Enter Password' : 'Create Password'}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] text-txt-dark outline-none focus:border-accent"
              />
            </label>
          )}
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-txt-dark">Confirm Password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] text-txt-dark outline-none focus:border-accent"
              />
            </label>
          )}
        </div>

        {error && <p className="mt-3 text-[12px] font-medium text-down">{error}</p>}

        {mode === 'login' && (
          <button
            type="button"
            className="mt-3 text-[12px] font-medium text-txt-darksec hover:text-txt-dark"
            onClick={() => setMode('forgot')}
          >
            Forgot Password?
          </button>
        )}

        <GoldButton className="mt-4 w-full py-2.5" onClick={submit}>
          {mode === 'login' ? 'Next' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </GoldButton>

        {mode !== 'forgot' && (
          <>
            <div className="my-4 flex items-center gap-3 text-[11px] text-txt-darksec">
              <span className="h-px flex-1 bg-bd-light" /> or <span className="h-px flex-1 bg-bd-light" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => social('Google')}
                className="flex items-center justify-center rounded-lg border border-bd-light py-2.5 hover:bg-black/5"
                aria-label="Continue with Google"
              >
                <Chrome size={17} />
              </button>
              <button
                type="button"
                onClick={() => social('Apple')}
                className="flex items-center justify-center rounded-lg border border-bd-light py-2.5 hover:bg-black/5"
                aria-label="Continue with Apple"
              >
                <Apple size={17} />
              </button>
              <button
                type="button"
                onClick={() => openModal('download')}
                className="flex items-center justify-center rounded-lg border border-bd-light py-2.5 hover:bg-black/5"
                aria-label="Scan QR code"
              >
                <QrCode size={17} />
              </button>
            </div>
          </>
        )}

        <p className="mt-4 text-center text-[12px] text-txt-darksec">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            className="font-semibold text-accent-deep hover:underline"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign Up for Free' : 'Log In'}
          </button>
        </p>
        <p className="mt-3 rounded-lg bg-black/[.04] p-2 text-center text-[10px] leading-relaxed text-txt-darksec">
          {BRAND.demoNotice} Credentials are checked locally and never transmitted.
        </p>
      </div>
    </Modal>
  );
}
