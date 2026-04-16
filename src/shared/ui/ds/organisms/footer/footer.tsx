
/**
 * Design System Footer
 *
 * @figma IELTS Prediction Test — "Footer" component
 * Dark navy background, 4-column layout, social icons, newsletter
 */

import { Button } from '../../atoms/button';

export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type FooterProps = {
  logoSrc?: string;
  description?: string;
  columns: FooterColumn[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialLinks?: { icon: React.ReactNode; href: string; label: string }[];
  showNewsletter?: boolean;
  onNewsletterSubmit?: (email: string) => void;
  className?: string;
};

export const Footer = ({
  logoSrc = '/logo.svg',
  description,
  columns,
  contactInfo,
  socialLinks,
  onContactClick,
  className = '',
}: FooterProps & { onContactClick?: () => void }) => (
  <footer className={`footer ${className}`}>
    <div className="footer__container">
      {/* Brand Column */}
      <div className="footer__brand">
        <img src={logoSrc} alt="Logo" className="footer__logo" />
        {description && <p className="footer__description">{description}</p>}
        {socialLinks && (
          <div className="footer__social">
            {socialLinks.map((s, i) => (
              <a key={i} href={s.href} className="footer__social-link" aria-label={s.label} target="_blank" rel="noopener noreferrer">
                {s.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Link Columns */}
      {columns.map((col, i) => (
        <div key={i} className="footer__column">
          <h4 className="footer__column-title">{col.title}</h4>
          <ul className="footer__links">
            {col.links.map((link, j) => (
              <li key={j}>
                <a href={link.href} className="footer__link">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Contact Column */}
      <div className="footer__column">
        <h4 className="footer__column-title">Liên hệ</h4>
        {contactInfo && (
          <ul className="footer__links">
            {/* {contactInfo.address && <li className="footer__contact-item">📍 {contactInfo.address}</li>} */}
            {contactInfo.phone && <li className="footer__contact-item">📞 {contactInfo.phone}</li>}
            {contactInfo.email && <li className="footer__contact-item">✉️ {contactInfo.email}</li>}
          </ul>
        )}
        <div className="footer__contact-btn">
          <Button variant="primary" size="md" onClick={onContactClick}>
            Contact Us
          </Button>
        </div>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="footer__bottom">
      <span>© {new Date().getFullYear()} IELTS Prediction Test. All rights reserved.</span>
      <div className="footer__legal">
        <a href="#" className="footer__link" style={{ marginRight: 24 }}>Privacy Policy</a>
        <a href="#" className="footer__link">Terms of Service</a>
      </div>
    </div>
  </footer>
);
