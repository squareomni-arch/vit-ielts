/**
 * Device Service — Check & register device fingerprint
 *
 * Mỗi user lưu 1 device ID per device type (mobile/tablet/desktop)
 * trong JSONB column `users.devices`
 *
 * Structure: { mobile: { device_id: "xxx", server_hash: "abc" }, desktop: { device_id: "yyy", server_hash: "def" } }
 *
 * server_hash = SHA-256(ip + userAgent) — secondary check to detect spoofed deviceIds.
 *
 * @origin functions.php L2056–2120
 * @see LEGACY_CODEBASE_DOCS.md#2-4-device-fingerprint
 */

import { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

type DeviceType = "mobile" | "tablet" | "desktop";

type DeviceEntry = { device_id: string; server_hash?: string };

type DeviceMap = Record<string, DeviceEntry>;

/**
 * Generate a server-side fingerprint hash from IP + User-Agent.
 * Used as a secondary check alongside the client-provided device ID.
 */
function createServerHash(ip?: string, userAgent?: string): string | undefined {
    if (!ip && !userAgent) return undefined;
    return crypto
        .createHash("sha256")
        .update(`${ip || ""}|${userAgent || ""}`)
        .digest("hex")
        .slice(0, 16); // 16-char prefix is sufficient
}

/**
 * Kiểm tra device ID có khớp với device đã đăng ký của user hay không
 *
 * @param supabase - Supabase client (browser hoặc SSR)
 * @param deviceId - FingerprintJS visitorId
 * @param deviceType - "mobile" | "tablet" | "desktop"
 * @param options - Optional server-side context (IP, User-Agent) for secondary check
 * @returns true nếu device đã đăng ký và khớp
 */
export async function checkDevice(
    supabase: SupabaseClient,
    deviceId: string,
    deviceType: DeviceType,
    options?: { ip?: string; userAgent?: string },
): Promise<boolean> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile, error } = await supabase
        .from("users")
        .select("devices")
        .eq("id", user.id)
        .single();

    if (error) throw error;

    const devices: DeviceMap = profile?.devices ?? {};
    const entry = devices[deviceType];

    if (!entry || entry.device_id !== deviceId) return false;

    // If server_hash is stored and server context is available, do secondary check
    if (entry.server_hash && options) {
        const currentHash = createServerHash(options.ip, options.userAgent);
        if (currentHash && currentHash !== entry.server_hash) {
            // Server fingerprint mismatch — device ID may be spoofed
            // Log but don't block (soft check)
            console.warn(
                `[Device] Server hash mismatch for user ${user.id}, device ${deviceType}`,
            );
        }
    }

    return true;
}

/**
 * Đăng ký (lưu) device fingerprint cho user
 * Ghi đè device_id cũ nếu đã có cùng deviceType
 *
 * @param supabase - Supabase client
 * @param deviceId - FingerprintJS visitorId
 * @param deviceType - "mobile" | "tablet" | "desktop"
 * @param options - Optional server-side context (IP, User-Agent) for secondary fingerprint
 */
export async function registerDevice(
    supabase: SupabaseClient,
    deviceId: string,
    deviceType: DeviceType,
    options?: { ip?: string; userAgent?: string },
): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile, error: fetchError } = await supabase
        .from("users")
        .select("devices")
        .eq("id", user.id)
        .single();

    if (fetchError) throw fetchError;

    const devices: DeviceMap = profile?.devices ?? {};
    devices[deviceType] = {
        device_id: deviceId,
        server_hash: createServerHash(options?.ip, options?.userAgent),
    };

    const { error } = await supabase
        .from("users")
        .update({ devices })
        .eq("id", user.id);

    if (error) throw error;
}
