
export type NavLinkProps = {
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
};

export const NavLink = ({ href, icon, active = false, children, onClick, className = '' }: NavLinkProps) => (
  <a
    href={href}
    className={`nav-link ${active ? 'nav-link--active' : ''} ${className}`}
    onClick={onClick}
  >
    {icon && <span className="nav-link__icon">{icon}</span>}
    <span className="nav-link__label">{children}</span>
  </a>
);
