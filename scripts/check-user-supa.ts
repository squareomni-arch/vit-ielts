import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = 'ligktit@gmail.com';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function checkUser() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("❌ Failed to list users:", error.message);
        return;
    }

    const user = data.users.find(u => u.email === email);
    if (user) {
        console.log('✅ User found in Supabase!');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
    } else {
        console.log('❌ User not found in Supabase:', email);
    }
}

checkUser();
