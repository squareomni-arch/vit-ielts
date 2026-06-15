import {
  supabaseAdmin,
  findAuthUserIdByEmail,
  ensureTeacherUser,
} from "./supabase-admin";

/**
 * Service-role seed/cleanup helpers for classroom flows. These bypass RLS to
 * set up fixtures (a teacher-owned class, members, assignments) that the UI
 * tests then act on. The join RPC must still run as the real student session.
 */

/** Ensures the e2e teacher exists and returns its user id (classroom owner). */
export async function getTeacherId(): Promise<string> {
  await ensureTeacherUser();
  const id = await findAuthUserIdByEmail("e2e-teacher@vit.test");
  if (!id) throw new Error("e2e teacher user not found after ensure");
  return id;
}

/** First published quiz id (used as an assignment target). */
export async function getAnyPublishedQuizId(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("status", "published")
    .limit(1)
    .single();
  if (error) throw error;
  return data.id as string;
}

export type SeededClassroom = { id: string; inviteCode: string; name: string };

/** Creates a class owned by `ownerId` (teacher member) with an invite code. */
export async function seedClassroom(
  ownerId: string,
  name: string
): Promise<SeededClassroom> {
  const { data: c, error } = await supabaseAdmin
    .from("classrooms")
    .insert({ name, owner_id: ownerId })
    .select("*")
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from("classroom_members")
    .insert({
      classroom_id: c.id,
      user_id: ownerId,
      role: "teacher",
      status: "active",
    });

  let inviteCode = (c as { invite_code?: string }).invite_code ?? null;
  if (!inviteCode) {
    const { data: code } = await supabaseAdmin.rpc(
      "generate_classroom_invite_code"
    );
    inviteCode = (code as string) ?? null;
    if (inviteCode) {
      await supabaseAdmin
        .from("classrooms")
        .update({ invite_code: inviteCode })
        .eq("id", c.id);
    }
  }
  if (!inviteCode) throw new Error("could not obtain an invite code");

  return { id: c.id as string, inviteCode, name };
}

/** Adds `userId` to a class as an active student. */
export async function addActiveStudent(
  classroomId: string,
  userId: string
): Promise<void> {
  await supabaseAdmin.from("classroom_members").insert({
    classroom_id: classroomId,
    user_id: userId,
    role: "student",
    status: "active",
  });
}

/** Seeds an assignment (assigned to all) referencing `quizId`. */
export async function seedAssignment(
  classroomId: string,
  quizId: string,
  createdBy: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("classroom_assignments")
    .insert({
      classroom_id: classroomId,
      quiz_id: quizId,
      assigned_to_all: true,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Tears down a class and all dependent rows (children first). */
export async function deleteClassroom(classroomId: string): Promise<void> {
  const { data: assignments } = await supabaseAdmin
    .from("classroom_assignments")
    .select("id")
    .eq("classroom_id", classroomId);
  const aids = (assignments ?? []).map((a) => a.id);
  if (aids.length) {
    await supabaseAdmin
      .from("classroom_assignment_targets")
      .delete()
      .in("assignment_id", aids);
  }
  await supabaseAdmin
    .from("classroom_assignments")
    .delete()
    .eq("classroom_id", classroomId);
  await supabaseAdmin
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId);
  await supabaseAdmin.from("classrooms").delete().eq("id", classroomId);
}
