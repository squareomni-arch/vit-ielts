
/**
 * Footer — Figma node 4081:6893 (site-wide).
 *
 * Dark `#191d24` bar, contained to 1400px. Five clusters on desktop, justified:
 *   1. Brand — logo lockup (logo-on-dark.svg), description, social icons.
 *   2-4. Link columns (data-driven via `columns` prop): header #64748b 12px
 *        bold uppercase tracking-[1.2px]; links #cbd5e1 14px, hover → white.
 *   5. Newsletter — "STAY UPDATED", email input + Subscribe, contact info.
 * Divider (#2a2f3a) then the bottom row: copyright + legal links.
 * All existing props preserved for backward compat.
 */

import { twMerge } from 'tailwind-merge';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FooterLink   = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterProps = {
  /** Override the logo lockup with a custom image. */
  logoSrc?: string;
  /** Short tagline under the logo. */
  description?: string;
  /** Data-driven link columns (title + links[]). */
  columns: FooterColumn[];
  /** Contact info shown in the newsletter cluster. */
  contactInfo?: { phone?: string; email?: string; address?: string };
  /** Social icon links. When omitted, the brand defaults below are used. */
  socialLinks?: { icon: React.ReactNode; href: string; label: string }[];
  /** Show the bottom copyright + legal row. Default false. */
  showCopyright?: boolean;
  /** @deprecated kept for backward compat — no longer used in layout */
  showNewsletter?: boolean;
  /** @deprecated kept for backward compat — no longer used in layout */
  onNewsletterSubmit?: (email: string) => void;
  className?: string;
};

// ─── Icons (exact SVGs; contact icons from Figma, socials are brand glyphs) ────

type SvgProps = React.SVGProps<SVGSVGElement>;

