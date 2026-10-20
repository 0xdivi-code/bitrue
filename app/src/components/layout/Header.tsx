import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Download,
  Globe,
  LogOut,
  Menu,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { NAV_ITEMS, LANGUAGES, BRAND } from '../../data/constants';
import { useAuth } from '../../state/AuthContext';
import { useUi } from '../../state/UiContext';
import { Dropdown, MenuItem } from '../ui/Dropdown';
import { Logo } from './Logo';
import { cn } from '../../utils/format';

function isActiveRoute(pathname: string, item: { to?: string; children?: Array<{ to: string }> }): boolean {
  const targets = [item.to, ...(item.children?.map((c) => c.to) ?? [])].filter(Boolean) as string[];
  return targets.some((to) => {
    if (to === '/') return pathname === '/';
    const root = to.split('/').slice(0, 2).join('/'); // e.g. /trade, /futures
    return pathname === root || pathname.startsWith(`${root}/`);
  });
}

export function Header(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, logout } = useAuth();
  const { openModal } = useUi();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState('en');

  return (
    <header className="sticky top-0 z-[100] bg-night-900 text-white">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-1 px-4">
        <Logo size={36} />

        {/* desktop nav */}
        <nav className="ml-3 hidden min-w-0 flex-1 items-center gap-0.5 lg:flex xl:ml-6" aria-label="Primary">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <span key={item.label} className={cn('relative', item.className)}>
              <Dropdown
                hover
                width={300}
                trigger={(open) => (
                  <span
                    className={cn(
                      'flex whitespace-nowrap items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors hover:text-accent xl:px-2.5 xl:text-[13px]',
                      open || isActiveRoute(location.pathname, item) ? 'text-accent' : 'text-white',
                    )}
                  >
                    {item.badge === 'New' ? (
                      <span className="flex items-center gap-1">
                        <Sparkles size={13} className="text-purple" />
                        <span className="bg-gradient-to-r from-purple to-[#4383e4] bg-clip-text text-transparent">
                          {item.label}
                        </span>
                        <span className="rounded bg-[#f44d4d] px-1 py-px text-[9px] font-bold text-white">New</span>
                      </span>
                    ) : (
                      <>
                        {item.label}
                        {item.badge && <span className="text-[12px]">{item.badge}</span>}
                      </>
                    )}
                    <ChevronDown size={13} className="opacity-70" />
                  </span>
                )}
              >
                {(close) => (
                  <div className="py-1.5">
                    {item.children!.map((c) => (
                      <MenuItem
                        key={c.label}
                        onClick={() => {
                          close();
                          navigate(c.to);
                        }}
                        className="items-start py-2"
                      >
                        <span>
                          <span className="flex items-center gap-2 font-semibold text-txt-primary">
                            {c.label}
                            {c.badge && (
                              <span className="rounded bg-[#f44d4d] px-1 py-px text-[9px] font-bold text-white">
                                {c.badge}
                              </span>
                            )}
                          </span>
                          {c.desc && <span className="mt-0.5 block text-[11px] text-txt-secondary">{c.desc}</span>}
                        </span>
                      </MenuItem>
                    ))}
                  </div>
                )}
              </Dropdown>
              </span>
            ) : (
              <Link
                key={item.label}
                to={item.to ?? '/'}
                className={cn(
                  'flex whitespace-nowrap items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors hover:text-accent xl:px-2.5 xl:text-[13px]',
                  isActiveRoute(location.pathname, item) ? 'text-accent' : 'text-white',
                )}
              >
                {item.badge === 'New' ? (
                  <>
                    <Sparkles size={13} className="text-purple" />
                    <span className="bg-gradient-to-r from-purple to-[#4383e4] bg-clip-text text-transparent">
                      {item.label}
                    </span>
                    <span className="rounded bg-[#f44d4d] px-1 py-px text-[9px] font-bold text-white">New</span>
                  </>
                ) : (
                  <>
                    {item.label}
                    {item.badge && <span className="text-[12px]">{item.badge}</span>}
                  </>
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {account.loggedIn ? (
            <Dropdown
              align="right"
              width={230}
              trigger={() => (
                <span className="flex items-center gap-2 rounded-full bg-night-600 px-3 py-1.5 text-[13px] font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-night-900">
                    {(account.email ?? 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[130px] truncate">{account.email}</span>
                  <ChevronDown size={13} />
                </span>
              )}
            >
              {(close) => (
                <div className="py-1.5">
                  <div className="border-b border-bd-dark px-4 py-2 text-[11px] text-txt-secondary">
                    {BRAND.demoNotice}
                  </div>
                  <MenuItem
                    onClick={() => {
                      close();
                      navigate('/placeholder/wallet');
                    }}
                  >
                    <Wallet size={14} /> Wallet
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      close();
                      navigate('/placeholder/orders');
                    }}
                  >
                    <User size={14} /> Orders
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      close();
                      logout();
                    }}
                  >
                    <LogOut size={14} /> Log Out
                  </MenuItem>
                </div>
              )}
            </Dropdown>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openModal('auth', { mode: 'login' })}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium hover:text-accent"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openModal('auth', { mode: 'signup' })}
                className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-night-900 transition-colors hover:bg-accent-hover"
              >
                Sign Up
              </button>
            </>
          )}

          <button
            type="button"
            aria-label="Download app"
            onClick={() => openModal('download')}
            className="rounded-md p-2 hover:bg-night-600"
          >
            <Download size={16} />
          </button>

          <Dropdown
            align="right"
            width={190}
            trigger={() => (
              <span className="flex items-center gap-1 rounded-md p-2 hover:bg-night-600" aria-label="Language">
                <Globe size={16} />
              </span>
            )}
          >
            {(close) => (
              <div className="max-h-[320px] overflow-y-auto py-1.5 scroll-thin">
                {LANGUAGES.map((l) => (
                  <MenuItem
                    key={l.code}
                    active={lang === l.code}
                    onClick={() => {
                      setLang(l.code);
                      close();
                    }}
                  >
                    {l.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </Dropdown>
        </div>

        {/* mobile trigger */}
        <button
          type="button"
          className="ml-auto rounded-md p-2 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[300px] overflow-y-auto bg-night-800 p-4 scroll-thin">
            <div className="mb-4 flex items-center justify-between">
              <Logo size={36} />
              <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-[14px] font-medium hover:bg-night-600',
                      isActiveRoute(location.pathname, item) && 'text-accent',
                    )}
                    onClick={() => {
                      if (item.to) {
                        navigate(item.to);
                        setMobileOpen(false);
                      } else {
                        const el = document.getElementById(`m-${item.label}`);
                        el?.classList.toggle('hidden');
                      }
                    }}
                  >
                    {item.label}
                    {!item.to && <ChevronDown size={14} />}
                  </button>
                  {item.children && (
                    <div id={`m-${item.label}`} className="hidden pl-3">
                      {item.children.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[13px] text-txt-secondary hover:bg-night-600"
                          onClick={() => {
                            navigate(c.to);
                            setMobileOpen(false);
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-bd-dark pt-4">
              {account.loggedIn ? (
                <button
                  type="button"
                  className="rounded-lg border border-bd-dark px-4 py-2 text-[13px]"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  Log Out
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-bd-dark px-4 py-2 text-[13px]"
                    onClick={() => {
                      openModal('auth', { mode: 'login' });
                      setMobileOpen(false);
                    }}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-night-900"
                    onClick={() => {
                      openModal('auth', { mode: 'signup' });
                      setMobileOpen(false);
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
