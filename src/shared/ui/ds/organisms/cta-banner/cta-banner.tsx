// CSS loaded via styles.css → _app.tsx (Pages Router)

/**
 * Design System CTA Banner
 *
 * @figma Node 412:6730 — "CTA" component (1920×359)
 *
 * Structure (from Figma API):
 *   [COMPONENT] "CTA" 1920×359 — transparent wrapper
 *     [FRAME] "Frame 48" 1600×250 — red pill (#D94A56 + dot pattern), r:150
 *       [FRAME] "Frame 54" 716×185 — text group (vertical, gap:32)
 *         [TEXT] title — white, bold, 46px/63px
 *         [TEXT] subtitle — white, 500, 20px/27px
 *         [INSTANCE] "Button2" 232×57 — white bg, r:25, text #D94A56
 *       [INSTANCE] "Component 1" 500×421 — mascot (overflows top)
 *         [RECT] gradient backdrop
 *         [RECT] mascot image 450×379, drop-shadow(4,0,4)
 */

export type CTABannerProps = {
  /** Main heading text */
  title: string;
  /** Supporting description */
  subtitle?: string;
  /** Button label */
  ctaText?: string;
  /** Button destination URL */
  ctaHref?: string;
  /** Click handler (if no href) */
  onCtaClick?: () => void;
  /** Mascot image path */
  mascotSrc?: string;
  /** Additional CSS class on outermost element */
  className?: string;
};

export const CTABanner = ({
  title,
  subtitle,
  ctaText = 'Nâng cấp Premium',
  ctaHref,
  onCtaClick,
  mascotSrc = '/assets/figma/icons/mascot.png',
  className = '',
}: CTABannerProps) => {
  const buttonContent = (
    <span className="cta-banner__btn-label">{ctaText}</span>
  );

  return (
    <section className={`cta-banner ${className}`.trim()}>
      {/* Layer 2: Red pill shape with dot-pattern overlay */}
      <div className="cta-banner__pill">
        {/* Layer 3a: Text content group — Figma "Frame 54" */}
        <div className="cta-banner__content">
          <div className="cta-banner__text-group">
            <h2 className="cta-banner__title">{title}</h2>
            {subtitle && (
              <p className="cta-banner__subtitle">{subtitle}</p>
            )}
          </div>

          {/* Button — Figma "Button2" */}
          {ctaHref ? (
            <a href={ctaHref} className="cta-banner__btn">
              {buttonContent}
            </a>
          ) : (
            <button
              type="button"
              className="cta-banner__btn"
              onClick={onCtaClick}
            >
              {buttonContent}
            </button>
          )}
        </div>

        {/* Layer 3b: Mascot — Figma "Component 1" */}
        {mascotSrc && (
          <div className="cta-banner__mascot-area">
            <img
              src={mascotSrc}
              alt="IELTS Prediction Mascot"
              className="cta-banner__mascot"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
};
