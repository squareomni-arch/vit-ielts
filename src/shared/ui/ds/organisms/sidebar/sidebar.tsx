import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { SidebarNavItem } from '../../molecules/sidebar-nav-item';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SidebarUser = {
  name: string;
  role: string;
  initials: string;
  avatarColor?: string;
};

export type SidebarNavEntry = {
  id: string;
  icon: string;
  label: string;
  href?: string;
};

export type SidebarStudentProps = {
  state?: 'expanded' | 'collapsed';
  activeItem?: string;
  user?: SidebarUser;
  onCollapse?: () => void;
  /** Override the primary / community / account nav groups (each entry may carry an href). */
  menu?: readonly SidebarNavEntry[];
  community?: readonly SidebarNavEntry[];
  account?: readonly SidebarNavEntry[];
  /** When set, the bottom profile card links to this route. */
  profileHref?: string;
  onLogout?: () => void;
  className?: string;
};

export type SidebarTeacherProps = {
  state?: 'expanded' | 'collapsed';
  activeItem?: string;
  user?: SidebarUser;
  onCollapse?: () => void;
  menu?: readonly SidebarNavEntry[];
  account?: readonly SidebarNavEntry[];
  /** When set, the bottom profile card links to this route. */
  profileHref?: string;
  onLogout?: () => void;
  className?: string;
};

