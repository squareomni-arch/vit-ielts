/**
 * PageSettings — Account settings page.
 *
 * Persisted controls (saved to users.settings via browser Supabase client):
 *   - Notifications: weeklyReport, studyReminders, newMockTests,
 *     communityReplies, productUpdates
 *   - Preferences: language, timezone, appearance
 *
 * Security controls (wired):
 *   - Two-factor authentication → Supabase MFA TOTP flow
 *   - Active sessions "Manage" → device-management via users.devices
 *
 * NOTE: Storing the preference is the full scope of this step.
 *   Applying `appearance` (theming), `language` (i18n), and `timezone`
 *   (date/time formatting), as well as actually sending notifications,
 *   are all future work.
 *
 * Wired links:
 *   - "Manage plan"  → ROUTES.SUBSCRIPTION
 *   - "Update" (payment method) → ROUTES.SUBSCRIPTION
 *   - "View" (invoices) → ROUTES.ACCOUNT.ORDER_HISTORY
 *   - "Change" (password) → ROUTES.ACCOUNT.MY_PROFILE
 */

import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/widgets/layouts";
import { ROUTES } from "@/shared/routes";
import { useAppContext, useAuth } from "@/appx/providers";
import { createClient } from "~supabase/client";
import type { UserSettings } from "~services/types/database";
import Link from "next/link";

// ── Reusable primitives ──────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** Toggle switch using brand token colors. */
const Toggle = ({ checked, onChange, label, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={[
      "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
      "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-brand focus-visible:ring-offset-2",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      checked ? "bg-brand" : "bg-border-hairline",
    ].join(" ")}
  >
    <span
      className={[
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-primary",
        "transition duration-200",
        checked ? "translate-x-5" : "translate-x-0",
      ].join(" ")}
    />
  </button>
);

interface SettingRowProps {
  label: string;
  description?: string;
  action?: React.ReactNode;
}

/** A single row inside a settings card. */
const SettingRow = ({ label, description, action }: SettingRowProps) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-border-hairline last:border-b-0">
    <div className="flex-1 min-w-0">
      <p className="text-body-m font-medium text-ink-900">{label}</p>
      {description && (
        <p className="text-body-s text-ink-muted mt-0.5">{description}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
}

const SettingsCard = ({ title, children }: SettingsCardProps) => (
  <section className="bg-surface-card rounded-2xl px-6 pt-5 pb-1 shadow-primary">
    <h2 className="text-title-m font-display font-bold text-ink-900 mb-1">
      {title}
    </h2>
    <div>{children}</div>
  </section>
);

/** Pill showing a static preference value. */
const ValuePill = ({ value }: { value: string }) => (
  <span className="inline-flex items-center rounded-lg bg-brand-tint border border-border-hairline px-3 py-1 text-body-s font-medium text-ink-700">
    {value}
  </span>
);

/** Ghost "action" button used inside cards. */
const ActionButton = ({
  href,
  onClick,
  children,
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const cls = [
    "inline-flex items-center gap-1 rounded-xl border border-border-hairline bg-surface-card px-4 py-2 text-body-s font-medium text-ink-900",
    "hover:bg-brand-tint hover:border-brand transition-colors duration-150 cursor-pointer",
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
  ]
    .join(" ")
    .trim();
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
};

/** Small inline "Saved" indicator that fades out. */
const SavedIndicator = ({ visible }: { visible: boolean }) => (
  <span
    aria-live="polite"
    className={[
      "text-body-s text-ink-muted transition-opacity duration-500",
      visible ? "opacity-100" : "opacity-0",
    ].join(" ")}
  >
    Saved
  </span>
);

// ── Toast ────────────────────────────────────────────────────────────────────

type ToastLevel = "success" | "error" | "info";

interface ToastMsg {
  id: number;
  level: ToastLevel;
  text: string;
}

let _toastId = 0;

const ToastContainer = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) => (
  <div
    aria-live="assertive"
    className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        className={[
          "pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-primary text-body-s font-medium max-w-xs",
          t.level === "error"
            ? "bg-red-50 text-red-700 border border-red-200"
            : t.level === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-surface-card text-ink-900 border border-border-hairline",
        ].join(" ")}
      >
        <span className="flex-1">{t.text}</span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(t.id)}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <span className="material-symbols-rounded text-base leading-none">
            close
          </span>
        </button>
      </div>
    ))}
  </div>
);

