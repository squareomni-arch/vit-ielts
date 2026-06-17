'use client';

/**
 * Header — Figma node 3040:226
 *
 * Full-width white bar with bottom shadow.
 * Logo: green icon-box + "VIT" / "IELTS" text (logoSrc overrides to img).
 * Nav: 16px Inter Regular, gap-18px. Active = #9ad534 + bold.
 * Unauthenticated: "Sign in" ghost pill + "Start free" brand pill.
 * Authenticated: avatar + user-name + dropdown menu (preserved from prev implementation).
 * Mobile: hamburger → slide-down drawer with accordion for nested items.
 */

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { UserAccountTypeBadge } from '@/shared/ui/user-account-type-badge';

// ─── Types ──────────────────────────────────────────────────────────────────

export type HeaderNavItem = {
  label: string;
  href: string;
  active?: boolean;
  children?: { label: string; href: string }[];
};

export type HeaderUserMenuItem = {
  label?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  icon?: React.ReactNode;
};

export type HeaderProps = {
  /** Override logo with a custom image. When omitted shows the text-based VIT IELTS logo. */
  logoSrc?: string;
  logoAlt?: string;
  navItems: HeaderNavItem[];
  isAuthenticated?: boolean;
  authLoading?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
  onSignup?: () => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  className?: string;
  userMenuItems?: HeaderUserMenuItem[];
  isPro?: boolean;
  /** Label for the ghost "Sign in" button. Defaults to "Sign in". */
  loginLabel?: string;
  /** Label for the brand "Start free" button. Defaults to "Start free". */
  signupLabel?: string;
};

// ─── Component ──────────────────────────────────────────────────────────────

