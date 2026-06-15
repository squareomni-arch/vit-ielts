import Image from "next/image";
import Link from "next/link";
import { Container } from "@/shared/ui";
import { HeaderNavMain } from "./ui/header-nav-main";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Menu, Dropdown, Divider } from "antd";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import { Avatar } from "@/entities";
import { MasterData, MenuItem, useAppContext, useAuth } from "@/appx/providers";
import { ItemType } from "antd/es/menu/interface";
import _ from "lodash";
import { Header as DSHeader, type HeaderNavItem } from "@/shared/ui/ds";
import { AnnouncementBar } from "./announcement-bar";

/**
 * Mapping from menu item labels to correct Next.js routes.
 * The Supabase `menus` table has empty URIs after migration from WordPress.
 */
const MENU_LABEL_TO_ROUTE: Record<string, string> = {
  "home": ROUTES.HOME,
  "ielts online test": ROUTES.EXAM.ARCHIVE,
  "ielts full test": ROUTES.EXAM.ARCHIVE,
  "ielts reading practice": ROUTES.PRACTICE.ARCHIVE_READING,
  "ielts listening practice": ROUTES.PRACTICE.ARCHIVE_LISTENING,
  "ielts sample": ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING,
  "ielts writing sample": ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING,
  "ielts speaking sample": ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING,
  "ielts reading sample": ROUTES.SAMPLE_ESSAY.ARCHIVE_READING,
  "ielts listening sample": ROUTES.SAMPLE_ESSAY.ARCHIVE_LISTENING,
  "subscription": ROUTES.SUBSCRIPTION,
  "contact": "/contact",
};

function resolveMenuUri(item: MenuItem): string {
  if (item.uri && item.uri !== "#" && item.uri !== "/#" && !item.uri.startsWith("http")) {
    return item.uri;
  }
  const label = typeof item.label === "string" ? item.label.toLowerCase().trim() : "";
  return MENU_LABEL_TO_ROUTE[label] || item.uri || "#";
}

function createModifiedMenuData(
  menu: MasterData["menuData"][string] | undefined,
  modifyFn: (
    item: MasterData["menuData"][string][number]
  ) => string | React.ReactNode
): ItemType[] | undefined {
  if (!menu) return undefined;
  return menu.map((item, index) => {
    const resolved = { ...item, uri: resolveMenuUri(item) };
    const itemKey = (resolved.key ?? resolved.uri ?? `menu-${index}`).toString();
    if (resolved.children && resolved.children.length) {
      return {
        key: itemKey,
        label: modifyFn(resolved),
        children: createModifiedMenuData(resolved.children, modifyFn),
      };
    }
    return {
      key: itemKey,
      label: modifyFn(resolved),
    };
  });
}

