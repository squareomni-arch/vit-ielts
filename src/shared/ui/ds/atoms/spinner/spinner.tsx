
export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
};

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => (
  <div className={`spinner spinner--${size} ${className}`} role="status" aria-label="Loading">
    <span className="spinner__circle" />
  </div>
);
