import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  SidebarStudent,
  SidebarTeacher,
  SidebarTopActions,
  type SidebarNavEntry,
} from "@/shared/ui/ds/organisms/sidebar";
import { Footer } from "@/shared/ui/ds/organisms/footer";
import { Button } from "@/shared/ui/ds/atoms/button";
import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { FOOTER_COLUMNS } from "../footer-columns";
import { createClient } from "~supabase/client";

/**
 * AppShell — logged-in app layout (Figma "Student Dashboard" shell).
 *
 * Left sidebar (SidebarStudent) + main column (sticky Top Actions bar + page
 * content + dark Footer) on the Surface/App background (#f6f7f4). Reads the
 * signed-in viewer via useAuth and the active nav item from the route.
 *
 * Pages opt in with `Page.Layout = AppShell`.
 */

// Nav groups — hrefs only where a real route exists; others are visual-only (#)
// pending dedicated routes (Study Plan / My Progress / Vocabulary / Community /
// Settings / Help & Support). See ui-rebuild-status memory.
const STUDENT_MENU: SidebarNavEntry[] = [
  { id: "home", icon: "House", label: "Home", href: ROUTES.HOME },
  { id: "dashboard", icon: "SquaresFour", label: "Dashboard", href: ROUTES.ACCOUNT.DASHBOARD },
  { id: "mock-tests", icon: "Exam", label: "Mock Tests", href: ROUTES.EXAM.ARCHIVE },
  { id: "study-plan", icon: "Calendar", label: "Study Plan", href: ROUTES.STUDY_PLAN },
  { id: "progress", icon: "Trophy", label: "My Progress", href: ROUTES.MY_PROGRESS },
  { id: "vocabulary", icon: "BookOpenText", label: "Vocabulary", href: ROUTES.VOCABULARY },
  { id: "my-classes", icon: "Chalkboard", label: "My Classes", href: ROUTES.CLASSROOM.LIST },
  { id: "assignments", icon: "ClipboardText", label: "My Assignments", href: ROUTES.CLASSROOM.MY_ASSIGNMENTS },
  { id: "subscription", icon: "CreditCard", label: "Subscription", href: ROUTES.SUBSCRIPTION },
];

const STUDENT_COMMUNITY: SidebarNavEntry[] = [
  // { id: "community", icon: "UsersThree", label: "Community", href: ROUTES.COMMUNITY },
  { id: "blog", icon: "Book", label: "Blog", href: ROUTES.BLOG.ARCHIVE },
];

const STUDENT_ACCOUNT: SidebarNavEntry[] = [
  { id: "settings", icon: "Gear", label: "Settings", href: ROUTES.ACCOUNT.SETTINGS },
  { id: "help", icon: "Question", label: "Help & Support", href: ROUTES.HELP },
];

// ── Teacher nav (Figma node 3689-174) ──────────────────────────────────────
// Overview · My Classes · Assignments · Students · Collaborators, then the
// shared Settings / Help account group. Items without a dedicated route yet are
// visual-only (#) — pending pages.
const TEACHER_MENU: SidebarNavEntry[] = [
  { id: "overview", icon: "House", label: "Overview", href: ROUTES.CLASSROOM.OVERVIEW },
  { id: "my-classes", icon: "Chalkboard", label: "My Classes", href: ROUTES.CLASSROOM.LIST },
  { id: "assignments", icon: "ClipboardText", label: "Assignments", href: "#" },
  { id: "students", icon: "Student", label: "Students", href: ROUTES.CLASSROOM.STUDENTS },
  { id: "collaborators", icon: "UsersThree", label: "Collaborators", href: ROUTES.CLASSROOM.COLLABORATORS },
];

const TEACHER_ACCOUNT: SidebarNavEntry[] = [
  { id: "settings", icon: "Gear", label: "Settings", href: ROUTES.ACCOUNT.SETTINGS },
  { id: "help", icon: "Question", label: "Help & Support", href: ROUTES.HELP },
];

const activeFromPath = (pathname: string): string => {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/account/dashboard")) return "dashboard";
  if (pathname.startsWith("/classroom/my-assignments")) return "assignments";
  if (pathname.startsWith(ROUTES.STUDY_PLAN)) return "study-plan";
  if (pathname.startsWith(ROUTES.MY_PROGRESS)) return "progress";
  if (pathname.startsWith(ROUTES.VOCABULARY)) return "vocabulary";
  if (pathname.startsWith(ROUTES.COMMUNITY)) return "community";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith(ROUTES.ACCOUNT.SETTINGS)) return "settings";
  if (pathname.startsWith(ROUTES.HELP)) return "help";
  if (pathname.startsWith(ROUTES.SUBSCRIPTION)) return "subscription";
  if (pathname.startsWith("/classroom")) return "my-classes";
  if (
    pathname.startsWith("/ielts-exam-library") ||
    pathname.startsWith("/take-the-test") ||
    pathname.startsWith("/test-result")
  )
    return "mock-tests";
  return "";
};

