import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEFAULT_PASSWORD = "Student@123";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function createStudents() {
    console.log("Creating 7 student accounts...");
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }

    const students = Array.from({ length: 7 }, (_, i) => {
        const num = i + 1;
        return {
            email: `student${num}@vit.vn`,
            name: `Student ${num}`,
        };
    });

    for (const student of students) {
        console.log(`Processing: ${student.name} (${student.email})`);
        
        // 1. Check if auth user already exists
        const { data: existingUser, error: checkErr } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users.find(u => u.email === student.email);

        let userId: string;

        if (found) {
            console.log(`  User already exists in auth: ${found.id}`);
            userId = found.id;
        } else {
            // Create user in Auth
            const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email: student.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    name: student.name,
                },
            });

            if (authErr) {
                console.error(`  Error creating auth user: ${authErr.message}`);
                continue;
            }

            userId = authData.user.id;
            console.log(`  Created auth user: ${userId}`);
        }

        // 2. Upsert in public.users table
        const { error: dbErr } = await supabase
            .from("users")
            .upsert({
                id: userId,
                email: student.email,
                name: student.name,
                roles: ["subscriber"],
            }, { onConflict: "id" });

        if (dbErr) {
            console.error(`  Error upserting into public.users: ${dbErr.message}`);
        } else {
            console.log(`  Successfully synced ${student.email} to public.users`);
        }
    }

    console.log("\nDone!");
}

createStudents().catch(console.error);
