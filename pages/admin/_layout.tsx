import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createAdminClient } from "~supabase/admin-client";
import { ROUTES } from "@/shared/routes";
import {
  DashboardOutlined,
  UserOutlined,
  FormOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  TeamOutlined,
  SettingOutlined,
  BookOutlined,
  FileSearchOutlined,
  MenuOutlined,
  GlobalOutlined,
  DollarOutlined,
  LogoutOutlined,
  BarChartOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  HistoryOutlined,
  PictureOutlined,
  CreditCardOutlined,
  ContactsOutlined,
} from "@ant-design/icons";
import { message, Tooltip, Badge, ConfigProvider, theme as antdTheme } from "antd";
import { useAdminPermissions } from "@/shared/hooks";
// ═══ Types ═══
type MenuItemDef = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: { key: string; label: string; icon?: React.ReactNode; inactive?: boolean }[];
};

type MenuSection = {
  title: string;
  items: MenuItemDef[];
};

// ═══ Menu Config ═══
const MENU_SECTIONS: MenuSection[] = [
  {
    title: "QUẢN LÝ",
    items: [
      { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
      { key: "/admin/users", icon: <UserOutlined />, label: "Users" },
      {
        key: "quizzes-group", icon: <FormOutlined />, label: "Quizzes",
        children: [
          { key: "/admin/quizzes", label: "Danh sách" },
          { key: "/admin/quizzes/new", label: "Thêm mới" },
        ],
      },
      {
        key: "exam-library-group", icon: <BookOutlined />, label: "Exam Library",
        children: [
          { key: "/admin/mock-test-collections", label: "Tổng quan" },
          { key: "/admin/mock-tests", label: "Quản lý Mock Test" },
          { key: "/admin/mock-tests/new", label: "Thêm Mock Test" },
          { key: "/admin/mock-test-collections/new", label: "Thêm Collection" },
        ],
      },
      { key: "/admin/test-results", icon: <BarChartOutlined />, label: "Test Results" },
      {
        key: "classroom-group", icon: <TeamOutlined />, label: "Lớp học",
        children: [
          { key: "/admin/classrooms", label: "Danh sách lớp" },
          { key: "/admin/teachers", label: "Giáo viên" },
          { key: "/admin/students", label: "Học viên" },
        ],
      },
      { key: "/admin/orders", icon: <ShoppingCartOutlined />, label: "Orders" },
      { key: "/admin/leads", icon: <ContactsOutlined />, label: "Leads (Landing)" },
      { key: "/admin/coupons", icon: <TagOutlined />, label: "Coupons" },
      {
        key: "cms-subscription",
        icon: <CreditCardOutlined />,
        label: "Subscription",
        children: [
          { key: "/admin/subscription/course-packages", label: "Cấu hình gói học" },
          { key: "/admin/subscription/banner", label: "Cấu hình Banner" },
          { key: "/admin/subscription/faq", label: "Cấu hình FAQ" },
          { key: "/admin/subscription/coupons", label: "Mã giảm giá (Legacy)" },
        ],
      },
      { key: "/admin/posts", icon: <EditOutlined />, label: "Blog Posts" },
      { key: "/admin/sample-essays", icon: <FileSearchOutlined />, label: "Sample Essays" },
      {
        key: "affiliate-group", icon: <TeamOutlined />, label: "Affiliate",
        children: [
          { key: "/admin/affiliate", icon: <DashboardOutlined />, label: "Tổng quan" },
          { key: "/admin/affiliate/users", icon: <UserOutlined />, label: "Quản lý users" },
          { key: "/admin/affiliate/payouts", icon: <DollarOutlined />, label: "Payouts" },
          { key: "/admin/affiliate/config", icon: <SettingOutlined />, label: "Cấu hình" },
        ],
      },
      { key: "/admin/media", icon: <PictureOutlined />, label: "Media Library" },
      { key: "/admin/activity-log", icon: <HistoryOutlined />, label: "Activity Log" },
      { key: "/admin/seo", icon: <GlobalOutlined />, label: "SEO Manager" },
      { key: "/admin/settings", icon: <SettingOutlined />, label: "Settings" },
    ],
  },
];

// ═══ Breadcrumb Map ═══
const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/quizzes": "Quizzes",
  "/admin/quizzes/new": "Thêm mới",
  "/admin/mock-test-collections": "Exam Library",
  "/admin/mock-test-collections/new": "Thêm Collection",
  "/admin/mock-tests": "Quản lý Mock Test",
  "/admin/mock-tests/new": "Thêm Mock Test",
  "/admin/test-results": "Test Results",
  "/admin/classrooms": "Lớp học",
  "/admin/teachers": "Giáo viên",
  "/admin/students": "Học viên",
  "/admin/orders": "Orders",
  "/admin/leads": "Leads (Landing)",
  "/admin/coupons": "Coupons",
  "/admin/posts": "Blog Posts",
  "/admin/sample-essays": "Sample Essays",
  "/admin/settings": "Settings",
  "/admin/affiliate": "Affiliate",
  "/admin/affiliate/users": "Quản lý Users",
  "/admin/affiliate/payouts": "Payouts",
  "/admin/affiliate/config": "Cấu hình",
  "/admin/activity-log": "Activity Log",
  "/admin/seo": "SEO Manager",
  "/admin/media": "Media Library",
  "/admin/email-template": "Email Template",
  "/admin/contact": "Contact Config",
  "/admin/footer/contact-icons": "Contact Icons",
  "/admin/subscription/course-packages": "Cấu hình gói học",
  "/admin/subscription/banner": "Cấu hình Banner",
  "/admin/subscription/faq": "Cấu hình FAQ",
  "/admin/subscription/coupons": "Mã giảm giá (Legacy)",
};

