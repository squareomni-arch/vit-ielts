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
  <a
    href={href}
    onClick={onClick}
    className={[
      'flex items-center rounded-[14px] px-[14px] py-[10px] no-underline transition-colors duration-150 shrink-0',
      collapsed ? 'justify-center w-[44px]' : 'gap-[12px] w-full',
      active ? 'bg-[var(--color-brand)]' : 'hover:bg-[var(--color-brand-tint)]',
    ].join(' ')}
  >
    <span
      className="material-symbols-rounded text-[22px] leading-none shrink-0"
      style={{ color: active ? 'var(--color-ink-900)' : 'var(--color-ink-muted)' }}
    >
      {icon}
    </span>
    {!collapsed && (
      <span
        className="text-[15px] font-bold font-inter leading-[1.2] flex-1 min-w-0 truncate"
        style={{ color: active ? 'var(--color-ink-900)' : 'var(--color-ink-muted)' }}
      >
        {label}
      </span>
    )}
  </a>
);
