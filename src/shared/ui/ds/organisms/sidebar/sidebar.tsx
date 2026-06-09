import { SidebarNavItem } from '../../molecules/sidebar-nav-item';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SidebarUser = {
  name: string;
  role: string;
  initials: string;
  avatarColor?: string;
};

export type SidebarStudentProps = {
  state?: 'expanded' | 'collapsed';
  activeItem?: string;
  user?: SidebarUser;
  onCollapse?: () => void;
  className?: string;
};

export type SidebarTeacherProps = {
  state?: 'expanded' | 'collapsed';
  activeItem?: string;
  user?: SidebarUser;
  onCollapse?: () => void;
  className?: string;
};

export type SidebarTopActionsProps = {
  userInitials?: string;
  avatarColor?: string;
  onSearch?: (q: string) => void;
  onNotifications?: () => void;
  className?: string;
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const SidebarDivider = () => (
  <hr className="w-full border-0 border-t border-[var(--color-border-hairline)] shrink-0 m-0" />
);

const ProfileCard = ({ user, collapsed }: { user: SidebarUser; collapsed: boolean }) => (
  <div
    className={[
      'flex items-center gap-[10px] bg-white border border-[rgba(25,29,36,0.1)] rounded-[14px] p-[10px] w-full shrink-0',
      collapsed ? 'justify-center' : '',
    ].join(' ')}
  >
    <div
      className="flex items-center justify-center rounded-[19px] w-[38px] h-[38px] shrink-0 text-white text-[14px] font-bold font-inter"
      style={{ background: user.avatarColor ?? 'var(--color-accent-blue)' }}
    >
      {user.initials}
    </div>
    {!collapsed && (
      <div className="flex flex-col gap-[2px] min-w-0 overflow-hidden">
        <span className="text-[14px] font-bold font-inter text-[var(--color-ink-900)] truncate leading-normal">
          {user.name}
        </span>
        <span className="text-[12px] font-inter text-[var(--color-ink-muted)] truncate leading-normal">
          {user.role}
        </span>
      </div>
    )}
  </div>
);

const SidebarLogo = ({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
}) => (
  <div
    className={[
      'flex items-center gap-[10px] pb-[16px] pt-[4px] px-[8px] w-full shrink-0',
      collapsed ? 'justify-center' : '',
    ].join(' ')}
  >
    {collapsed ? (
      <button
        type="button"
        onClick={onCollapse}
        className="bg-transparent border-none cursor-pointer p-0 flex items-center"
        aria-label="Expand sidebar"
      >
        <span className="text-[20px] font-bold font-display" style={{ color: 'var(--color-brand)' }}>
          V
        </span>
      </button>
    ) : (
      <>
        <span className="text-[18px] font-bold font-display text-[var(--color-ink-900)] shrink-0 whitespace-nowrap">
          Vit<span style={{ color: 'var(--color-brand)' }}>IELTS</span>
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="ml-auto flex items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-transparent border-none cursor-pointer hover:bg-[var(--color-brand-tint)] transition-colors"
          aria-label="Collapse sidebar"
        >
          <span className="material-symbols-rounded text-[22px] text-[var(--color-ink-muted)]">menu</span>
        </button>
      </>
    )}
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
  className = '',
}: SidebarStudentProps) => {
  const collapsed = state === 'collapsed';

  return (
    <div
      className={[
        'flex flex-col gap-[12px] items-center bg-white',
        collapsed ? 'px-[14px] w-[76px]' : 'px-[16px] w-[250px]',
        'py-[22px] h-[900px] shrink-0',
        className,
      ].join(' ')}
    >
      <SidebarLogo collapsed={collapsed} onCollapse={onCollapse} />
      <SidebarDivider />

      <div className={`flex flex-col w-full px-[6px] shrink-0 ${collapsed ? 'items-center' : 'items-start'}`}>
        <div className={`flex flex-col gap-[6px] w-full ${collapsed ? 'items-center' : ''}`}>
          {STUDENT_MENU.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <SidebarDivider />

      <div className={`flex flex-col gap-[12px] w-full shrink-0 ${collapsed ? 'items-center' : 'items-start'}`}>
        {STUDENT_COMMUNITY.map(item => (
          <SidebarNavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            collapsed={collapsed}
          />
        ))}
      </div>

      <SidebarDivider />

      <div className={`flex flex-col w-full px-[6px] shrink-0 ${collapsed ? 'items-center' : 'items-start'}`}>
        <div className={`flex flex-col gap-[6px] w-full ${collapsed ? 'items-center' : ''}`}>
          {ACCOUNT_ITEMS.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full" />
      <ProfileCard user={user} collapsed={collapsed} />
    </div>
  );
};

// ── SidebarTeacher ────────────────────────────────────────────────────────────

export const SidebarTeacher = ({
  state = 'expanded',
  activeItem = 'overview',
  user = { name: 'Pham Minh', role: 'Teacher', initials: 'PM' },
  onCollapse,
  className = '',
}: SidebarTeacherProps) => {
  const collapsed = state === 'collapsed';

  return (
    <div
      className={[
        'flex flex-col gap-[12px] items-center bg-white',
        collapsed ? 'px-[14px] w-[76px]' : 'px-[16px] w-[250px]',
        'py-[22px] h-[900px] shrink-0',
        className,
      ].join(' ')}
    >
      <SidebarLogo collapsed={collapsed} onCollapse={onCollapse} />
      <SidebarDivider />

      <div className={`flex flex-col w-full px-[6px] shrink-0 ${collapsed ? 'items-center' : 'items-start'}`}>
        <div className={`flex flex-col gap-[6px] w-full ${collapsed ? 'items-center' : ''}`}>
          {TEACHER_MENU.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <SidebarDivider />

      <div className={`flex flex-col w-full px-[6px] shrink-0 ${collapsed ? 'items-center' : 'items-start'}`}>
        <div className={`flex flex-col gap-[6px] w-full ${collapsed ? 'items-center' : ''}`}>
          {ACCOUNT_ITEMS.map(item => (
            <SidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full" />
      <ProfileCard user={user} collapsed={collapsed} />
    </div>
  );
};

// ── SidebarTopActions ─────────────────────────────────────────────────────────

export const SidebarTopActions = ({
  userInitials = 'NM',
  avatarColor,
  onSearch,
  onNotifications,
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
    <div
      className="flex items-center justify-center w-[46px] h-[46px] rounded-full shrink-0 text-white text-[14px] font-bold font-inter"
      style={{ background: avatarColor ?? 'var(--color-accent-blue)' }}
    >
      {userInitials}
    </div>

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
