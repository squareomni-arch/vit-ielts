import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps } from "next";

export { PageResetPassword as default } from "@/pages/account/reset-password";

// No `withGuest` here — Supabase establishes a recovery session in the URL
// hash/query when the user clicks the email link, so the page MUST be
// reachable while signed-in.
export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
);
