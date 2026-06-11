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
            const explicitRedirect = params.get("redirect") || "/";
            
            if (code && !isExchanging.current) {
                isExchanging.current = true;
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                
                let user = data?.session?.user;

                if (error) {
                    // In some environments, the Supabase client automatically exchanges the code 
                    // in the background, consuming the PKCE cookie before this line runs.
                    // If that happens, exchangeCodeForSession throws "PKCE code verifier not found",
                    // but the user is actually successfully logged in!
                    const { data: sessionData } = await supabase.auth.getUser();

                    if (sessionData?.user) {
                        user = sessionData.user;
                        console.log("Session recovered from background exchange.");
                    } else {
                        console.error("Code exchange failed:", error.message);
                        window.location.href = "/?error=" + encodeURIComponent(error.message);
                        return;
                    }
                }

                if (user) {

                    // Ensure public.users profile exists
                    const { data: existingProfile } = await supabase
                        .from("users")
                        .select("id")
                        .eq("id", user.id)
                        .single();

                    if (!existingProfile) {
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

                    // Check admin role
                    const { data: profile } = await supabase
                        .from("users")
                        .select("roles")
                        .eq("id", user.id)
                        .single();

                    const isAdmin = isAdminRole(profile?.roles);

                    if (isAdmin) {
                        window.location.href =
                            explicitRedirect.startsWith("/admin")
                                ? explicitRedirect
                                : "/admin";
                    } else {
                        window.location.href = explicitRedirect;
                    }
                }
            } else if (!code) {
                // No code found, just redirect
                window.location.href = "/";
            }
        };
        
        exchangeCode();
    }, [router.isReady]);

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
