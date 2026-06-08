import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import {
  getClassroom,
  getClassroomAssignments,
  getStudentAssignments,
  getJoinRequests,
} from "~services/classroom";
import { ROUTES } from "@/shared/routes";

export { PageClassroomDetail } from "./ui";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerSupabase(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: { destination: ROUTES.LOGIN(context.resolvedUrl), statusCode: 302 },
    };
  }

  const classroomId = context.params?.id as string;
  const [master, result] = await Promise.all([
    getMasterData(context),
    getClassroom(supabase, classroomId),
  ]);

  if (!result) {
    return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
  }

  const viewer = result.members.find((m) => m.user_id === user.id);
  if (!viewer) {
    return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
  }

  // Teachers get the full assignment roll-up (with per-class submit stats);
  // students get a read-only view of the assignments targeted at them in this class.
  const isTeacher = viewer.role === "teacher";
  const [assignments, studentAssignments, joinRequests] = await Promise.all([
    isTeacher ? getClassroomAssignments(supabase, classroomId) : Promise.resolve([]),
    isTeacher
      ? Promise.resolve([])
      : getStudentAssignments(supabase, user.id).then((all) =>
          all.filter((a) => a.classroom_id === classroomId)
        ),
    isTeacher ? getJoinRequests(supabase, classroomId) : Promise.resolve([]),
  ]);

  return {
    props: {
      ...master.props,
      classroom: result.classroom,
      members: result.members,
      assignments,
      studentAssignments,
      joinRequests,
      viewerRole: viewer.role,
      isOwner: result.classroom.owner_id === user.id,
      viewerId: user.id,
    },
  };
};