// ═══ Helper: resolve breadcrumbs ═══
function getBreadcrumbs(path: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Admin", href: "/admin" },
  ];
  if (path === "/admin") return crumbs;

  const mapped = BREADCRUMB_MAP[path];
  if (mapped) {
    crumbs.push({ label: mapped });
    return crumbs;
  }

  // Build from path segments
  const segments = path.replace("/admin/", "").split("/");
  let built = "/admin";
  for (const seg of segments) {
    built += `/${seg}`;
    const label =
      BREADCRUMB_MAP[built] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({
      label,
      href: built === path ? undefined : built,
    });
  }
  return crumbs;
}

// ═══ Check if menu item is active ═══
// Extract all keys from MENU_SECTIONS to compute the "best match"
const ALL_MENU_KEYS = MENU_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) =>
    item.children ? item.children.map((c) => c.key) : [item.key]
  )
).filter((key) => key.startsWith("/"));

function getBestMatch(currentPath: string): string | null {
  const path = currentPath.split("?")[0].split("#")[0];
  let bestMatch: string | null = null;
  let maxLen = 0;
  for (const key of ALL_MENU_KEYS) {
    if (path === key || path.startsWith(key + "/")) {
      if (key.length > maxLen) {
        maxLen = key.length;
        bestMatch = key;
      }
    }
  }
  return bestMatch;
}

function isItemActive(key: string, currentPath: string): boolean {
  if (key === "/admin") return currentPath.split("?")[0] === "/admin";
  
  // If key has query params, do strict match
  if (key.includes("?")) {
    return currentPath === key;
  }

  const path = currentPath.split("?")[0].split("#")[0];
  return key === getBestMatch(path);
}

// ═══ Layout Component ═══
interface AdminLayoutProps {
  children: React.ReactNode;
}

/** Menu keys hidden from editor accounts (revenue + payment config) */
const EDITOR_HIDDEN_KEYS = new Set<string>([
  "/admin/orders",
  "/admin/coupons",
  "affiliate-group",
  "cms-subscription",
]);

