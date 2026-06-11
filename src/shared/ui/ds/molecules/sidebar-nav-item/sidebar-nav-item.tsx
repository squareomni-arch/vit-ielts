import Link from 'next/link';

export type SidebarNavItemProps = {
  icon: string;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export const SidebarNavItem = ({
  icon,
  label,
  active = false,
  collapsed = false,
  href = '#',
  onClick,
}: SidebarNavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    aria-label={collapsed ? label : undefined}
    aria-current={active ? 'page' : undefined}
    title={collapsed ? label : undefined}
    className={[
      'ds-sidebar-item flex items-center w-full min-h-[var(--size-sidebar-control)] rounded-[var(--radius-sidebar-item)] py-[var(--spacing-sidebar-item-y)]',
      'no-underline transition-colors duration-[var(--motion-sidebar-state-duration)] shrink-0 overflow-hidden',
      collapsed ? 'px-[11px]' : 'px-[var(--spacing-sidebar-item-x)]',
      active ? 'bg-[var(--color-brand)]' : 'hover:bg-[var(--color-brand-tint)]',
    ].join(' ')}
  >
    <span
      aria-hidden="true"
      className="material-symbols-rounded text-[var(--size-sidebar-icon)] leading-none shrink-0 w-[var(--size-sidebar-icon)] flex items-center justify-center"
      style={{ color: active ? 'var(--color-ink-900)' : 'var(--color-ink-muted)' }}
    >
      {icon}
    </span>

    <span
      aria-hidden={collapsed}
      data-collapsed={collapsed}
      className="ds-sidebar-reveal text-body-s font-semibold font-inter leading-none whitespace-nowrap overflow-hidden min-w-0"
      style={{ color: active ? 'var(--color-ink-900)' : 'var(--color-ink-muted)' }}
    >
      {label}
    </span>
  </Link>
);