// Teacher sidebar active-item resolution (distinct routes from student nav).
const teacherActiveFromPath = (pathname: string): string => {
  if (pathname.startsWith(ROUTES.CLASSROOM.OVERVIEW)) return "overview";
  if (pathname.startsWith(ROUTES.CLASSROOM.STUDENTS)) return "students";
  if (pathname.startsWith(ROUTES.CLASSROOM.COLLABORATORS)) return "collaborators";
  if (pathname.startsWith(ROUTES.ACCOUNT.SETTINGS)) return "settings";
  if (pathname.startsWith(ROUTES.HELP)) return "help";
  if (pathname.startsWith("/classroom")) return "my-classes";
  return "";
};

const APP_SIDEBAR_COLLAPSED_KEY = "app-sidebar-collapsed";

const initialsFromName = (name?: string | null): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { currentUser, isSignedIn, isTeacher, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedCollapsed = window.localStorage.getItem(APP_SIDEBAR_COLLAPSED_KEY);
    if (savedCollapsed === "true") setCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(APP_SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close the mobile nav drawer whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.asPath]);

  // While the drawer is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const [targetBand, setTargetBand] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setTargetBand(null);
      return;
    }
    const fetchTargetBand = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("users")
          .select("target_score")
          .eq("id", currentUser.id)
          .single();

        if (data?.target_score) {
          let ts = data.target_score as any;
          if (typeof ts === "string") {
            try {
              ts = JSON.parse(ts);
            } catch (e) {
              ts = {};
            }
          }
          ts = ts || {};
          const tb = ts.reading ?? ts.listening ?? ts.speaking ?? ts.writing;
          if (tb != null) {
            setTargetBand(Number(tb));
          }
        }
      } catch (err) {
        console.error("Error fetching target band for sidebar:", err);
      }
    };
    fetchTargetBand();
  }, [currentUser?.id]);

  const name = currentUser?.name ?? (isTeacher ? "Teacher" : "Student");
  const initials = initialsFromName(currentUser?.name);
  const avatarSrc = currentUser?.userData?.avatar?.node?.mediaDetails?.sizes?.[0]?.sourceUrl ?? undefined;
  const isPro = currentUser?.userData?.isPro ?? false;
  const studentRole = targetBand ? `Target: Band ${targetBand}` : "Student";

  // Renders the role-appropriate sidebar. The desktop variant is the fixed
  // left rail (≥lg); the mobile variant is rendered inside the slide-in drawer
  // (always expanded, scrollable, closes the drawer via onCollapse).
  const renderSidebar = (variant: "desktop" | "mobile") => {
    const isMobile = variant === "mobile";
    const shared = {
      state: (isMobile ? "expanded" : collapsed ? "collapsed" : "expanded") as
        | "expanded"
        | "collapsed",
      onCollapse: isMobile ? closeMobileMenu : toggleSidebar,
      profileHref: ROUTES.ACCOUNT.MY_PROFILE,
      onLogout: signOut,
      isSignedIn,
      loginHref: ROUTES.LOGIN(),
      registerHref: ROUTES.REGISTER,
      className: isMobile
        ? "flex h-full overflow-y-auto"
        : "hidden lg:flex sticky top-0 h-dvh self-start",
    };
    return isTeacher ? (
      <SidebarTeacher
        {...shared}
        activeItem={teacherActiveFromPath(router.pathname)}
        user={{ name, role: "Teacher", initials, avatarSrc, isPro }}
        menu={TEACHER_MENU}
        account={TEACHER_ACCOUNT}
      />
    ) : (
      <SidebarStudent
        {...shared}
        activeItem={activeFromPath(router.pathname)}
        user={{ name, role: studentRole, initials, avatarSrc, isPro }}
        menu={STUDENT_MENU}
        community={STUDENT_COMMUNITY}
        account={STUDENT_ACCOUNT}
      />
    );
  };

  return (
    <div className="flex min-h-dvh bg-[var(--color-surface-app)]">
      {renderSidebar("desktop")}

      {/* Mobile nav drawer (≪lg) — opened from the header hamburger. */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${mobileMenuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          onClick={closeMobileMenu}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute left-0 top-0 h-full shadow-[0_0_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {renderSidebar("mobile")}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-[var(--color-surface-app)] flex items-center gap-4 px-6 lg:px-10 pt-6 pb-2 shrink-0">
          {/* Mobile (≪lg): small logo on the left, hamburger on the right. */}
          <div className="flex lg:hidden items-center justify-between w-full">
            <Link href={ROUTES.HOME} aria-label="VitIELTS home" className="flex items-center">
              <img src="/assets/logos/logo-on-bright.svg" alt="VitIELTS" className="h-[28px] w-auto" />
            </Link>
            <button
              type="button"
              onClick={openMobileMenu}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white border border-[rgba(25,29,36,0.1)] shrink-0 cursor-pointer hover:bg-[var(--color-brand-tint)] transition-colors"
            >
              <span className="material-symbols-rounded text-[24px] leading-none text-[var(--color-ink-900)]">menu</span>
            </button>
          </div>

          {/* Desktop (≥lg): search / profile / notifications, or auth buttons. */}
          <div className="hidden lg:flex items-center justify-end gap-4 w-full">
            {isSignedIn && (
              <SidebarTopActions
                userInitials={initials}
                avatarSrc={avatarSrc}
                profileHref={ROUTES.ACCOUNT.MY_PROFILE}
              />
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0 px-6 lg:px-10 pb-12">
          <div className="w-full">{children}</div>
        </main>

        <Footer columns={FOOTER_COLUMNS} showCopyright />
      </div>
    </div>
  );
};
