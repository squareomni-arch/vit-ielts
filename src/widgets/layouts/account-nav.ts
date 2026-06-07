import { ROUTES } from "@/shared/routes";

export type AccountNavItem = {
  label?: string;
  icon?: string;
  link?: string;
  /** active when router.pathname starts with this prefix (for sub-routes) */
  match?: string;
  /** suppress active state when pathname starts with this prefix (more specific sibling wins) */
  notMatch?: string;
  type?: string;
  danger?: boolean;
};

/**
 * Shared left-sidebar navigation for the account area (My Profile layout) and
 * the classroom layout — keeps the menu identical across both, matching Figma.
 */
export const ACCOUNT_NAVIGATION: AccountNavItem[] = [
  { label: "Tài Khoản Của Tôi", icon: "person", link: ROUTES.ACCOUNT.MY_PROFILE },
  { label: "Bảng điều khiển", icon: "home", link: ROUTES.ACCOUNT.DASHBOARD },
  {
    label: "Lớp học của tôi",
    icon: "class",
    link: ROUTES.CLASSROOM.LIST,
    match: "/classroom",
    notMatch: "/classroom/my-assignments",
  },
  {
    label: "Bài tập của tôi",
    icon: "assignment",
    link: ROUTES.CLASSROOM.MY_ASSIGNMENTS,
    match: "/classroom/my-assignments",
  },
  { label: "Lịch sử đơn hàng", icon: "shopping_cart", link: ROUTES.ACCOUNT.ORDER_HISTORY },
  { label: "Cộng tác viên", icon: "link", link: ROUTES.ACCOUNT.AFFILIATE },
  { label: "Thanh toán", icon: "payment", link: ROUTES.CHECKOUT },
  { type: "divider" },
  { label: "Đăng xuất", icon: "logout", link: "#", danger: true },
];
