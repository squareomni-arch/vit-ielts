import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthLayout } from "@/widgets/layouts";
import { HeroBanner } from "@/shared/ui/ds/organisms/hero-banner";
import { ROUTES } from "@/shared/routes";
import { createClient } from "~supabase/client";

type FormData = {
  password: string;
  confirmPassword: string;
};

type Stage = "verifying" | "ready" | "invalid" | "success";

export function PageResetPassword() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("verifying");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  // 1) Establish the recovery session from the URL the user landed on.
  //    Supabase PKCE flow puts a `?code=...` on the redirect URL; we exchange
  //    it for a session so `supabase.auth.updateUser({ password })` is allowed.
  //    Older flows put the tokens in the hash — `detectSessionInUrl: true`
  //    on the client picks those up automatically.
  useEffect(() => {
    if (!router.isReady) return;
    const supabase = createClient();
    let cancelled = false;

    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash") || params.get("token");
      const otpType = params.get("type"); // expected "recovery"
      const errParam = params.get("error_description") || params.get("error");

      if (errParam) {
        if (!cancelled) {
          setErrorMsg(decodeURIComponent(errParam));
          setStage("invalid");
        }
        return;
      }

      // OTP / token-hash flow — works cross-device because verification is
      // server-side and doesn't rely on a code_verifier in localStorage.
      if (tokenHash && otpType === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (cancelled) return;
        if (error) {
          setErrorMsg(error.message);
          setStage("invalid");
          return;
        }
        setStage("ready");
        return;
      }

      // PKCE flow — only works on the same browser that initiated the request.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          // The Supabase client may have already exchanged the code in the
          // background; check for an active session before declaring failure.
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            setErrorMsg(error.message);
            setStage("invalid");
            return;
          }
        }
        setStage("ready");
        return;
      }

      // No code on URL — maybe the hash-based flow already created a session.
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data?.user) {
        setStage("ready");
      } else {
        setErrorMsg("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        setStage("invalid");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [router.isReady]);

  const onSubmit = async ({ password }: FormData) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("password", { type: "manual", message: error.message });
      return;
    }
    // Sign the user out of the recovery session so they re-authenticate
    // with the new password.
    await supabase.auth.signOut();
    setStage("success");
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <HeroBanner
        title="Đặt lại mật khẩu"
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "Đăng nhập & Đăng ký", href: ROUTES.LOGIN() },
          { label: "Đặt lại mật khẩu" },
        ]}
      />

      <div className="w-full flex justify-center py-[130px] relative z-30 px-4 max-w-7xl">
        <div className="w-[562px] bg-white rounded-[32px] shadow-[0px_2px_10px_rgba(0,0,0,0.5)] flex flex-col items-center py-8 px-6 sm:px-[64px]">
          <h2 className="font-noto-sans font-bold text-[32px] leading-[39px] text-center text-[#D94A56] mb-[24px]">
            Đặt lại mật khẩu
          </h2>

          {stage === "verifying" && (
            <p className="font-noto-sans text-[14px] text-[#374151]">
              Đang xác thực link...
            </p>
          )}

          {stage === "invalid" && (
            <div className="w-full flex flex-col gap-4 text-center">
              <p className="font-noto-sans text-[14px] text-red-500">
                {errorMsg || "Link không hợp lệ."}
              </p>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="font-noto-sans font-medium text-[14px] text-[#D94A56] hover:underline"
              >
                Gửi lại link đặt lại mật khẩu
              </Link>
            </div>
          )}

          {stage === "success" && (
            <div className="w-full flex flex-col gap-4 text-center">
              <p className="font-noto-sans text-[16px] text-[#374151]">
                Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.
              </p>
              <Link
                href={ROUTES.LOGIN()}
                className="w-full h-[55px] flex justify-center items-center bg-[#D94A56] rounded-[10px] hover:bg-[#E3636E] transition-colors"
              >
                <span className="font-noto-sans font-bold text-[18px] text-white">
                  Đăng nhập
                </span>
              </Link>
            </div>
          )}

          {stage === "ready" && (
            <form
              className="w-full flex flex-col gap-[24px]"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="w-full flex flex-col items-start gap-[10px]">
                <label
                  htmlFor="password"
                  className="font-noto-sans font-bold text-[16px] text-[#191D24]"
                >
                  Mật khẩu mới
                </label>
                <div className="w-full relative">
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: "Vui lòng nhập mật khẩu mới",
                      minLength: {
                        value: 6,
                        message: "Mật khẩu tối thiểu 6 ký tự",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Nhập mật khẩu mới"
                        className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] pl-[18px] pr-[40px] font-noto-sans text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#71717A] text-xs"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-sm">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="w-full flex flex-col items-start gap-[10px]">
                <label
                  htmlFor="confirmPassword"
                  className="font-noto-sans font-bold text-[16px] text-[#191D24]"
                >
                  Xác nhận mật khẩu
                </label>
                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (v) =>
                      v === watch("password") || "Mật khẩu xác nhận không khớp",
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] px-[18px] font-noto-sans text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <span className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[55px] flex justify-center items-center py-3 px-3 bg-[#D94A56] rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] hover:bg-[#E3636E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                <span className="font-noto-sans font-bold text-[20px] text-white">
                  {isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

PageResetPassword.Layout = AuthLayout;
