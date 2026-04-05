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
import { FacebookRoundedIcon, ZaloIcon } from "@/shared/ui/icons";
import type { TopBarConfig } from "./types";

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
  "ielts prediction": "/ielts-prediction",
  "subscription": ROUTES.SUBSCRIPTION,
  "contact": "/contact",
  "about us": ROUTES.ABOUT_US,
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
  const [topBarConfig, setTopBarConfig] = useState<TopBarConfig | null>(null);
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

  // Fetch Top Bar config on mount
  useEffect(() => {
    const fetchTopBarConfig = async () => {
      try {
        const res = await fetch("/api/admin/header/top-bar");
        if (res.ok) {
          const data = await res.json();
          setTopBarConfig(data);
        }
      } catch {
        // Use default config if fetch fails
        setTopBarConfig({
          facebookFollowers: "500k Followers",
          phoneNumber: "",
          promotionalBanner: {
            buttonText: "Hot",
            emoji: "👋",
            text: "Intro price. Get {siteName} for Big Sale -95% off.",
          },
          socialLinks: {
            enabled: true,
            customLinks: [],
          },
        });
      }
    };
    fetchTopBarConfig();
  }, []);

  const menuDataMapped = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const menuData = masterData.menuData;

    const cmsMenuItems = createModifiedMenuData(menuData["main-menu"], (item) => (
      <Link href={item.uri || "#"}>{item.label}</Link>
    ))!;

    // Add subscription link to the menu
    const subscriptionMenuItem = {
      key: "subscription",
      label: <Link href={ROUTES.SUBSCRIPTION}>Subscription</Link>,
    };

    const menu = [...cmsMenuItems, subscriptionMenuItem];

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

  const topBarSocialLinks = [
    {
      icon: <FacebookRoundedIcon className="w-4 h-4" />,
      url: facebook,
      name: "Facebook",
    },
    {
      icon: <ZaloIcon className="w-4 h-4" />,
      url: zalo,
      name: "Zalo",
    },
    {
      icon: (
        <Image
          src="/mail.webp"
          alt="mail"
          width={16}
          height={16}
          unoptimized
          className="w-4 h-4"
        />
      ),
      url: email ? `mailto:${email}` : null,
      name: "Email",
    },
  ].filter((item) => Boolean(item.url));

  const dsNavItems: HeaderNavItem[] = useMemo(() => {
    if (!masterData?.menuData["main-menu"]) return [];
    const cmsItems = masterData.menuData["main-menu"]
      .filter((item) => (item.label || "").toString().trim().toLowerCase() !== "home")
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
      });
    return [...cmsItems, { label: "Subscription", href: ROUTES.SUBSCRIPTION }];
  }, [masterData.menuData, activeKey, router.pathname]);

  return (
    <>
      {/* === SECTION: Header Top Bar === */}
      <div data-section="header-topbar" className="bg-[#192335] text-white text-sm !hidden" style={{ backgroundColor: "#192335" }}>
        <Container className="py-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {facebook && topBarConfig && (
                <div className="flex items-center gap-2 shrink-0">
                  <FacebookRoundedIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs wrap-break-word line-clamp-1 max-w-[150px]">
                    {topBarConfig.facebookFollowers}
                  </span>
                </div>
              )}
              {(topBarConfig?.phoneNumber || phoneNumber) && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="material-symbols-rounded text-[17px]! shrink-0">phone</span>
                  <span className="text-xs wrap-break-word line-clamp-1 max-w-[150px]">
                    {topBarConfig?.phoneNumber || phoneNumber}
                  </span>
                </div>
              )}
            </div>
            {topBarConfig?.promotionalBanner && (
              <div className="flex items-center gap-2 flex-wrap justify-center min-w-0 flex-1">
                <Button className="bg-[#2563eb] border-none text-white rounded-md h-6 px-2 text-xs font-bold shrink-0" style={{ backgroundColor: "#2563eb" }}>
                  <span className="truncate max-w-[80px]">{topBarConfig.promotionalBanner.buttonText}</span>
                </Button>
                <span className="text-xl shrink-0">{topBarConfig.promotionalBanner.emoji}</span>
                <span className="text-xs wrap-break-word line-clamp-1 min-w-0 flex-1 max-w-[300px]">
                  {topBarConfig.promotionalBanner.text?.replace("{siteName}", generalSettingsTitle || "Histudy")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {topBarSocialLinks.map((social, index) => (
                <Link key={index} href={social.url || "#"} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 transition-colors" title={social.name}>
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* === SECTION: Header Navigation === */}
      <div className="w-full h-[50px]" />
      <DSHeader
        logoSrc={"/assets/figma/logos/logo-color.png"}
        logoAlt={generalSettingsTitle || "IELTS Prediction"}
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
        userName={currentUser?.name || "User"}
        userAvatar={(currentUser?.userData?.avatar?.node as any)?.srcSet}
        onLogin={() => router.push(ROUTES.LOGIN(router.asPath))}
        onSignup={() => router.push(ROUTES.REGISTER)}
        onLogout={signOut}
        onLogoClick={() => router.push(ROUTES.HOME)}
      />
      <div className="w-full -mt-[50px]" />
    </>
  );
};
