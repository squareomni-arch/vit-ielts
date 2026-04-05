'use client';

import { useState } from 'react';
import { Button } from '../../atoms/button';
import { Avatar } from '../../atoms/avatar';

/**
 * Design System Header
 *
 * @figma IELTS Prediction Test — "Header" component
 * Glassmorphism pill: white/50 bg, blur, rounded-[60px], sticky top-5
 * Tailwind-only — NO custom CSS classes
 */

export type HeaderNavItem = {
  label: string;
  href: string;
  active?: boolean;
  children?: { label: string; href: string }[];
};

export type HeaderUserMenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  icon?: React.ReactNode;
};

export type HeaderProps = {
  logoSrc?: string;
  logoAlt?: string;
  navItems: HeaderNavItem[];
  isAuthenticated?: boolean;
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
  onSignup?: () => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  className?: string;
  userMenuItems?: HeaderUserMenuItem[];
};

export const Header = ({
  logoSrc = '/assets/figma/logos/logo-color.png',
  logoAlt = 'IELTS Prediction Test',
  navItems,
  isAuthenticated = false,
  userName,
  userAvatar,
  onLogin,
  onSignup,
  onLogout,
  onLogoClick,
  className = '',
  userMenuItems = [],
}: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-50 h-0 overflow-visible bg-transparent pointer-events-none px-5 font-[var(--font-primary)] ${className}`}>
      {/* Glassmorphism Pill Container */}
      <div
        id="navbar-container"
        data-component-name="NavbarContainer"
        className="flex items-center justify-between max-w-[1597px] mx-auto px-4 md:px-[50px] py-3 md:py-[15px] rounded-full bg-white/50 shadow-[0_4px_10px_rgba(0,0,0,0.25)] backdrop-blur-[7.5px] pointer-events-auto"
      >

        {/* Logo */}
        <a href="/" className="flex items-center shrink-0 no-underline" onClick={onLogoClick}>
          <img src={logoSrc} alt={logoAlt} className="h-12 w-auto object-contain" />
        </a>

        {/* Desktop Navigation */}
        <nav
          id="main-desktop-navbar"
          data-component-name="DesktopNavbar"
          className="hidden md:flex flex-1 justify-center"
        >
          <ul className="flex justify-center items-center m-0 list-none gap-[16px]">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              return (
              <li key={item.href} className={`relative ${hasChildren ? 'group' : ''}`}>
                <a
                  href={item.href}
                  className={`inline-flex items-center no-underline transition-colors duration-150 gap-[16px] text-center font-['Noto_Sans',sans-serif] text-[14px] font-bold py-[15px] px-[20px] ${item.active ? 'text-[var(--color-primary-500)]' : 'text-[#191D24] hover:text-[var(--color-primary-500)]'
                    }`}
                >
                  {item.label}
                  {hasChildren && (
                    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover:rotate-90 transition-transform duration-150" aria-hidden="true">
                      <path d="M37.6074 21.4746L19.4531 3.32031C17.5 1.36719 14.3457 1.36719 12.3926 3.32031C10.4395 5.27344 10.4395 8.42773 12.3926 10.3809L27.0215 25L12.3926 39.6191C10.4395 41.5723 10.4395 44.7266 12.3926 46.6797C14.3457 48.6328 17.5 48.6328 19.4531 46.6797L37.6074 28.5254C39.5508 26.582 39.5508 23.418 37.6074 21.4746Z" fill="currentColor" />
                    </svg>
                  )}
                </a>
                {hasChildren && (
                  <div className="absolute top-full left-0 min-w-[200px] bg-white border border-[var(--border-default)] rounded-md shadow-lg p-2 opacity-0 invisible translate-y-2 transition-all duration-150 z-[var(--z-dropdown)] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                    {item.children!.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-[var(--text-secondary)] no-underline rounded-sm transition-colors duration-150 hover:bg-[var(--color-neutral-50)] hover:text-[var(--text-primary)]"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )})}
          </ul>
        </nav>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <div className="relative group flex items-center gap-3 cursor-pointer py-2">
              <span className="flex items-center text-[var(--text-primary)] transition-transform duration-150 group-hover:rotate-180">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-base font-bold text-[var(--text-primary)]">{userName || 'Username'}</span>
              <Avatar size="md" name={userName || 'U'} src={userAvatar} />

              <div className="absolute top-full right-0 mt-0 min-w-[220px] bg-white border border-[var(--border-default)] rounded-md shadow-lg p-2 opacity-0 invisible translate-y-2 transition-all duration-150 z-[var(--z-dropdown)] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                {userMenuItems.map((item, index) => {
                  if (item.divider) return <div key={index} className="h-px bg-[var(--color-neutral-100)] my-1" />;
                  
                  const Content = () => (
                    <span className={`flex items-center gap-2 px-3 py-2 text-sm no-underline rounded-sm transition-colors duration-150 ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--text-primary)]'}`}>
                      {item.icon}
                      {item.label}
                    </span>
                  );

                  if (item.href) {
                     return <a key={index} href={item.href} onClick={item.onClick} className="block"><Content /></a>;
                  }
                  
                  return (
                    <button key={index} onClick={item.onClick} className="block w-full text-left bg-transparent border-none cursor-pointer p-0 m-0 font-[inherit]">
                      <Content />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <Button variant="primary" size="md" onClick={onLogin}>
                Đăng ký / Đăng nhập
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={`md:hidden flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-[22px] h-[2px] bg-[var(--text-primary)] rounded-[1px] transition-transform duration-150 ${mobileOpen ? 'rotate-45 translate-x-[5px] translate-y-[5px]' : ''}`} />
          <span className={`block w-[22px] h-[2px] bg-[var(--text-primary)] rounded-[1px] transition-opacity duration-150 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-[22px] h-[2px] bg-[var(--text-primary)] rounded-[1px] transition-transform duration-150 ${mobileOpen ? '-rotate-45 translate-x-[5px] -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden flex flex-col px-6 py-4 border-t border-[var(--border-default)] bg-white rounded-b-3xl mt-1 pointer-events-auto shadow-lg">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block py-3 text-base text-[var(--text-secondary)] no-underline border-b border-[var(--color-neutral-100)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            {isAuthenticated ? (
              <Button variant="ghost" fullWidth onClick={onLogout}>Đăng xuất</Button>
            ) : (
              <>
                <Button variant="primary" fullWidth onClick={onSignup}>Đăng ký</Button>
                <Button variant="secondary" fullWidth onClick={onLogin}>Đăng nhập</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
