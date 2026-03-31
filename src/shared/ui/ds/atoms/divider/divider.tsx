
export type DividerProps = {
  direction?: 'horizontal' | 'vertical';
  className?: string;
};

export const Divider = ({ direction = 'horizontal', className = '' }: DividerProps) => (
  <div className={`divider divider--${direction} ${className}`} role="separator" />
);
