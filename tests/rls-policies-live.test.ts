
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { supabaseAdmin } from "./fixtures/supabase-live";
import { createTestUser, deleteTestUser } from "./fixtures/test-data-helpers";
import { createClient } from "@supabase/supabase-js";

describe("Task 1.5: RLS Policies Security Audit — Live Integration", () => {
    let userA: any;
    let userB: any;
    let clientA: any;
    let clientB: any;

    beforeAll(async () => {
        // 1. Create two test users
        userA = await createTestUser();
        userB = await createTestUser();

        // 2. Create dedicated clients for each user
        clientA = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await clientA.auth.signInWithPassword({ email: userA.email!, password: userA.password });

        clientB = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await clientB.auth.signInWithPassword({ email: userB.email!, password: userB.password });
    });

    afterAll(async () => {
        // Cleanup users (this will cascade delete their data in Supabase if correctly configured)
        if (userA) await deleteTestUser(userA.id);
        if (userB) await deleteTestUser(userB.id);
    });

    it("Users should ONLY see their own profile in public.users", async () => {
        // User A reads their own profile
        const { data: profileA } = await clientA.from("users").select("id, email").eq("id", userA.id).single();
        expect(profileA).toBeDefined();
        expect(profileA?.id).toBe(userA.id);

        // User A tries to read User B's profile
        const { data: profileB, error } = await clientA.from("users").select("id").eq("id", userB.id).maybeSingle();
        expect(profileB).toBeNull(); // RLS should filter this out
    });

    it("Users should ONLY see their own test_results", async () => {
        // 1. Find a quiz to use
        const { data: quiz } = await supabaseAdmin.from("quizzes").select("id").limit(1).single();
        
        // 2. User A creates a result
        const { data: resultA } = await supabaseAdmin.from("test_results").insert({
            user_id: userA.id,
            quiz_id: quiz!.id,
            status: "draft"
        }).select().single();

        // 3. User A can read it
        const { data: readA } = await clientA.from("test_results").select("id").eq("id", resultA.id).maybeSingle();
        expect(readA).not.toBeNull();

        // 4. User B cannot read it
        const { data: readB } = await clientB.from("test_results").select("id").eq("id", resultA.id).maybeSingle();
        expect(readB).toBeNull();

        // Cleanup result
        await supabaseAdmin.from("test_results").delete().eq("id", resultA.id);
    });

    it("Users should ONLY see their own orders", async () => {
        // 1. Create an order for User A
        const { data: orderA } = await supabaseAdmin.from("orders").insert({
            order_id: "RLS-ORDER-" + Math.random().toString(36).substring(7),
            user_id: userA.id,
            amount: 1000,
            duration: 1,
            package_type: "combo"
        }).select().single();

        // 2. User A can read it
        const { data: readA } = await clientA.from("orders").select("id").eq("id", orderA.id).maybeSingle();
        expect(readA).not.toBeNull();

        // 3. User B cannot read it
        const { data: readB } = await clientB.from("orders").select("id").eq("id", orderA.id).maybeSingle();
        expect(readB).toBeNull();
    });

    it("Public users can ONLY see published quizzes", async () => {
        // 1. Create a draft quiz
        const { data: draftQuiz } = await supabaseAdmin.from("quizzes").insert({
            title: "Draft Quiz RLS",
            slug: "draft-quiz-rls-" + Math.random().toString(36).substring(7),
            status: "draft",
            type: "practice",
            skill: "reading",
            time_minutes: 60
        }).select().single();

        // 2. Create a published quiz
        const { data: pubQuiz } = await supabaseAdmin.from("quizzes").insert({
            title: "Pub Quiz RLS",
            slug: "pub-quiz-rls-" + Math.random().toString(36).substring(7),
            status: "published",
            type: "practice",
            skill: "reading",
            time_minutes: 60
        }).select().single();

        const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

        // 3. Anon cannot see draft
        const { data: readDraft } = await anonClient.from("quizzes").select("id").eq("id", draftQuiz.id).maybeSingle();
        expect(readDraft).toBeNull();

        // 4. Anon can see published
        const { data: readPub } = await anonClient.from("quizzes").select("id").eq("id", pubQuiz.id).maybeSingle();
        expect(readPub).not.toBeNull();

        // Cleanup
        await supabaseAdmin.from("quizzes").delete().in("id", [draftQuiz.id, pubQuiz.id]);
    });
});