export const Header = ({
  logoSrc,
  logoAlt = 'VIT IELTS',
  navItems,
  isAuthenticated = false,
  authLoading = false,
  userName,
  userAvatar,
  onLogin,
  onSignup,
  onLogout,
  onLogoClick,
  className = '',
  userMenuItems = [],
  isPro = false,
  loginLabel = 'Sign in',
  signupLabel = 'Start free',
}: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={twMerge(
        'sticky top-0 z-50 bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)]',
        className,
      )}
    >
      {/* ── Desktop bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between max-w-[1400px] mx-auto px-[90px] py-[18px]">

        {/* Logo */}
        <a
          href="/"
          onClick={onLogoClick}
          className="flex items-center gap-[10px] shrink-0 no-underline w-[230px]"
        >
          {logoSrc ? (
            <img src={logoSrc} alt={logoAlt} className="h-[47px] w-auto object-contain" />
          ) : (
            <>
              {/* Icon box */}
              <div className="bg-[#b3e653] flex items-center justify-center w-[47px] h-[47px] rounded-[10px] shadow-[0px_4px_5px_0px_rgba(25,29,36,0.25)] shrink-0">
                <span
                  className="font-display font-bold text-[19px] leading-none text-[#191d24] select-none"
                  aria-hidden="true"
                >
                  ≡
                </span>
              </div>
              {/* Wordmark */}
              <span className="font-display font-bold text-[19px] leading-[1.3] whitespace-nowrap">
                <span className="text-[#191d24]">VIT</span>
                <span className="text-[#9ad534]">IELTS</span>
              </span>
            </>
          )}
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-[18px]" aria-label="Main navigation">
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            return (
              <div key={item.href} className={twMerge('relative', hasChildren && 'group')}>
                <a
                  href={item.href}
                  className={twMerge(
                    'font-inter text-[16px] leading-[1.5] text-[#191d24] no-underline',
                    'transition-colors duration-150 hover:text-[#9ad534]',
                    'whitespace-nowrap flex items-center gap-1',
                    item.active && 'text-[#9ad534] font-bold',
                  )}
                >
                  {item.label}
                  {hasChildren && (
                    <svg
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </a>

                {/* Dropdown */}
                {hasChildren && (
                  <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-white rounded-xl border border-[rgba(25,29,36,0.08)] shadow-[0px_8px_20px_rgba(25,29,36,0.12)] p-2 opacity-0 invisible translate-y-1 transition-all duration-150 z-50 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                    {item.children!.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-[14px] font-inter text-[#6a7282] no-underline rounded-lg transition-colors duration-150 hover:bg-[#f4f5f7] hover:text-[#191d24]"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div
          className="hidden lg:flex items-center gap-[12px] justify-end w-[230px] shrink-0"
          suppressHydrationWarning
        >
          {authLoading ? (
            <div className="w-[180px]" />
          ) : isAuthenticated ? (
            /* ── Authenticated user ── */
            <div className="relative group flex items-center gap-3 cursor-pointer py-2">
              <span className="flex items-center text-[#191d24] transition-transform duration-150 group-hover:rotate-180">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-inter font-bold text-[16px] text-[#191d24]">{userName || 'Username'}</span>
                <UserAccountTypeBadge isPro={isPro} />
              </div>

              {/* User dropdown */}
              <div className="absolute top-full right-0 mt-1 min-w-[220px] bg-white rounded-xl border border-[rgba(25,29,36,0.08)] shadow-[0px_8px_20px_rgba(25,29,36,0.12)] p-2 opacity-0 invisible translate-y-1 transition-all duration-150 z-50 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                {userMenuItems.map((item, index) => {
                  if (item.divider) return <div key={index} className="h-px bg-[#e5e6e8] my-1" />;
                  const cls = `flex items-center gap-2 px-3 py-2 text-[14px] font-inter no-underline rounded-lg transition-colors duration-150 ${item.danger ? 'text-[#e5484d] hover:bg-[#fff2f2]' : 'text-[#6a7282] hover:bg-[#f4f5f7] hover:text-[#191d24]'}`;
                  if (item.href) return <a key={index} href={item.href} onClick={item.onClick} className={cls}>{item.icon}{item.label}</a>;
                  return (
                    <button key={index} onClick={item.onClick} className={`${cls} w-full text-left bg-transparent border-none cursor-pointer font-inherit p-0 px-3 py-2`}>
                      {item.icon}{item.label}
                    </button>
                  );
                })}
                {onLogout && (
                  <>
                    <div className="h-px bg-[#e5e6e8] my-1" />
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-[14px] font-inter text-[#e5484d] hover:bg-[#fff2f2] rounded-lg transition-colors duration-150 bg-transparent border-none cursor-pointer font-inherit text-left"
                    >
                      <i className="material-symbols-rounded text-[18px]">logout</i>
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className={twMerge('block w-[22px] h-[2px] bg-[#191d24] rounded-[1px] transition-all duration-200 origin-center', mobileOpen && 'rotate-45 translate-y-[7px]')} />
          <span className={twMerge('block w-[22px] h-[2px] bg-[#191d24] rounded-[1px] transition-all duration-200', mobileOpen && 'opacity-0 scale-0')} />
          <span className={twMerge('block w-[22px] h-[2px] bg-[#191d24] rounded-[1px] transition-all duration-200 origin-center', mobileOpen && '-rotate-45 -translate-y-[7px]')} />
        </button>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden flex flex-col bg-white border-t border-[rgba(25,29,36,0.06)] shadow-[0px_8px_20px_rgba(25,29,36,0.12)] overflow-hidden max-h-[calc(100dvh-80px)] overflow-y-auto">
          <div className="flex flex-col px-6 py-2">
            {navItems.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              return (
                <div key={item.href} className="border-b border-[rgba(25,29,36,0.06)]">
                  {hasChildren ? (
                    <MobileAccordion label={item.label} href={item.href} active={item.active}>
                      {item.children!.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="block py-2.5 pl-4 text-[14px] font-inter text-[#6a7282] no-underline hover:text-[#9ad534] transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </MobileAccordion>
                  ) : (
                    <a
                      href={item.href}
                      className={twMerge(
                        'block py-3.5 text-[16px] font-inter no-underline transition-colors',
                        item.active ? 'text-[#9ad534] font-bold' : 'text-[#6a7282] hover:text-[#191d24]',
                      )}
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile auth section */}
          {authLoading ? null : isAuthenticated ? (
            <div className="px-6 py-4 border-t border-[rgba(25,29,36,0.06)] bg-[#f4f5f7]" suppressHydrationWarning>
              <div className="flex items-center gap-3 mb-4">
                <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
                  <p className="font-inter font-bold text-[16px] text-[#191d24] truncate">{userName || 'User'}</p>
                  <UserAccountTypeBadge isPro={isPro} />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                {userMenuItems.map((item, index) => {
                  if (item.divider) return <div key={index} className="h-px bg-[#e5e6e8] my-2" />;
                  const cls = `flex items-center gap-2 py-2.5 px-1 text-[14px] font-inter no-underline rounded-lg transition-colors ${item.danger ? 'text-[#e5484d] hover:bg-[#fff2f2]' : 'text-[#6a7282] hover:bg-white hover:text-[#191d24]'}`;
                  if (item.href) return <a key={index} href={item.href} onClick={item.onClick} className={cls}>{item.icon}{item.label}</a>;
                  return (
                    <button key={index} onClick={item.onClick} className={`${cls} bg-transparent border-none cursor-pointer font-inherit w-full text-left`}>
                      {item.icon}{item.label}
                    </button>
                  );
                })}
                {onLogout && (
                  <button onClick={onLogout} className="flex items-center gap-2 py-2.5 px-1 text-[14px] font-inter text-[#e5484d] hover:bg-[#fff2f2] rounded-lg transition-colors bg-transparent border-none cursor-pointer font-inherit w-full text-left">
                    <i className="material-symbols-rounded text-[18px]">logout</i>
                    Sign out
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </header>
  );
};

// ─── Mobile accordion ────────────────────────────────────────────────────────

const MobileAccordion = ({
  label,
  href,
  active,
  children,
}: {
  label: string;
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <a
          href={href}
          className={twMerge(
            'flex-1 py-3.5 text-[16px] font-inter no-underline transition-colors',
            active ? 'text-[#9ad534] font-bold' : 'text-[#6a7282] hover:text-[#191d24]',
          )}
        >
          {label}
        </a>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer text-[#6a7282] hover:text-[#191d24] transition-colors"
          aria-label={`Expand ${label}`}
        >
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={twMerge('w-4 h-4 transition-transform duration-200', open && 'rotate-180')}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
};
