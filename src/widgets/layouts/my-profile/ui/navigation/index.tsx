import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/router";
import { useAuth } from "@/appx/providers";
import Image from "next/image";

// === ICON MAP: material-symbols-rounded icon names ===
const ICON_MAP: Record<string, string> = {
  person: "person",
  home: "grid_view",
  class: "school",
  shopping_cart: "shopping_cart",
  link: "group",
  payment: "credit_card",
  logout: "logout",
};

export const Navigation = ({
  navigation: ACCOUNT_NAVIGATION,
}: {
  navigation: Array<{
    label?: string;
    icon?: string;
    link?: string;
    match?: string;
    notMatch?: string;
    type?: string;
    danger?: boolean;
  }>;
}) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const userName = currentUser?.name || "User";

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "2px solid #D94A56" }}
      data-section="sidebar-nav"
    >
      {/* === Profile Header === */}
      <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-5 border-b border-gray-100">
        {/* Avatar — yellow circle with initial, matching Figma placeholder */}
        <div className="w-16 h-16 rounded-full bg-[#F7CA3B] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Greeting */}
        <p className="text-sm font-bold text-[#2D3142] uppercase text-center leading-tight tracking-wide">
          CHÀO MỪNG, {userName.toUpperCase()}
        </p>
      </div>

      {/* === Navigation Items === */}
      <ul className="py-2">
        {ACCOUNT_NAVIGATION.map((item, index) => {
          if (item.type === "divider") {
            return (
              <li key={index}>
                <div className="my-1 border-t border-gray-100" />
              </li>
            );
          }

          const isActive =
            !(item.notMatch && router.pathname.startsWith(item.notMatch)) &&
            (router.pathname === item.link ||
              (!!item.match && router.pathname.startsWith(item.match)));
          const iconName = item.icon ? (ICON_MAP[item.icon] ?? item.icon) : null;

          if (item.danger) {
            return (
              <li key={index}>
                <Link
                  href={item.link || "#"}
                  className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:bg-gray-50 transition-colors duration-150 group"
                >
                  {iconName === "group" ? (
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                      <Image
                        src="/assets/figma/icons/get-money.svg"
                        alt={item.label || "icon"}
                        width={18}
                        height={18}
                        className="opacity-60 group-hover:opacity-100"
                      />
                    </div>
                  ) : (
                    iconName && (
                      <span className="material-symbols-rounded text-[18px] text-gray-400 group-hover:text-gray-600">
                        {iconName}
                      </span>
                    )
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={index}>
              <Link
                href={item.link || "#"}
                className={twMerge(
                  "flex items-center gap-3 mx-2 my-0.5 px-4 py-2.5 rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-[#374151] hover:bg-gray-50"
                )}
              >
                {iconName === "group" ? (
                  <div className={twMerge("w-[18px] h-[18px] flex items-center justify-center", isActive ? "brightness-0 invert" : "")}>
                    <Image
                      src="/assets/figma/icons/get-money.svg"
                      alt={item.label || "icon"}
                      width={18}
                      height={18}
                    />
                  </div>
                ) : (
                  iconName && (
                    <span
                      className={twMerge(
                        "material-symbols-rounded text-[18px]",
                        isActive ? "text-white" : "text-gray-500"
                      )}
                    >
                      {iconName}
                    </span>
                  )
                )}
                <span
                  className={twMerge(
                    "text-sm font-medium",
                    isActive ? "font-semibold" : ""
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