export type SidebarTopActionsProps = {
  userInitials?: string;
  avatarColor?: string;
  onSearch?: (q: string) => void;
  onNotifications?: () => void;
  /** When set, the avatar links to this route. */
  profileHref?: string;
  className?: string;
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const IconSignOut = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12.75L15.75 9L12 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.75 9H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProfileSection = ({
  user,
  collapsed,
  profileHref,
  onLogout,
}: {
  user: SidebarUser;
  collapsed: boolean;
  profileHref?: string;
  onLogout?: () => void;
}) => {
  const avatarNode = (
    <div
      className="flex items-center justify-center rounded-[var(--radius-sidebar-avatar)] w-[var(--size-sidebar-avatar)] h-[var(--size-sidebar-avatar)] shrink-0 text-white text-body-s font-bold font-inter"
      style={{ background: user.avatarColor ?? 'var(--color-accent-blue)' }}
    >
      {user.initials}
    </div>
  );

  // Text block: always in DOM, revealed via max-width + opacity + translateX
  const textBlock = (
    <div
      aria-hidden={collapsed}
      data-collapsed={collapsed}
      className="ds-sidebar-reveal flex flex-col gap-[var(--spacing-sidebar-profile-text-gap)] overflow-hidden whitespace-nowrap"
      style={{ '--sidebar-reveal-max-width': 'var(--size-sidebar-profile-text-max)' } as React.CSSProperties}
    >
      <span className="text-body-s font-bold font-inter text-[var(--color-ink-900)] leading-normal">
        {user.name}
      </span>
      <span className="text-caption-bold font-inter font-normal text-[var(--color-ink-muted)] leading-normal">
        {user.role}
      </span>
    </div>
  );

  const rowClass = [
    'ds-sidebar-profile-row flex items-center w-full min-h-[var(--size-sidebar-control)] rounded-[var(--radius-sidebar-row)] overflow-hidden',
    collapsed
      ? 'p-[3px]'
      : 'p-[var(--spacing-sidebar-section-x-collapsed)]',
  ].join(' ');

  const profileRow = profileHref ? (
    <Link
      href={profileHref}
      aria-label="My Profile"
      className={`${rowClass} no-underline cursor-pointer transition-colors duration-[var(--motion-sidebar-state-duration)] hover:bg-[var(--color-brand-tint)]`}
    >
      {avatarNode}
      {textBlock}
    </Link>
  ) : (
    <div className={rowClass}>
      {avatarNode}
      {textBlock}
    </div>
  );

  const cardPadding = collapsed
    ? 'p-[var(--spacing-sidebar-profile-card-padding-collapsed)]'
    : 'p-[var(--spacing-sidebar-profile-card-padding)]';

  return (
    <div className={`ds-sidebar-profile-card flex flex-col w-full shrink-0 bg-white border border-[var(--color-border-hairline)] rounded-[var(--radius-sidebar-card)] gap-[var(--spacing-sidebar-section-x-collapsed)] overflow-hidden ${cardPadding}`}>
      {profileRow}
      <hr className="w-full border-0 border-t border-[var(--color-border-hairline)] m-0" />
      <button
        type="button"
        onClick={onLogout}
        aria-label="Logout"
        className={[
          'ds-sidebar-logout-btn flex items-center w-full min-h-[var(--size-sidebar-control)] rounded-[var(--radius-sidebar-row)] shrink-0 overflow-hidden',
          collapsed
            ? 'px-[11px] py-[var(--spacing-sidebar-section-x)]'
            : 'px-[var(--spacing-sidebar-section-x-collapsed)] py-[var(--spacing-sidebar-section-x)]',
          'bg-transparent border-none cursor-pointer transition-colors duration-[var(--motion-sidebar-state-duration)]',
          'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-blush)] hover:text-[var(--color-danger)]',
        ].join(' ')}
      >
        <span aria-hidden="true" className="shrink-0 flex items-center justify-center w-[var(--size-sidebar-icon)] h-[var(--size-sidebar-icon)]">
          <IconSignOut />
        </span>
        <span
          aria-hidden={collapsed}
          data-collapsed={collapsed}
          className="ds-sidebar-reveal text-body-s font-medium font-inter leading-none whitespace-nowrap overflow-hidden"
        >
          Logout
        </span>
      </button>
    </div>
  );
};

const SidebarDivider = () => (
  <hr className="w-full border-0 border-t border-[var(--color-border-hairline)] shrink-0 m-0" />
);


const SidebarLogo = ({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
}) => (
  // Fixed h-[60px] = pt-4 (4) + content (40) + pb-16 (16) — keeps all items below stable
  <div className="flex items-center h-[var(--size-sidebar-logo-row)] pt-[var(--spacing-sidebar-logo-top)] pb-[var(--spacing-sidebar-logo-bottom)] px-[var(--spacing-sidebar-logo-x)] w-full shrink-0 overflow-hidden">
    <button
      type="button"
      onClick={onCollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      className={[
        'flex items-center h-[var(--size-sidebar-control)] rounded-[var(--radius-sidebar-item)] overflow-hidden',
        'bg-transparent border-none cursor-pointer transition-[width,background-color] duration-[var(--motion-sidebar-control-duration)]',
        'hover:bg-[var(--color-brand-tint)]',
        'mr-auto justify-start pl-[var(--spacing-sidebar-logo-mark-inset)] pr-0',
        collapsed ? 'w-[var(--size-sidebar-control)]' : 'w-[var(--size-sidebar-logo-full)]',
      ].join(' ')}
    >
      <div
        className="overflow-hidden shrink-0 flex items-center justify-start transition-[width] duration-[var(--motion-sidebar-control-duration)]"
        style={{ width: collapsed ? 'var(--size-sidebar-logo)' : 'var(--size-sidebar-logo-full)' }}
      >
        <img
          src="/assets/logos/logo-on-bright.svg"
          alt="VitIELTS"
          className="h-[var(--size-sidebar-logo)] w-auto max-w-none object-contain shrink-0"
        />
      </div>
    </button>

    {/* Expanded: separate menu affordance; logo itself stays one clipped asset. */}
    <button
      type="button"
      onClick={onCollapse}
      aria-label="Collapse sidebar"
      aria-expanded={!collapsed}
      className={[
        'flex items-center justify-center h-[var(--size-sidebar-control)] rounded-[var(--radius-sidebar-item)]',
        'bg-transparent border-none cursor-pointer transition-all duration-[var(--motion-sidebar-control-duration)] ease-in-out',
        'hover:bg-[var(--color-brand-tint)] shrink-0 overflow-hidden',
        collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[var(--size-sidebar-control)] opacity-100 pointer-events-auto',
      ].join(' ')}
    >
      <span aria-hidden="true" className="material-symbols-rounded text-[var(--size-sidebar-icon)] text-[var(--color-ink-muted)]">menu</span>
    </button>
  </div>
);

// ── Data ──────────────────────────────────────────────────────────────────────

const ACCOUNT_ITEMS = [
  { id: 'settings', icon: 'settings', label: 'Settings' },
  { id: 'help',     icon: 'help',     label: 'Help & Support' },
 ] as const;

const STUDENT_MENU = [
  { id: 'home',        icon: 'home',           label: 'Home' },
  { id: 'mock-tests',  icon: 'quiz',            label: 'Mock Tests' },
  { id: 'study-plan',  icon: 'calendar_today',  label: 'Study Plan' },
  { id: 'progress',    icon: 'emoji_events',    label: 'My Progress' },
  { id: 'vocabulary',  icon: 'menu_book',       label: 'Vocabulary' },
  { id: 'my-classes',  icon: 'school',          label: 'My Classes' },
  { id: 'assignments', icon: 'assignment',      label: 'My Assignments' },
] as const;

const STUDENT_COMMUNITY = [
  { id: 'community', icon: 'forum', label: 'Community' },
  { id: 'blog',      icon: 'book',  label: 'Blog' },
] as const;

const TEACHER_MENU = [
  { id: 'overview',      icon: 'home',      label: 'Overview' },
  { id: 'my-classes',    icon: 'school',    label: 'My Classes' },
  { id: 'assignments',   icon: 'menu_book', label: 'Assignments' },
  { id: 'students',      icon: 'person',    label: 'Students' },
  { id: 'collaborators', icon: 'group',     label: 'Collaborators' },
] as const;

// ── SidebarStudent ────────────────────────────────────────────────────────────

export const SidebarStudent = ({
  state = 'expanded',
  activeItem = 'home',
  user = { name: 'Nhật Minh', role: 'Target: Band 8.0', initials: 'NM' },
  onCollapse,
  menu = STUDENT_MENU,
  community = STUDENT_COMMUNITY,
  account = ACCOUNT_ITEMS,
  profileHref,
  onLogout,
  className = '',
}: SidebarStudentProps) => {
  const collapsed = state === 'collapsed';
  const navGroupX = 'px-[var(--spacing-sidebar-section-x-collapsed)]';

  return (
    <div
      data-collapsed={collapsed}
      className={twMerge(
        'ds-sidebar-shell flex flex-col gap-[var(--spacing-sidebar-gap)] items-center bg-white overflow-hidden shrink-0',
        'px-[var(--spacing-sidebar-outer-x)] py-[var(--spacing-sidebar-outer-y)]',
        className,
      )}
    >
      <SidebarLogo collapsed={collapsed} onCollapse={onCollapse} />
      <SidebarDivider />

      <div className={`flex flex-col w-full ${navGroupX} shrink-0`}>
        <div className="flex flex-col gap-[var(--spacing-sidebar-section-x)] w-full">
          {menu.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <SidebarDivider />

      <div className={`flex flex-col w-full ${navGroupX} shrink-0`}>
        <div className="flex flex-col gap-[var(--spacing-sidebar-section-x)] w-full">
          {community.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <SidebarDivider />

      <div className={`flex flex-col w-full ${navGroupX} shrink-0`}>
        <div className="flex flex-col gap-[var(--spacing-sidebar-section-x)] w-full">
          {account.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full" />
      <ProfileSection user={user} collapsed={collapsed} profileHref={profileHref} onLogout={onLogout} />
    </div>
  );
};

// ── SidebarTeacher ────────────────────────────────────────────────────────────

export const SidebarTeacher = ({
  state = 'expanded',
  activeItem = 'overview',
  user = { name: 'Pham Minh', role: 'Teacher', initials: 'PM' },
  onCollapse,
  menu = TEACHER_MENU,
  account = ACCOUNT_ITEMS,
  profileHref,
  onLogout,
  className = '',
}: SidebarTeacherProps) => {
  const collapsed = state === 'collapsed';
  const navGroupX = 'px-[var(--spacing-sidebar-section-x-collapsed)]';

  return (
    <div
      data-collapsed={collapsed}
      className={twMerge(
        'ds-sidebar-shell flex flex-col gap-[var(--spacing-sidebar-gap)] items-center bg-white overflow-hidden shrink-0',
        'px-[var(--spacing-sidebar-outer-x)] py-[var(--spacing-sidebar-outer-y)]',
        className,
      )}
    >
      <SidebarLogo collapsed={collapsed} onCollapse={onCollapse} />
      <SidebarDivider />

      <div className={`flex flex-col w-full ${navGroupX} shrink-0`}>
        <div className="flex flex-col gap-[var(--spacing-sidebar-section-x)] w-full">
          {menu.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <SidebarDivider />

      <div className={`flex flex-col w-full ${navGroupX} shrink-0`}>
        <div className="flex flex-col gap-[var(--spacing-sidebar-section-x)] w-full">
          {account.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full" />
      <ProfileSection user={user} collapsed={collapsed} profileHref={profileHref} onLogout={onLogout} />
    </div>
  );
};

// ── SidebarTopActions ─────────────────────────────────────────────────────────

export const SidebarTopActions = ({
  userInitials = 'NM',
  avatarColor,
  onSearch,
  onNotifications,
  profileHref,
  className = '',
}: SidebarTopActionsProps) => (
  <div className={`flex gap-[14px] items-center ${className}`}>
    {/* Search bar */}
    <label className="flex items-center gap-[10px] h-[46px] px-[18px] w-[280px] bg-white border border-[rgba(25,29,36,0.1)] rounded-full shrink-0 cursor-text">
      <span className="material-symbols-rounded text-[18px] text-[var(--color-ink-muted)] shrink-0 leading-none">
        search
      </span>
      <input
        type="text"
        placeholder="Search…"
        onChange={e => onSearch?.(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-[14px] font-inter text-[var(--color-ink-muted)] placeholder:text-[var(--color-ink-muted)]"
      />
    </label>

    {/* User avatar */}
    {profileHref ? (
      <Link
        href={profileHref}
        aria-label="My Profile"
        className="flex items-center justify-center w-[46px] h-[46px] rounded-full shrink-0 text-white text-[14px] font-bold font-inter no-underline cursor-pointer transition-shadow hover:ring-2 hover:ring-[var(--color-brand)] hover:ring-offset-2"
        style={{ background: avatarColor ?? 'var(--color-accent-blue)' }}
      >
        {userInitials}
      </Link>
    ) : (
      <div
        className="flex items-center justify-center w-[46px] h-[46px] rounded-full shrink-0 text-white text-[14px] font-bold font-inter"
        style={{ background: avatarColor ?? 'var(--color-accent-blue)' }}
      >
        {userInitials}
      </div>
    )}

    {/* Notifications */}
    <button
      type="button"
      onClick={onNotifications}
      className="flex items-center justify-center w-[46px] h-[46px] rounded-full bg-white border border-[rgba(25,29,36,0.1)] shrink-0 cursor-pointer hover:bg-[var(--color-brand-tint)] transition-colors"
      aria-label="Notifications"
    >
      <span className="material-symbols-rounded text-[20px] leading-none" style={{ color: 'var(--color-ink-900)' }}>
        notifications
      </span>
    </button>
  </div>
);
