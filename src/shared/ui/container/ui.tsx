import { twMerge } from "tailwind-merge";

export const Container = ({
  children,
  className,
  id,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      id={id}
      className={twMerge(
        "w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
