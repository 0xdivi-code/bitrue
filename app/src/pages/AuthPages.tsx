import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Chrome } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { GoldButton } from '../components/ui/primitives';
import { useAuth } from '../state/AuthContext';
import { useUi } from '../state/UiContext';
import { BRAND } from '../data/constants';

function AuthShell({ mode }: { mode: 'login' | 'signup' }): React.ReactElement {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { pushToast } = useUi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (mode === 'signup' && confirm !== password) {
      setError('Passwords do not match');
      return;
    }
    const res = mode === 'login' ? login(email, password) : register(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Invalid input');
      return;
    }
    pushToast({ tone: 'success', title: mode === 'login' ? 'Signed in (demo)' : 'Account created (demo)', body: BRAND.demoNotice });
    navigate('/trade/xrp_usdt');
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f7f8fa] px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-pop">
        <div className="flex justify-center">
          <span className="flex items-center gap-2">
            <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M32 6 L54 18 V46 L32 58 L10 46 V18 Z" fill="none" stroke="#f0b90b" strokeWidth="5" strokeLinejoin="round" />
              <path d="M32 21 L42 26.5 V37.5 L32 43 L22 37.5 V26.5 Z" fill="#f0b90b" />
            </svg>
            <span className="text-[22px] font-extrabold tracking-tight text-txt-dark">orbitex</span>
          </span>
        </div>
        <h1 className="mt-6 text-center text-[20px] font-bold text-txt-dark">{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
        <p className="mt-1 text-center text-[12px] text-txt-darksec">Simulated account — credentials never leave this browser.</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-txt-dark">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-txt-dark">{mode === 'login' ? 'Enter Password' : 'Create Password'}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] outline-none focus:border-accent"
            />
          </label>
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-txt-dark">Confirm Password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="input-light w-full rounded-lg border border-bd-light px-3 py-2.5 text-[13px] outline-none focus:border-accent"
              />
            </label>
          )}
        </div>

        {mode === 'login' && (
          <div className="mt-2 text-right">
            <button type="button" onClick={() => navigate('/forgot')} className="text-[12px] text-txt-darksec hover:text-txt-dark">
              Forgot Password?
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-[12px] font-medium text-down">{error}</p>}

        <GoldButton className="mt-4 w-full py-2.5" onClick={submit}>
          Next
        </GoldButton>

        <p className="mt-4 text-center text-[12px] text-txt-darksec">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" className="font-semibold text-accent-deep hover:underline" onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}>
            {mode === 'login' ? 'Sign Up for Free' : 'Log In'}
          </button>
        </p>

        <div className="my-5 flex items-center gap-3 text-[11px] text-txt-darksec">
          <span className="h-px flex-1 bg-bd-light" /> or <span className="h-px flex-1 bg-bd-light" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => pushToast({ tone: 'info', title: 'Google sign-in simulated', body: 'No OAuth handshake in this demo.' })}
            className="flex items-center justify-center gap-2 rounded-lg border border-bd-light py-2.5 text-[12px] font-semibold text-txt-dark hover:bg-black/5"
          >
            <Chrome size={15} /> Google
          </button>
          <button
            type="button"
            onClick={() => pushToast({ tone: 'info', title: 'Apple sign-in simulated', body: 'No OAuth handshake in this demo.' })}
            className="flex items-center justify-center gap-2 rounded-lg border border-bd-light py-2.5 text-[12px] font-semibold text-txt-dark hover:bg-black/5"
          >
            <Apple size={15} /> Apple
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoginPage(): React.ReactElement {
  return <AuthShell mode="login" />;
}
export function SignupPage(): React.ReactElement {
  return <AuthShell mode="signup" />;
}
