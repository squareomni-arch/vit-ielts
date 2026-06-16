import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function printSql() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }

    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error);
        process.exit(1);
    }

    const students = users.users.filter(u => u.email?.match(/^student[1-7]@vit\.vn$/));
    
    console.log("-- SQL INSERT STATEMENTS FOR 7 STUDENTS\n");
    console.log("-- 1. Insert into auth.users");
    
    // We can't select encrypted_password directly via listUsers SDK easily because it's not in the public user object returned by listUsers.
    // However, we can query it directly using the postgres connection via supabase.rpc or direct query if we have service_role.
    // Let's run a select query from auth.users using supabase Client since service role allows selecting from auth.users?
    // Wait, by default service role cannot query auth schema via supabase client directly unless we do a custom RPC or direct query.
    // But wait! We can just query public.users table or compute the crypt hash in Postgres itself!
    // Yes! In Postgres SQL, we can just do:
    // Extensions.crypt('Student@123', Extensions.gen_salt('bf'))
    // This is much cleaner and works everywhere!
}

printSql();
