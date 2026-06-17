/**
 * Conversion tracking for successful sign-ups.
 *
 * Fires a single `sign_up_success` event into the GTM dataLayer (so Google Ads
 * conversions can be configured in GTM without code changes) AND the Meta Pixel
 * standard `CompleteRegistration` event (so Facebook Ads can optimise for it).
 *
 * Call this ONLY after a registration genuinely succeeds — never on submit or
 * on validation errors. It is safe to call client-side only; it no-ops on the
 * server and degrades gracefully if GTM / the Pixel haven't loaded yet.
 */

type SignUpMethod = "email" | "google";

interface TrackSignUpArgs {
  method: SignUpMethod;
  /** Stable id (e.g. the new auth user id) used to dedupe the Pixel event. */
  userId?: string;
  /** Optional value passed through to both platforms. */
  value?: number;
  /** Currency for `value`, ISO 4217. Defaults to VND when a value is given. */
  currency?: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackSignUpSuccess({
  method,
  userId,
  value,
  currency = "VND",
}: TrackSignUpArgs): void {
  if (typeof window === "undefined") return;

  // event_id lets the client Pixel event be deduplicated against a future
  // server-side Conversions API event (Phase C) firing the same id.
  const eventId = userId ? `signup_${userId}` : `signup_${Date.now()}`;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "sign_up_success",
      sign_up_method: method,
      ...(value != null ? { value, currency } : {}),
      event_id: eventId,
    });
  } catch {
    /* dataLayer push must never break the auth flow */
  }

  try {
    if (typeof window.fbq === "function") {
      window.fbq(
        "track",
        "CompleteRegistration",
        {
          method,
          ...(value != null ? { value, currency } : {}),
        },
        { eventID: eventId }
      );
    }
  } catch {
    /* Pixel must never break the auth flow */
  }
}
