import { twMerge } from "tailwind-merge";

export const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        "mx-auto max-w-[1600px]",
        className
      )}
    >
      {children}
    </div>
  );
};
