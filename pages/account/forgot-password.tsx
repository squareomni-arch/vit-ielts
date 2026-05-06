import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps } from "next";

export { PageForgotPassword as default } from "@/pages/account/forgot-password";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
);
