import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export const UserAccountTypeBadge = ({
  isPro,
  ...props
}: ComponentProps<"span"> & { isPro?: boolean }) => {
  if (!isPro) return null;
  const { className, ...rest } = props;
  return (
    <span
      aria-hidden
      className={twMerge(
        "uppercase text-sm bg-primary text-white px-2 py-0.5 rounded",
        className
      )}
      {...rest}
    >
      pro
    </span>
  );
};