export const Header = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm"));

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm"));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const { isSignedIn, signOut, currentUser } = useAuth();
  const { masterData } = useAppContext();
  // Only show the Blog menu when there's at least one published Blog post.
  const hasBlogPosts = Boolean(masterData?.hasBlogPosts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    websiteOptions: {
      websiteOptionsFields: {
        generalSettings: { facebook, phoneNumber, logo, zalo, email },
      },
    },
    allSettings: { generalSettingsTitle },
  } = masterData;

  const menuDataMapped = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const menuData = masterData.menuData;

    const cmsMenuItems = createModifiedMenuData(menuData["main-menu"], (item) => (
      <Link href={item.uri || "#"}>{item.label}</Link>
    ))!;

    // Add Blog + subscription links to the menu
    const blogMenuItem = {
      key: "blog",
      label: <Link href={ROUTES.BLOG.ARCHIVE}>Blog</Link>,
    };
    const subscriptionMenuItem = {
      key: "subscription",
      label: <Link href={ROUTES.SUBSCRIPTION}>Subscription</Link>,
    };

    const menu = [
      ...cmsMenuItems,
      ...(hasBlogPosts ? [blogMenuItem] : []),
      subscriptionMenuItem,
    ];

    if (isSignedIn) {
      menu.push(
        { type: "divider" },
        {
          key: "1",
          label: <Link href={ROUTES.ACCOUNT.DASHBOARD}>My Dashboard</Link>,
        },
        {
          key: "2",
          label: <Link href={ROUTES.ACCOUNT.MY_PROFILE}>My Profile</Link>,
        },
        {
          key: "3",
          label: <Link href={ROUTES.ACCOUNT.ORDER_HISTORY}>Order History</Link>,
        },
        {
          key: "affiliate",
          label: <Link href={ROUTES.ACCOUNT.AFFILIATE}>Affiliate</Link>,
        },
        ...(currentUser?.roles?.nodes?.[0]?.name === "administrator"
          ? [
            { type: "divider" as const },
            {
              key: "4",
              label: (
                <Link href={ROUTES.ADMIN.DASHBOARD}>Admin Dashboard</Link>
              ),
              icon: (
                <i className="material-symbols-rounded">
                  home
                </i>
              ),
            },
          ]
          : []),
        { type: "divider" },
        {
          key: "5",
          label: "Logout",
          onClick: signOut,
          icon: <i className="material-symbols-rounded">logout</i>,
          danger: true,
        }
      );
    } else {
      menu.push(
        { type: "divider" },
        {
          key: "6",
          label: <Link href={ROUTES.LOGIN(router.asPath)}>Login</Link>,
        },
        {
          key: "7",
          label: <Link href={ROUTES.REGISTER}>Sign Up</Link>,
        }
      );
    }

    return menu;
  }, [
    currentUser?.roles.nodes,
    isSignedIn,
    masterData.menuData,
    router.asPath,
    signOut,
    hasBlogPosts,
  ]);

  useEffect(() => {
    const flattenMenuData = (menuData: MasterData["menuData"]) => {
      return _.flatMapDeep(Object.values(menuData), (menuItems) => {
        const flattenItems = (items: MenuItem[]): MenuItem[] => {
          return _.flatMapDeep(items, (item: MenuItem) => {
            return [
              item,
              ...(item.children ? flattenItems(item.children) : []),
            ];
          });
        };
        return flattenItems(menuItems);
      });
    };

    const flattened = flattenMenuData(masterData.menuData);

    const item = flattened.find((item) => {
      try {
        const itemUrl = new URL(item.uri, window.location.origin);
        return itemUrl.pathname === router.pathname;
      } catch {
        return false;
      }
    });

    if (item) {
      setActiveKey((item.key ?? item.uri ?? "").toString());
    }
  }, [masterData.menuData, router.pathname]);

  const dsNavItems: HeaderNavItem[] = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const cmsItems = masterData.menuData["main-menu"]
      .map((item) => {
        const resolvedHref = resolveMenuUri(item);
        const isSubUrl = (uri: string) => {
          try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
            const itemUrl = new URL(uri, baseUrl);
            return itemUrl.pathname === router.pathname;
          } catch { return false; }
        }
        return {
          label: (item.label || "").toString(),
          href: resolvedHref,
          active: activeKey === (item.key ?? resolvedHref ?? "").toString() || isSubUrl(resolvedHref),
          children: item.children?.map(child => ({
            label: (child.label || "").toString(),
            href: resolveMenuUri(child)
          }))
        };
      })
      .filter((item) => {
        const labelLower = item.label.toLowerCase();
        const hrefLower = item.href.toLowerCase();
        return (
          !labelLower.includes("writing") &&
          !labelLower.includes("speaking") &&
          !labelLower.includes("sample") &&
          !labelLower.includes("prediction") &&
          !hrefLower.includes("writing") &&
          !hrefLower.includes("speaking") &&
          !hrefLower.includes("sample") &&
          !hrefLower.includes("prediction")
        );
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) => {
              const childLabelLower = child.label.toLowerCase();
              const childHrefLower = child.href.toLowerCase();
              return (
                !childLabelLower.includes("writing") &&
                !childLabelLower.includes("speaking") &&
                !childLabelLower.includes("sample") &&
                !childLabelLower.includes("prediction") &&
                !childHrefLower.includes("writing") &&
                !childHrefLower.includes("speaking") &&
                !childHrefLower.includes("sample") &&
                !childHrefLower.includes("prediction")
              );
            }),
          };
        }
        return item;
      });
    return [
      ...cmsItems,
      ...(hasBlogPosts ? [{ label: "Blog", href: ROUTES.BLOG.ARCHIVE }] : []),
      { label: "Subscription", href: ROUTES.SUBSCRIPTION },
    ];
  }, [masterData.menuData, activeKey, router.pathname, hasBlogPosts]);

  return (
    <>
      {/* === SECTION: Announcement Bar (red scrolling ticker) — hidden === */}
      {/* <AnnouncementBar /> */}

      {/* === SECTION: Header Navigation === */}
      <DSHeader
        logoSrc={"/assets/logos/logo-on-bright.svg"}
        logoAlt={generalSettingsTitle || "VitIELTS"}
        navItems={dsNavItems}
        userMenuItems={[
          {
            label: "My Dashboard",
            href: ROUTES.ACCOUNT.DASHBOARD,
          },
          {
            label: "My Profile",
            href: ROUTES.ACCOUNT.MY_PROFILE,
          },
          {
            label: "Order History",
            href: ROUTES.ACCOUNT.ORDER_HISTORY,
          },
          {
            label: "Affiliate",
            href: ROUTES.ACCOUNT.AFFILIATE,
          },
          ...(currentUser?.roles?.nodes?.[0]?.name === "administrator"
            ? [
                { divider: true },
                {
                  label: "Admin Dashboard",
                  href: ROUTES.ADMIN.DASHBOARD,
                  icon: <i className="material-symbols-rounded">home</i>,
                },
              ]
            : []),
          { divider: true },
          {
            label: "Logout",
            onClick: signOut,
            icon: <i className="material-symbols-rounded">logout</i>,
            danger: true,
          },
        ]}
        isAuthenticated={mounted && isSignedIn}
        authLoading={!mounted}
        userName={currentUser?.name || "User"}
        userAvatar={(currentUser?.userData?.avatar?.node as any)?.srcSet}
        isPro={currentUser?.userData?.isPro}
        onLogin={() => router.push(ROUTES.LOGIN(router.asPath))}
        onSignup={() => router.push(ROUTES.REGISTER)}
        onLogout={signOut}
        onLogoClick={() => router.push(ROUTES.HOME)}
      />
    </>
  );
};
