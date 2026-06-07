import { GetServerSideProps } from "next";
import { ROUTES } from "@/shared/routes";

// The assignment list is now a tab inside the class detail page.
// Keep this route working by redirecting to that tab.
export { PageClassroomAssignments } from "./ui";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const classroomId = context.params?.id as string;
  return {
    redirect: {
      destination: `${ROUTES.CLASSROOM.DETAIL(classroomId)}?tab=assignments`,
      statusCode: 302,
    },
  };
};
