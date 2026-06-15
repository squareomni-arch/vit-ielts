import Link from "next/link";
import { useProContentModal } from "../pro-content";
import { JSX } from "react";
import { useAuth } from "@/appx/providers";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/routes";

export const ProLink = ({
  title,
  href,
  isPro,
  children,
  ...props
}: {
  title: string;
  href: string;
  isPro: boolean;
  children: React.ReactNode;
} & Pick<
  React.ComponentProps<typeof Link> | JSX.IntrinsicElements["button"],
  "className"
>) => {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Nếu chưa đăng nhập, navigate về login
    if (!currentUser) {
      router.push(ROUTES.LOGIN(href));
      return;
    }
    // Nếu đã đăng nhập nhưng không phải pro, hiện modal
    if (!currentUser.userData.isPro) {
      openProContentModal();
    }
  };

  // Nếu là pro content và user không phải pro
  if (isPro && !currentUser?.userData?.isPro) {
    return (
      <button
        title={title}
        onClick={handleClick}
        className={twMerge(props.className, "cursor-pointer text-left")}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={href} title={title} {...props}>
      {children}
    </Link>
  );
};
