const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
    { name: "admin_holy", email: "techlead.holy@gmail.com" },
    { name: "admin_vit", email: "admin@vit.vn" },
    { name: "student", email: "devtest@vit.vn" },
    { name: "teacher", email: "e2e-teacher@vit.test" }
];

const candidatePasswords = [
    "IeltsTest@2026",
    "DevTest@123",
    "E2eTeach!23",
    "3986483aA@"
];

async function verifyPasswords() {
    console.log("Verifying passwords for test accounts...");
    for (const account of accounts) {
        let found = false;
        for (const pwd of candidatePasswords) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: account.email,
                password: pwd,
            });
            if (!error) {
                console.log(`✅ SUCCESS: Role: ${account.name} | Email: ${account.email} | Password: ${pwd}`);
                found = true;
                break;
            }
        }
        if (!found) {
            console.log(`❌ FAILED to find password for ${account.name} (${account.email})`);
        }
    }
}

verifyPasswords();