const IconEnvelope = (p: SvgProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M2 4.66667L8 8.66667L14 4.66667M2 4H14V12H2V4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPhone = (p: SvgProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M10.2744 9.08374C10.3436 9.03766 10.4233 9.00959 10.5061 9.00206C10.5889 8.99453 10.6723 9.00778 10.7488 9.04061L13.6963 10.3612C13.7956 10.4037 13.8785 10.4772 13.9326 10.5707C13.9867 10.6642 14.009 10.7727 13.9963 10.88C13.8992 11.6056 13.5418 12.2713 12.9907 12.7533C12.4395 13.2352 11.7321 13.5005 11 13.5C8.74566 13.5 6.58365 12.6045 4.98959 11.0104C3.39553 9.41633 2.5 7.25433 2.5 4.99999C2.49944 4.26786 2.7648 3.56045 3.24673 3.00932C3.72865 2.45818 4.39435 2.10084 5.12 2.00374C5.22727 1.99099 5.33578 2.01333 5.4293 2.06741C5.52281 2.12149 5.5963 2.2044 5.63875 2.30374L6.95938 5.25374C6.99182 5.3295 7.00504 5.41212 6.99784 5.49423C6.99064 5.57634 6.96326 5.65539 6.91813 5.72436L5.5825 7.31249C5.53512 7.38398 5.50711 7.46654 5.50119 7.55209C5.49528 7.63765 5.51166 7.72328 5.54875 7.80061C6.06563 8.85874 7.15938 9.93936 8.22063 10.4512C8.29836 10.4882 8.38439 10.5042 8.47021 10.4977C8.55602 10.4912 8.63867 10.4625 8.71 10.4144L10.2744 9.08374Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconFacebook = (p: SvgProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const IconInstagram = (p: SvgProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const IconYouTube = (p: SvgProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const IconTikTok = (p: SvgProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const DEFAULT_SOCIALS = [
  { label: 'Facebook', href: '#', Glyph: IconFacebook },
  { label: 'Instagram', href: '#', Glyph: IconInstagram },
  { label: 'YouTube', href: '#', Glyph: IconYouTube },
  { label: 'TikTok', href: '#', Glyph: IconTikTok },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const Footer = ({
  logoSrc = '/assets/logos/logo-on-dark.svg',
  description = 'Smarter IELTS preparation for ambitious learners. Practice, track, improve — all in one place.',
  columns,
  contactInfo = { email: 'hello@vitielts.com', phone: '1900 8888' },
  socialLinks,
  showCopyright = false,
  className = '',
}: FooterProps) => (
  <footer className={twMerge('bg-[#191d24] w-full', className)}>
    <div className="mx-auto flex max-w-[1400px] flex-col gap-9 px-6 pb-7 pt-16 sm:px-10 lg:px-16">

      {/* ── Main row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8">

        {/* Brand */}
        <div className="flex flex-col gap-5 lg:w-[330px] lg:shrink-0">
          <a href="/" aria-label="Vịt IELTS" className="flex items-center">
            <img src={logoSrc} alt="Vịt IELTS" className="h-9 w-auto object-contain" />
          </a>
          {description && (
            <p className="max-w-[300px] font-inter text-[14px] leading-relaxed text-[#94a3b8]">{description}</p>
          )}
          <div className="flex items-center gap-3.5">
            {socialLinks && socialLinks.length > 0
              ? socialLinks.map((s, i) => (
                  <a key={i} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="text-[#cbd5e1] transition-colors hover:text-[#b3e653]">
                    {s.icon}
                  </a>
                ))
              : DEFAULT_SOCIALS.map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="text-[#cbd5e1] transition-colors hover:text-[#b3e653]">
                    <s.Glyph className="size-7" />
                  </a>
                ))}
          </div>
        </div>

        {/* Link columns — 2/3-col grid on mobile; `lg:contents` dissolves the
            wrapper so the columns join the row's justify-between on desktop. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:contents">
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-3 lg:shrink-0">
              <p className="font-inter text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-[#64748b]">{col.title}</p>
              {col.links.map((link, j) => (
                <a key={j} href={link.href} className="font-inter text-[14px] text-[#cbd5e1] no-underline transition-colors hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-3.5 lg:w-[320px] lg:shrink-0">
          <p className="font-inter text-[12px] font-bold uppercase leading-4 tracking-[1.2px] text-[#64748b]">Stay updated</p>
          <p className="max-w-[300px] font-inter text-[14px] text-[#94a3b8]">Get IELTS tips &amp; exclusive offers in your inbox.</p>
          {/* ponytail: newsletter posts nowhere yet — submit is a no-op.
              Wire to a /pages/api route + service when the backend reaches it. */}
          <form className="flex w-full flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="Your email"
              className="h-11 w-full rounded-[10px] border border-[#2f3542] bg-[#242938] px-4 font-inter text-[14px] text-white outline-none placeholder:text-[#64748b] focus:border-[#b3e653]"
            />
            <button type="submit" className="w-full rounded-full bg-[#b3e653] px-[26px] py-[15px] font-inter text-[14px] font-bold uppercase text-[#191d24] shadow-[0px_4px_7.5px_rgba(25,29,36,0.2)] transition-colors hover:bg-[#9ad534]">
              Subscribe
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[#cbd5e1]">
            {contactInfo?.email && (
              <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 font-inter text-[14px] no-underline hover:text-white">
                <IconEnvelope className="size-4 shrink-0" /> {contactInfo.email}
              </a>
            )}
            {contactInfo?.phone && (
              <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 font-inter text-[14px] no-underline hover:text-white">
                <IconPhone className="size-4 shrink-0" /> {contactInfo.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      {showCopyright && (
        <>
          <div className="h-px w-full bg-[#2a2f3a]" />
          {/* ── Bottom row ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-inter text-[13px] text-[#64748b]">© {new Date().getFullYear()} Vịt IELTS. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <a href="/terms-of-use" className="font-inter text-[13px] text-[#64748b] no-underline transition-colors hover:text-white">Terms</a>
              <a href="/privacy-policy" className="font-inter text-[13px] text-[#64748b] no-underline transition-colors hover:text-white">Privacy</a>
            </div>
          </div>
        </>
      )}
    </div>
  </footer>
);
