import { createClient } from "~supabase/client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { isAdminRole } from "~lib/parseRoles";

/**
 * Auth callback page for Google OAuth redirect.
 * Supabase handles the token exchange automatically;
 * we listen for the SIGNED_IN event, ensure a public.users profile exists,
 * then redirect the user.
 */
export default function AuthCallback() {
    const router = useRouter();
    const isExchanging = useRef(false);

    useEffect(() => {
        const supabase = createClient();

        const exchangeCode = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            
            if (code && !isExchanging.current) {
                isExchanging.current = true;
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error("Code exchange failed:", error.message);
                }
            }
        };
        
        exchangeCode();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
                const user = session.user;

                // Ensure public.users profile exists (fallback for Google OAuth)
                const { data: existingProfile } = await supabase
                    .from("users")
                    .select("id")
                    .eq("id", user.id)
                    .single();

                if (!existingProfile) {
                    // Create profile from Google user metadata
                    const meta = user.user_metadata || {};
                    await supabase.from("users").insert({
                        id: user.id,
                        email: user.email || "",
                        name:
                            meta.full_name ||
                            meta.name ||
                            (user.email ? user.email.split("@")[0] : ""),
                        avatar_url: meta.avatar_url || meta.picture || null,
                    });
                }

                // Check admin role for smart redirect
                const { data: profile } = await supabase
                    .from("users")
                    .select("roles")
                    .eq("id", user.id)
                    .single();

                const isAdmin = isAdminRole(profile?.roles);

                // Determine redirect destination
                const params = new URLSearchParams(window.location.search);
                const explicitRedirect = params.get("redirect") || "/";

                if (isAdmin) {
                    window.location.href =
                        explicitRedirect.startsWith("/admin")
                            ? explicitRedirect
                            : "/admin";
                } else {
                    window.location.href = explicitRedirect;
                }
            } else if (event === "INITIAL_SESSION" && !session) {
                // If there's no session initially, we rely on the exchangeCodeForSession to trigger SIGNED_IN.
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                fontFamily: "inherit, sans-serif",
                fontSize: "16px",
                color: "#666",
            }}
        >
            Đang xử lý đăng nhập...
        </div>
    );
}
