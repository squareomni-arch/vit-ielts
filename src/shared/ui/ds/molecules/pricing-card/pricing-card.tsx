import { Button } from '../../atoms/button';

/**
 * @figma IELTS Prediction Test — Subscription page pricing cards
 */

export type PricingCardProps = {
  name: string;
  price: string;
  priceLabel?: string;
  popular?: boolean;
  features: string[];
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
};

export const PricingCard = ({
  name,
  price,
  priceLabel,
  popular = false,
  features,
  ctaText = 'Mua ngay',
  ctaHref,
  onCtaClick,
  className = '',
}: PricingCardProps) => (
  <div className={`pricing-card ${popular ? 'pricing-card--popular' : ''} ${className}`}>
    {popular && <span className="pricing-card__badge">Phổ biến</span>}
    <h3 className="pricing-card__name">{name}</h3>
    <div className="pricing-card__price-row">
      <span className="pricing-card__price">{price}</span>
      {priceLabel && <span className="pricing-card__price-label">{priceLabel}</span>}
    </div>
    <ul className="pricing-card__features">
      {features.map((f, i) => (
        <li key={i} className="pricing-card__feature">
          <span className="pricing-card__check">✓</span>
          {f}
        </li>
      ))}
    </ul>
    <Button
      variant={popular ? 'primary' : 'secondary'}
      fullWidth
      onClick={onCtaClick}
    >
      {ctaText}
    </Button>
  </div>
);
