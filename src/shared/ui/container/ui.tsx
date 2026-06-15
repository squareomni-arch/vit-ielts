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
        "w-full px-4 md:px-6 lg:px-10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
