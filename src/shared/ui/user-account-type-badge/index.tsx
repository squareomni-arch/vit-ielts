import { ProBadge } from "../pro-badge";

export const UserAccountTypeBadge = ({
  isPro,
  ...props
}: { isPro?: boolean } & React.ComponentProps<typeof ProBadge>) => {
  if (!isPro) return null;
  return <ProBadge {...props} />;
};
