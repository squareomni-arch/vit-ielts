import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getClassroomsForUser, getClassroom } from "~services/classroom";
import { isTeacherRole } from "~lib/parseRoles";
import { ROUTES } from "@/shared/routes";
import type { CollaboratorRow } from "./ui";

export { PageClassroomCollaborators } from "./ui";

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

  const { data: profile } = await supabase
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();

  const isTeacher = isTeacherRole(profile?.roles);

  // Non-teachers are redirected to the classroom list
  if (!isTeacher) {
    return {
      redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 },
    };
  }

  const master = await getMasterData(context);

  // Load the teacher's owned classrooms
  const allClassrooms = await getClassroomsForUser(supabase, user.id);
  const ownedClassrooms = allClassrooms.filter((c) => c.owner_id === user.id);

  // Aggregate teacher-role members across all owned classes
  // Map: user_id → { row data, set of class ids they belong to }
  const collabMap = new Map<
    string,
    { row: CollaboratorRow; classIds: Set<string> }
  >();

  if (ownedClassrooms.length > 0) {
    const memberResults = await Promise.all(
      ownedClassrooms.map((c) => getClassroom(supabase, c.id))
    );

    memberResults.forEach((result, idx) => {
      if (!result) return;
      const classroom = ownedClassrooms[idx];

      result.members.forEach((m) => {
        // Only include teacher-role members (excludes students)
        if (m.role !== "teacher") return;

        const existing = collabMap.get(m.user_id);
        if (existing) {
          existing.classIds.add(classroom.id);
          // Upgrade to Owner if this class is owned by them
          if (classroom.owner_id === m.user_id) {
            existing.row.role = "Owner";
          }
        } else {
          collabMap.set(m.user_id, {
            row: {
              user_id: m.user_id,
              name: m.display_name || m.name,
              email: m.email,
              avatar_url: m.avatar_url,
              role: classroom.owner_id === m.user_id ? "Owner" : "Teacher",
              class_count: 0, // filled below
            },
            classIds: new Set([classroom.id]),
          });
        }
      });
    });
  }

  // Compute class_count from the set size and sort: Owner first, then by name
  const collaborators: CollaboratorRow[] = [...collabMap.values()]
    .map(({ row, classIds }) => ({ ...row, class_count: classIds.size }))
    .sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1;
      if (a.role !== "Owner" && b.role === "Owner") return 1;
      return (a.name || a.email).localeCompare(b.name || b.email);
    });

  const ownedForInvite = ownedClassrooms.map((c) => ({
    id: c.id,
    name: c.name,
    invite_code: c.invite_code,
  }));

  return {
    props: {
      ...master.props,
      collaborators,
      ownedClassrooms: ownedForInvite,
    },
  };
};
