import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export type ProBadgeProps = ComponentProps<"span"> & {
  variant?: "primary" | "white";
};

export const ProBadge = ({ className, variant = "primary", ...props }: ProBadgeProps) => {
  return (
    <span
      className={twMerge(
        "inline-flex shrink-0 select-none items-center justify-center rounded-[5px] font-noto-sans font-bold uppercase tracking-widest shadow-[0_4px_8px_3px_rgba(0,0,0,0.15),_0_1px_3px_0_rgba(0,0,0,0.30)]",
        "h-[22px] w-[42px] text-[10px] leading-none",
        variant === "primary" ? "bg-primary-500 text-white" : "bg-white text-primary-500",
        className
      )}
      title="This test requires a PRO account"
      {...props}
    >
      PRO
    </span>
  );
};

