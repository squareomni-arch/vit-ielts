
/**
 * Footer — Figma node 3366:74
 *
 * Dark `#191d24` bar, `px-[90px] py-[48px]`, `flex justify-between items-start`.
 * Brand col: "VIT" (white) + "IELTS" (#9ad534) wordmark + description (280px, #6a7282).
 * Link cols (data-driven via `columns` prop):
 *   - header: 12px Inter Bold, white, uppercase, tracking-[0.96px]
 *   - links: 14px Inter Regular, #6a7282, hover → white
 * Optional: socialLinks, showCopyright, logoSrc override.
 * All existing props preserved for backward compat.
 */

import { twMerge } from 'tailwind-merge';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FooterLink   = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterProps = {
  /** Override the text wordmark with a custom image. */
  logoSrc?: string;
  /** Short tagline under the logo. */
  description?: string;
  /** Data-driven link columns (title + links[]). */
  columns: FooterColumn[];
  /** Contact info — rendered as a small text block below description when provided. */
  contactInfo?: { phone?: string; email?: string; address?: string };
  /** Social icon links. icon should be a ReactNode; the preview passes strings — handled gracefully. */
  socialLinks?: { icon: React.ReactNode; href: string; label: string }[];
  /** Show "© year …" copyright line at the very bottom. Default false. */
  showCopyright?: boolean;
  /** @deprecated kept for backward compat — no longer used in layout */
  showNewsletter?: boolean;
  /** @deprecated kept for backward compat — no longer used in layout */
  onNewsletterSubmit?: (email: string) => void;
  className?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const Footer = ({
  logoSrc,
  description = 'Smarter IELTS preparation for ambitious learners. Practice, track, improve — all in one place.',
  columns,
  contactInfo,
  socialLinks,
  showCopyright = false,
  className = '',
}: FooterProps & { onContactClick?: () => void }) => (
  <footer className={twMerge('bg-[#191d24] w-full', className)}>

    {/* ── Main row ─────────────────────────────────────────────────────── */}
    <div className="flex items-start justify-between max-w-[1400px] mx-auto px-[90px] py-[48px]">

      {/* Brand column */}
      <div className="flex flex-col gap-[14px] shrink-0 w-[280px]">
        {/* Wordmark */}
        <a href="/" className="no-underline flex items-center">
          {logoSrc ? (
            <img src={logoSrc} alt="VIT IELTS" className="h-[28px] w-auto object-contain" />
          ) : (
            <span className="font-display font-bold text-[19px] leading-[1.3] whitespace-nowrap">
              <span className="text-white">VIT</span>
              <span className="text-[#9ad534]">IELTS</span>
            </span>
          )}
        </a>

        {/* Description */}
        {description && (
          <p className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">
            {description}
          </p>
        )}

        {/* Contact info (optional) */}
        {contactInfo && (
          <div className="flex flex-col gap-[6px] mt-1">
            {contactInfo.phone   && <span className="font-inter text-[13px] text-[#6a7282]">{contactInfo.phone}</span>}
            {contactInfo.email   && <span className="font-inter text-[13px] text-[#6a7282]">{contactInfo.email}</span>}
            {contactInfo.address && <span className="font-inter text-[13px] text-[#6a7282]">{contactInfo.address}</span>}
          </div>
        )}

        {/* Social links (optional) */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex items-center gap-[12px] mt-2">
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-white/10 text-[#6a7282] hover:bg-[#b3e653] hover:text-[#191d24] transition-colors duration-150"
              >
                {/* icon can be ReactNode or a string shorthand */}
                {typeof s.icon === 'string' ? (
                  <span className="font-inter font-bold text-[11px] uppercase">{s.icon}</span>
                ) : (
                  s.icon
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Link columns */}
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-[10px] shrink-0">
          {/* Column header — Eyebrow style */}
          <p className="font-inter font-bold text-[12px] leading-[1.2] text-white uppercase tracking-[0.96px] whitespace-nowrap">
            {col.title}
          </p>

          {/* 4px visual spacer (matches Figma gap node) */}
          <div className="h-[4px]" />

          {/* Links */}
          {col.links.map((link, j) => (
            <a
              key={j}
              href={link.href}
              className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282] no-underline hover:text-white transition-colors duration-150 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>
      ))}
    </div>

    {/* ── Optional copyright bar ────────────────────────────────────────── */}
    {showCopyright && (
      <div className="border-t border-white/[0.06] px-[90px] py-[20px] max-w-[1400px] mx-auto flex items-center justify-between">
        <span className="font-inter text-[13px] text-[#6a7282]">
          © {new Date().getFullYear()} VIT IELTS. All rights reserved.
        </span>
        <div className="flex items-center gap-[24px]">
          <a href="/privacy-policy" className="font-inter text-[13px] text-[#6a7282] no-underline hover:text-white transition-colors">Privacy Policy</a>
          <a href="/terms-of-use" className="font-inter text-[13px] text-[#6a7282] no-underline hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    )}
  </footer>
);