function filterMenuForRole(sections: MenuSection[], canSeeAll: boolean): MenuSection[] {
  if (canSeeAll) return sections;
  return sections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !EDITOR_HIDDEN_KEYS.has(item.key)),
  })).filter((section) => section.items.length > 0);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  // The CMS is served under a secret prefix (ROUTES.ADMIN.BASE) via a
  // next.config rewrite, so router.asPath shows that prefix while all menu
  // keys / breadcrumbs are authored as "/admin/*". Normalize back to /admin
  // for matching. (Internal <Link>s keep using /admin and work because the
  // admin is authenticated.)
  const adminAsPath = router.asPath.startsWith(ROUTES.ADMIN.BASE)
    ? "/admin" + router.asPath.slice(ROUTES.ADMIN.BASE.length)
    : router.asPath;
  const { isFullAdmin: canSeeAll } = useAdminPermissions();
  const visibleSections = useMemo(
    () => filterMenuForRole(MENU_SECTIONS, canSeeAll),
    [canSeeAll]
  );
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/admin/notifications?limit=1");
        const json = await res.json();
        if (json.success) setUnreadNotifications(json.unreadCount ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-admin-theme", saved);
    } else {
      document.documentElement.setAttribute("data-admin-theme", "dark");
    }
    const savedCollapsed = localStorage.getItem("admin-sidebar-collapsed");
    if (savedCollapsed === "true") setCollapsed(true);
  }, []);

  // Auto-open submenu based on current path
  useEffect(() => {
    const path = adminAsPath;
    for (const section of MENU_SECTIONS) {
      for (const item of section.items) {
        if (item.children) {
          for (const child of item.children) {
            if (isItemActive(child.key, path)) {
              setOpenSubmenus((prev) => new Set(prev).add(item.key));
            }
          }
        }
      }
    }
  }, [adminAsPath]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-admin-theme", next);
      localStorage.setItem("admin-theme", next);
      return next;
    });
  }, []);

  const toggleSubmenu = useCallback((key: string) => {
    setOpenSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);



  const handleLogout = useCallback(async () => {
    const supabase = createAdminClient();
    await supabase.auth.signOut();
    message.success("Đã đăng xuất");
    window.location.href = ROUTES.ADMIN.LOGIN;
  }, []);

  const breadcrumbs = useMemo(() => getBreadcrumbs(adminAsPath), [adminAsPath]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: theme === "dark"
          ? {
              colorPrimary: "#9AD534",
              colorText: "#e5e7eb",
              colorTextPlaceholder: "#9ca3af",
              colorBgContainer: "#1a1b23",
              colorBorder: "rgba(255,255,255,0.1)",
            }
          : {
              colorPrimary: "#9AD534",
              colorText: "#1a1b2e",
              colorTextPlaceholder: "#94a3b8",
              colorBgContainer: "#ffffff",
              colorBorder: "rgba(0,0,0,0.12)",
            },
      }}
    >
      <div className="admin-shell" data-admin-theme={theme}>
        {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay ${mobileOpen ? "visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ═══ Sidebar ═══ */}
      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Logo */}
        <div className="admin-sidebar-logo">
          {collapsed ? (
            <img
              src="/assets/logos/Logo.svg"
              alt="VIT IELTS"
              style={{ height: 36, width: 36, objectFit: "contain" }}
            />
          ) : (
            <img
              src={
                theme === "dark"
                  ? "/assets/logos/logo-on-dark.svg"
                  : "/assets/logos/logo-on-bright.svg"
              }
              alt="VIT IELTS"
              style={{ height: 36, width: "auto", objectFit: "contain", maxWidth: 160 }}
            />
          )}
        </div>

        {/* Menu */}
        <nav className="admin-sidebar-menu">
          {visibleSections.map((section, sIdx) => (
            <div key={section.title}>
              {sIdx > 0 && <div className="admin-menu-divider" />}
              <div className="admin-menu-section">{section.title}</div>

              {section.items.map((item) => {
                if (item.children) {
                  const isOpen = openSubmenus.has(item.key);
                  const hasActive = item.children.some((c) =>
                    isItemActive(c.key, adminAsPath)
                  );

                  return (
                    <div key={item.key}>
                      {collapsed ? (
                        <Tooltip title={item.label} placement="right">
                          <Link
                            href={item.children?.[0]?.key || "#"}
                            className={`admin-submenu-trigger ${hasActive ? "open" : ""}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span className="admin-menu-item-icon">{item.icon}</span>
                          </Link>
                        </Tooltip>
                      ) : (
                        <>
                          <button
                            className={`admin-submenu-trigger ${isOpen ? "open" : ""}`}
                            onClick={() => toggleSubmenu(item.key)}
                          >
                            <span className="admin-menu-item-icon">{item.icon}</span>
                            <span className="admin-menu-item-label">{item.label}</span>
                            <span className="admin-submenu-arrow">▾</span>
                          </button>
                          <div className={`admin-submenu-list ${isOpen ? "open" : ""}`}>
                            {item.children.map((child) => (
                              <Link
                                key={child.key}
                                href={child.key}
                                className={`admin-menu-item ${
                                  isItemActive(child.key, adminAsPath) ? "active" : ""
                                }`}
                                onClick={() => setMobileOpen(false)}
                                style={child.inactive ? { opacity: 0.55 } : undefined}
                                title={child.inactive ? "Không hiển thị trên giao diện mới" : undefined}
                              >
                                {child.icon && <span className="admin-menu-item-icon" style={{ fontSize: 14 }}>{child.icon}</span>}
                                <span className="admin-menu-item-label">{child.label}</span>
                                {child.inactive && (
                                  <span
                                    style={{
                                      marginLeft: "auto",
                                      fontSize: 10,
                                      opacity: 0.8,
                                      border: "1px solid currentColor",
                                      borderRadius: 4,
                                      padding: "0 4px",
                                      lineHeight: "14px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    ẩn
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                const isActive = isItemActive(item.key, adminAsPath);

                if (collapsed) {
                  return (
                    <Tooltip key={item.key} title={item.label} placement="right">
                      <Link
                        href={item.key}
                        className={`admin-menu-item ${isActive ? "active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="admin-menu-item-icon">{item.icon}</span>
                      </Link>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.key}
                    className={`admin-menu-item ${isActive ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="admin-menu-item-icon">{item.icon}</span>
                    <span className="admin-menu-item-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Logout */}
          <div className="admin-menu-divider" />
          {collapsed ? (
            <Tooltip title="Đăng xuất" placement="right">
              <button className="admin-logout-btn" onClick={handleLogout}>
                <LogoutOutlined />
              </button>
            </Tooltip>
          ) : (
            <button className="admin-logout-btn" onClick={handleLogout}>
              <LogoutOutlined />
              <span>Đăng xuất</span>
            </button>
          )}
        </nav>

        {/* Collapse Button */}
        <button className="admin-sidebar-collapse-btn" onClick={toggleCollapse}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </aside>

      {/* ═══ Main ═══ */}
      <div className={`admin-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            {/* Mobile menu toggle */}
            <button
              className="admin-header-action"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: "none" }}
              id="admin-mobile-menu-btn"
            >
              <MenuOutlined />
            </button>

            {/* Breadcrumb */}
            <nav className="admin-breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <span className="admin-breadcrumb-sep">›</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(crumb.href!);
                      }}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="admin-breadcrumb-current">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="admin-header-right">
            {/* Theme toggle */}
            <Tooltip title={theme === "dark" ? "Light mode" : "Dark mode"}>
              <button className="admin-theme-toggle" onClick={toggleTheme}>
                {theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            {/* Notifications */}
            <button
              className="admin-header-action"
              onClick={() => router.push("/admin/activity-log")}
            >
              <Badge count={unreadNotifications} size="small" offset={[2, -2]}>
                <BellOutlined style={{ fontSize: 18, color: "var(--admin-text-secondary)" }} />
              </Badge>
            </button>

            {/* Admin avatar */}
            <div className="admin-header-avatar">
              <div className="admin-header-avatar-fallback">A</div>
              <div className="admin-header-avatar-info">
                <span className="admin-header-avatar-name">Admin</span>
                <span className="admin-header-avatar-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content admin-animate-in">{children}</div>
      </div>

      {/* Mobile responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          #admin-mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
    </ConfigProvider>
  );
}