// ── MFA enroll modal ─────────────────────────────────────────────────────────

interface MfaEnrollPanelProps {
  qrCode: string; // SVG string from Supabase
  secret: string;
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}

const MfaEnrollPanel = ({
  qrCode,
  secret,
  factorId,
  onSuccess,
  onCancel,
  onError,
}: MfaEnrollPanelProps) => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => {
    const trimmed = code.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      onError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr || !challengeData) {
        onError(challengeErr?.message ?? "Failed to start MFA challenge.");
        setBusy(false);
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: trimmed,
      });
      if (verifyErr) {
        onError(verifyErr.message ?? "Invalid code. Please try again.");
        setBusy(false);
        return;
      }
      onSuccess();
    } catch {
      onError("An unexpected error occurred. Please try again.");
      setBusy(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Set up two-factor authentication"
    >
      <div className="bg-surface-card rounded-2xl shadow-primary p-6 w-full max-w-sm mx-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-title-m font-display font-bold text-ink-900">
            Set up authenticator
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-ink-muted hover:text-ink-900 transition-colors"
          >
            <span className="material-symbols-rounded text-xl leading-none">
              close
            </span>
          </button>
        </div>

        <ol className="flex flex-col gap-3 text-body-s text-ink-700 list-decimal list-inside">
          <li>Install an authenticator app (Google Authenticator, Authy, etc.).</li>
          <li>Scan the QR code below, or enter the secret manually.</li>
          <li>Enter the 6-digit code shown in the app.</li>
        </ol>

        {/* QR code — Supabase returns an SVG string */}
        <div
          className="flex justify-center rounded-xl border border-border-hairline p-3 bg-white"
          dangerouslySetInnerHTML={{ __html: qrCode }}
          aria-label="QR code for authenticator app"
        />

        {/* Manual secret */}
        <div className="rounded-xl bg-brand-tint border border-border-hairline px-3 py-2">
          <p className="text-body-xs text-ink-muted mb-0.5">Manual entry key</p>
          <p className="text-body-s font-mono font-medium text-ink-900 break-all select-all">
            {secret}
          </p>
        </div>

        {/* Code input */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="mfa-code"
            className="text-body-s font-medium text-ink-700"
          >
            Verification code
          </label>
          <input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
            placeholder="123456"
            className={[
              "w-full rounded-xl border border-border-hairline bg-surface-card px-4 py-2.5",
              "text-body-m text-ink-900 placeholder:text-ink-muted tracking-widest",
              "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
            ].join(" ")}
            disabled={busy}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-border-hairline px-4 py-2.5 text-body-s font-medium text-ink-900 hover:bg-brand-tint transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={busy || code.length < 6}
            className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-body-s font-medium text-white hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Verifying…" : "Enable 2FA"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sessions panel ────────────────────────────────────────────────────────────

interface SessionsPanelProps {
  sessionCount: number;
  onSignOutOthers: () => Promise<void>;
  onClose: () => void;
}

const SessionsPanel = ({
  sessionCount,
  onSignOutOthers,
  onClose,
}: SessionsPanelProps) => {
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    await onSignOutOthers();
    setBusy(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Manage active sessions"
    >
      <div className="bg-surface-card rounded-2xl shadow-primary p-6 w-full max-w-sm mx-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-title-m font-display font-bold text-ink-900">
            Active sessions
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink-900 transition-colors"
          >
            <span className="material-symbols-rounded text-xl leading-none">
              close
            </span>
          </button>
        </div>

        <div className="rounded-xl bg-brand-tint border border-border-hairline px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-rounded text-xl text-brand">
            devices
          </span>
          <p className="text-body-s text-ink-900">
            <span className="font-semibold">{sessionCount}</span>{" "}
            {sessionCount === 1 ? "device" : "devices"} signed in to your
            account.
          </p>
        </div>

        <p className="text-body-s text-ink-muted">
          Signing out other devices will revoke their sessions. You will remain
          signed in on this device.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-border-hairline px-4 py-2.5 text-body-s font-medium text-ink-900 hover:bg-brand-tint transition-colors disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy || sessionCount <= 1}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-body-s font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy
              ? "Signing out…"
              : sessionCount <= 1
                ? "No other devices"
                : "Sign out others"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Device fingerprint ────────────────────────────────────────────────────────

/**
 * Returns a stable device key for the current browser session.
 * Stored in localStorage so it persists across page reloads.
 * This is a best-effort identifier — it is NOT a security token.
 * Its sole purpose is to avoid signing out the current device when
 * clearing others.
 */
function getOrCreateDeviceKey(): string {
  const LS_KEY = "vit_device_key";
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(LS_KEY);
    if (existing) return existing;
    // Generate a random key; crypto.randomUUID is available in all modern browsers.
    const key =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(LS_KEY, key);
    return key;
  } catch {
    // localStorage blocked (e.g. private browsing with restrictive settings)
    return "";
  }
}

// ── Page component ───────────────────────────────────────────────────────────

interface PageSettingsProps {
  initialSettings?: UserSettings;
}

export const PageSettings = ({ initialSettings = {} }: PageSettingsProps) => {
  const {
    masterData: {
      allSettings: { generalSettingsTitle },
    },
  } = useAppContext();
  const { currentUser } = useAuth();

  // ── Derive seeded defaults ──
  const notifs = initialSettings.notifications ?? {};

  // ── Notifications toggles (persisted) ──
  const [weeklyReport, setWeeklyReport] = useState(notifs.weeklyReport ?? true);
  const [studyReminders, setStudyReminders] = useState(
    notifs.studyReminders ?? true,
  );
  const [newMockTests, setNewMockTests] = useState(notifs.newMockTests ?? false);
  const [communityReplies, setCommunityReplies] = useState(
    notifs.communityReplies ?? true,
  );
  const [productUpdates, setProductUpdates] = useState(
    notifs.productUpdates ?? false,
  );

  // ── Two-factor authentication (Supabase MFA) ──
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  /** Payload from supabase.auth.mfa.enroll — shown in the setup modal */
  const [enrollPayload, setEnrollPayload] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);

  // ── Active sessions ──
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showSessionsPanel, setShowSessionsPanel] = useState(false);
  const deviceKeyRef = useRef<string>("");

  // ── Toast ──
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback(
    (text: string, level: ToastLevel = "info") => {
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, level, text }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5000,
      );
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Preferences selectors (persisted — UI is ValuePill for now) ──
  const [language] = useState(initialSettings.language ?? "English");
  const [timezone] = useState(initialSettings.timezone ?? "GMT+7 · Hanoi");
  const [appearance] = useState<UserSettings["appearance"]>(
    initialSettings.appearance ?? "light",
  );

  // ── Saved indicator ──
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback(() => {
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  // ── Persist helper ──
  const persist = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!currentUser?.id) return;
      const supabase = createClient();

      const { data: row } = await supabase
        .from("users")
        .select("settings")
        .eq("id", currentUser.id)
        .single();

      const current: UserSettings = (row?.settings as UserSettings) ?? {};

      const next: UserSettings = {
        ...current,
        ...patch,
        ...(patch.notifications
          ? {
              notifications: {
                ...current.notifications,
                ...patch.notifications,
              },
            }
          : {}),
      };

      await supabase
        .from("users")
        .update({ settings: next })
        .eq("id", currentUser.id);

      showSaved();
    },
    [currentUser?.id, showSaved],
  );

  // ── Toggle handlers that update local state then persist ──
  const handleWeeklyReport = useCallback(
    (v: boolean) => {
      setWeeklyReport(v);
      persist({ notifications: { weeklyReport: v } });
    },
    [persist],
  );
  const handleStudyReminders = useCallback(
    (v: boolean) => {
      setStudyReminders(v);
      persist({ notifications: { studyReminders: v } });
    },
    [persist],
  );
  const handleNewMockTests = useCallback(
    (v: boolean) => {
      setNewMockTests(v);
      persist({ notifications: { newMockTests: v } });
    },
    [persist],
  );
  const handleCommunityReplies = useCallback(
    (v: boolean) => {
      setCommunityReplies(v);
      persist({ notifications: { communityReplies: v } });
    },
    [persist],
  );
  const handleProductUpdates = useCallback(
    (v: boolean) => {
      setProductUpdates(v);
      persist({ notifications: { productUpdates: v } });
    },
    [persist],
  );

  // ── Load MFA status on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadMfa() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (cancelled) return;
        if (error) {
          // MFA might not be enabled on this Supabase project — treat as unavailable silently
          setTwoFactorLoading(false);
          return;
        }
        // A "verified" TOTP factor means 2FA is active
        const verified = data?.totp?.find(
          (f: { id: string; status: string }) => f.status === "verified",
        );
        if (verified) {
          setTwoFactor(true);
          setMfaFactorId(verified.id);
        }
      } catch {
        // Silently ignore — MFA availability is best-effort
      } finally {
        if (!cancelled) setTwoFactorLoading(false);
      }
    }
    loadMfa();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load active sessions on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;

    deviceKeyRef.current = getOrCreateDeviceKey();

    async function loadSessions() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("users")
          .select("devices")
          .eq("id", currentUser!.id)
          .single();

        if (cancelled) return;
        if (error || !data) {
          setSessionsLoading(false);
          return;
        }

        const devices = (data.devices ?? {}) as Record<
          string,
          { device_id: string }
        >;
        const count = Object.keys(devices).length;

        // Ensure the current device is registered so the count is accurate.
        // We use the localStorage key as the map key and device_id value.
        const dk = deviceKeyRef.current;
        if (dk && !devices[dk]) {
          const updated: Record<string, { device_id: string }> = {
            ...devices,
            [dk]: { device_id: dk },
          };
          // Best-effort write — don't surface an error if it fails
          await supabase
            .from("users")
            .update({ devices: updated })
            .eq("id", currentUser!.id);
          if (!cancelled) setSessionCount(Object.keys(updated).length);
        } else {
          if (!cancelled) setSessionCount(Math.max(count, 1));
        }
      } catch {
        // Silently ignore load errors — show count as 0
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign out other devices ────────────────────────────────────────────────
  const handleSignOutOthers = useCallback(async () => {
    if (!currentUser?.id) return;
    const supabase = createClient();
    try {
      const dk = deviceKeyRef.current;
      // Keep only the current device in the map; if we can't identify it, clear all.
      const next: Record<string, { device_id: string }> = dk
        ? { [dk]: { device_id: dk } }
        : {};

      const { error } = await supabase
        .from("users")
        .update({ devices: next })
        .eq("id", currentUser.id);

      if (error) {
        addToast("Could not sign out other devices. Please try again.", "error");
        return;
      }

      setSessionCount(Object.keys(next).length || 1);
      addToast("Other devices have been signed out.", "success");
    } catch {
      addToast("An unexpected error occurred. Please try again.", "error");
    }
  }, [currentUser?.id, addToast]);

  // ── 2FA toggle handler ────────────────────────────────────────────────────
  const handleTwoFactorToggle = useCallback(
    async (next: boolean) => {
      const supabase = createClient();

      if (next) {
        // Enroll a new TOTP factor
        try {
          setTwoFactorLoading(true);
          const { data, error } = await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: "Authenticator app",
          });
          if (error || !data) {
            addToast(
              error?.message ?? "Failed to start 2FA setup. Please try again.",
              "error",
            );
            setTwoFactorLoading(false);
            return;
          }
          // Show the enroll modal — do NOT update twoFactor state yet
          // (only mark active after successful verify)
          setEnrollPayload({
            factorId: data.id,
            qrCode: data.totp.qr_code,
            secret: data.totp.secret,
          });
        } catch {
          addToast("An unexpected error occurred. Please try again.", "error");
        } finally {
          setTwoFactorLoading(false);
        }
      } else {
        // Unenroll the existing factor
        if (!mfaFactorId) return;
        const confirmed = window.confirm(
          "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
        );
        if (!confirmed) return;
        try {
          setTwoFactorLoading(true);
          const { error } = await supabase.auth.mfa.unenroll({
            factorId: mfaFactorId,
          });
          if (error) {
            addToast(
              error.message ?? "Failed to disable 2FA. Please try again.",
              "error",
            );
            return;
          }
          setTwoFactor(false);
          setMfaFactorId(null);
          addToast("Two-factor authentication has been disabled.", "info");
        } catch {
          addToast("An unexpected error occurred. Please try again.", "error");
        } finally {
          setTwoFactorLoading(false);
        }
      }
    },
    [mfaFactorId, addToast],
  );

  // ── MFA enroll success ────────────────────────────────────────────────────
  const handleMfaSuccess = useCallback(() => {
    if (enrollPayload) {
      setTwoFactor(true);
      setMfaFactorId(enrollPayload.factorId);
    }
    setEnrollPayload(null);
    addToast("Two-factor authentication is now active.", "success");
  }, [enrollPayload, addToast]);

  const handleMfaCancel = useCallback(async () => {
    // If the user cancels, unenroll the just-created (unverified) factor
    if (enrollPayload) {
      const supabase = createClient();
      // Best-effort cleanup of the pending factor — ignore errors
      await supabase.auth.mfa
        .unenroll({ factorId: enrollPayload.factorId })
        .catch(() => {});
    }
    setEnrollPayload(null);
  }, [enrollPayload]);

  const handleMfaError = useCallback(
    (msg: string) => {
      addToast(msg, "error");
    },
    [addToast],
  );

  // Suppress unused-variable warnings for future preference wiring
  void language;
  void timezone;
  void appearance;

  return (
    <>
      <Head>
        <title>{`Settings | ${generalSettingsTitle}`}</title>
      </Head>

      {/* MFA enroll modal */}
      {enrollPayload && (
        <MfaEnrollPanel
          qrCode={enrollPayload.qrCode}
          secret={enrollPayload.secret}
          factorId={enrollPayload.factorId}
          onSuccess={handleMfaSuccess}
          onCancel={handleMfaCancel}
          onError={handleMfaError}
        />
      )}

      {/* Sessions panel */}
      {showSessionsPanel && (
        <SessionsPanel
          sessionCount={sessionCount}
          onSignOutOthers={handleSignOutOthers}
          onClose={() => setShowSessionsPanel(false)}
        />
      )}

      {/* Toast container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page heading */}
      <div className="mb-6 flex items-baseline gap-3">
        <div>
          <h1 className="text-heading-2 font-display font-bold text-ink-900 mb-1">
            Settings
          </h1>
          <p className="text-body-s text-ink-muted">
            Manage notifications, security, billing and preferences.
          </p>
        </div>
        <SavedIndicator visible={saved} />
      </div>

      <div className="flex flex-col gap-5">
        {/* ── Notifications (persisted) ── */}
        <SettingsCard title="Notifications">
          <SettingRow
            label="Weekly progress report"
            description="Receive a summary of your study activity every week."
            action={
              <Toggle
                checked={weeklyReport}
                onChange={handleWeeklyReport}
                label="Weekly progress report"
              />
            }
          />
          <SettingRow
            label="Study reminders"
            description="Get reminded to study when you have not logged in for a while."
            action={
              <Toggle
                checked={studyReminders}
                onChange={handleStudyReminders}
                label="Study reminders"
              />
            }
          />
          <SettingRow
            label="New mock tests"
            description="Be notified when new practice tests are published."
            action={
              <Toggle
                checked={newMockTests}
                onChange={handleNewMockTests}
                label="New mock tests"
              />
            }
          />
          {false && (
            <SettingRow
              label="Community replies"
              description="Get notified when someone replies to your posts or comments."
              action={
                <Toggle
                  checked={communityReplies}
                  onChange={handleCommunityReplies}
                  label="Community replies"
                />
              }
            />
          )}
          <SettingRow
            label="Product updates"
            description="Learn about new features and improvements to VIT IELTS."
            action={
              <Toggle
                checked={productUpdates}
                onChange={handleProductUpdates}
                label="Product updates"
              />
            }
          />
        </SettingsCard>

        {/* ── Security ── */}
        <SettingsCard title="Security">
          <SettingRow
            label="Password"
            description="Last changed more than 90 days ago."
            action={
              <ActionButton href={ROUTES.ACCOUNT.MY_PROFILE}>
                Change
              </ActionButton>
            }
          />
          <SettingRow
            label="Two-factor authentication"
            description={
              twoFactor
                ? "Your account is protected with an authenticator app."
                : "Add an extra layer of security to your account."
            }
            action={
              <Toggle
                checked={twoFactor}
                onChange={handleTwoFactorToggle}
                label="Two-factor authentication"
                disabled={twoFactorLoading}
              />
            }
          />
          <SettingRow
            label="Active sessions"
            description={
              sessionsLoading
                ? "Loading…"
                : `${sessionCount} ${sessionCount === 1 ? "device" : "devices"} signed in.`
            }
            action={
              <ActionButton
                onClick={() => setShowSessionsPanel(true)}
                disabled={sessionsLoading}
              >
                Manage
              </ActionButton>
            }
          />
        </SettingsCard>

        {/* ── Billing ── */}
        <SettingsCard title="Billing">
          <SettingRow
            label="Current plan"
            description="View your active subscription and available features."
            action={
              <ActionButton href={ROUTES.SUBSCRIPTION}>
                Manage plan
              </ActionButton>
            }
          />
          <SettingRow
            label="Payment method"
            description="Update your saved payment details."
            action={
              <ActionButton href={ROUTES.SUBSCRIPTION}>Update</ActionButton>
            }
          />
          <SettingRow
            label="Invoices"
            description="Download or view your past invoices and receipts."
            action={
              <ActionButton href={ROUTES.ACCOUNT.ORDER_HISTORY}>
                View
              </ActionButton>
            }
          />
        </SettingsCard>

        {/* ── Preferences (persisted — selectors are ValuePill placeholders) ──
            NOTE: Applying language/timezone/appearance (i18n, theming,
            date formatting) is future work; this step only stores the values. */}
        <SettingsCard title="Preferences">
          <SettingRow
            label="Language"
            description="The language used across the platform."
            action={<ValuePill value={initialSettings.language ?? "English"} />}
          />
          <SettingRow
            label="Time zone"
            description="Used for scheduling reminders and reports."
            action={
              <ValuePill
                value={initialSettings.timezone ?? "GMT+7 · Hanoi"}
              />
            }
          />
          <SettingRow
            label="Appearance"
            description="Choose your preferred colour scheme."
            action={
              <ValuePill
                value={
                  initialSettings.appearance === "dark" ? "Dark" : "Light"
                }
              />
            }
          />
        </SettingsCard>
      </div>
    </>
  );
};

PageSettings.Layout = AppShell;
