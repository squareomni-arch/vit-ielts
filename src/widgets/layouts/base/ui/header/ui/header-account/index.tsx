import { Divider, Dropdown, MenuProps, theme } from "antd";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import {
  cloneElement,
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROUTES } from "@/shared/routes";
import dayjs from "dayjs";
import { Avatar } from "@/entities";
import { ProBadge } from "@/shared/ui/pro-badge";

export function HeaderAccount() {
  const { useToken } = theme;
  const { token } = useToken();
  const { isSignedIn, signOut, currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(dayjs().format("hh:mm"));

  const contentStyle: CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format("hh:mm"));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const menuItems: MenuProps["items"] = useMemo(
    () => [
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
      ...(currentUser?.roles.nodes[0].name === "administrator"
        ? [
            { type: "divider" as const },
            {
              key: "4",
              label: <Link href={ROUTES.ADMIN.DASHBOARD}>Admin Dashboard</Link>,
              icon: (
                <i className="material-symbols-rounded">home</i>
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
      },
    ],
    [currentUser?.roles.nodes, signOut]
  );

  return (
    <ul className="flex space-x-6">
      {isSignedIn ? (
        <li>
          <Dropdown
            arrow
            align={{
              offset: [0, 10],
            }}
            placement="bottomRight"
            dropdownRender={(menu) => (
              <div style={contentStyle} className="min-w-52">
                <div
                  className="flex items-center gap-2 text-sm p-2"
                  title={currentUser?.name}
                >
                  <Avatar currentUser={currentUser} />
                  <div>
                    <p className="font-bold text-primary-600">
                      {currentUser?.name}{" "}
                      {currentUser?.userData.isPro && (
                        <ProBadge className="ml-1" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {currentTime} (GMT+07:00)
                    </p>
                  </div>
                </div>
                <Divider style={{ margin: 0 }} />
                {cloneElement(
                  menu as React.ReactElement<{
                    style: React.CSSProperties;
                  }>,
                  {
                    style: {
                      boxShadow: "none",
                    },
                  }
                )}
              </div>
            )}
            menu={{
              items: menuItems,
            }}
          >
            <div
              className="flex items-center text-white gap-2 text-sm cursor-pointer"
              title={currentUser?.name}
            >
              <Avatar currentUser={currentUser} />
              <div>
                <p className="font-bold">{currentUser?.name}</p>
                {currentUser?.userData.isPro && (
                  <ProBadge className="mt-1" />
                )}
              </div>
              <i className="material-symbols-rounded">keyboard_arrow_down</i>
            </div>
          </Dropdown>
        </li>
      ) : (
        <>
          <li>
            <Link className="hover:underline" href={ROUTES.REGISTER}>
              Sign Up
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href={ROUTES.LOGIN()}>
              Login
            </Link>
          </li>
        </>
      )}
    </ul>
  );
}
