import Link from "next/link";
import { ROUTES } from "@/shared/routes";


const STATIC_NAV = [
  { label: "Home",               href: ROUTES.HOME },
  { label: "IELTS Exam Library", href: ROUTES.EXAM.ARCHIVE },
  { label: "Subscription",       href: ROUTES.SUBSCRIPTION },
  { label: "Blog",               href: ROUTES.BLOG.ARCHIVE },
] as const;

export const HeaderNavMain = () => {
  return (
    <ul className="flex items-stretch h-full">
      {STATIC_NAV.map(({ label, href }) => (
        <li key={href}>
          <Link
            className="px-2.5 flex font-semibold items-center justify-center h-full transition-all duration-150 text-gray-700 hover:bg-gray-100"
            href={href}
            style={{ lineHeight: "50px" }}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
};
