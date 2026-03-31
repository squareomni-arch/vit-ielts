'use client';

import { useState } from 'react';
import { Button } from '../../atoms/button';
import { Avatar } from '../../atoms/avatar';

/**
 * Design System Header
 *
 * @figma IELTS Prediction Test — "Header" component
 * White background, logo left, nav center, auth buttons right
 */

export type HeaderNavItem = {
  label: string;
  href: string;
  active?: boolean;
  children?: { label: string; href: string }[];
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
}: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`header ${className}`}>
      <div className="header__container">
        {/* Logo */}
        <a href="/" className="header__logo" onClick={onLogoClick}>
          <img src={logoSrc} alt={logoAlt} className="header__logo-img" />
        </a>

        {/* Desktop Navigation */}
        <nav className="header__nav">
          {navItems.map((item) => (
            <div key={item.href} className={`header__nav-item ${item.children ? 'header__nav-item--dropdown' : ''}`}>
              <a
                href={item.href}
                className={`header__nav-link ${item.active ? 'header__nav-link--active' : ''}`}
              >
                {item.label}
                {item.children && (
                  <span className="header__nav-arrow">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </a>
              {item.children && (
                <div className="header__dropdown">
                  {item.children.map((child) => (
                    <a key={child.href} href={child.href} className="header__dropdown-link">
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Auth Actions */}
        <div className="header__actions">
          {isAuthenticated ? (
            <div className="header__user">
              <span className="header__user-chevron">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="header__user-name">{userName || 'Username'}</span>
              <Avatar size="md" name={userName || 'U'} src={userAvatar} />
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
          className={`header__hamburger ${mobileOpen ? 'header__hamburger--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="header__mobile-nav">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="header__mobile-link">
              {item.label}
            </a>
          ))}
          <div className="header__mobile-actions">
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
