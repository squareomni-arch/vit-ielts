import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";
import { BlankLayout } from "@/widgets/layouts";
import { ROUTES } from "@/shared/routes";
import { createClient } from "~supabase/client";
import { Button } from "@/shared/ui/ds/atoms/button";
import { Input } from "@/shared/ui/ds/atoms/input";

const imgLogoText = "/assets/logos/logo-on-dark.svg";

const LockIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    lock
  </span>
);
const EyeIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    visibility
  </span>
);
const EyeOffIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    visibility_off
  </span>
);

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
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  useEffect(() => {
    if (!router.isReady) return;
    const supabase = createClient();
    let cancelled = false;

    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash") || params.get("token");
      const otpType = params.get("type");
      const errParam = params.get("error_description") || params.get("error");

      if (errParam) {
        if (!cancelled) {
          setErrorMsg(decodeURIComponent(errParam));
          setStage("invalid");
        }
        return;
      }

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

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
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

      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data?.user) {
        setStage("ready");
      } else {
        setErrorMsg("The password reset link is invalid or has expired.");
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
    await supabase.auth.signOut();
    setStage("success");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f4]" data-section="auth-reset-root">
      <div className="relative flex flex-1 min-h-screen" data-section="auth-reset-body">
        {/* Dark bleed left half */}
        <div className="hidden md:block absolute inset-y-0 left-0 right-1/2 bg-[#191d24]" aria-hidden="true" />

        {/* Decoration blobs */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-1/2 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
          <div className="absolute right-[-40px] top-[-104px] w-[320px] h-[320px] rounded-full bg-white/10" />
          <div className="absolute left-[-157px] bottom-[-60px] w-[401px] h-[401px] rounded-full bg-white/10" />
        </div>

        {/* Brand Panel */}
        <div className="hidden md:flex flex-1 flex-col bg-[#191d24] relative" data-section="brand-panel">
          <div className="relative z-10 flex flex-col justify-between h-full py-[10vh] px-[60px] w-full max-w-[var(--max-width-container-md)] ml-auto">
            <img src={imgLogoText} alt="VitIELTS" className="h-auto w-full max-w-[480px]" />

            <div className="flex flex-col gap-[26px]">
              <h1 className="font-display font-bold text-[46px] leading-[1.08] tracking-[-0.92px] text-white">
                Create a new<br />
                password.
              </h1>
              <p className="font-inter font-normal text-[16px] text-[#dbe0e8] max-w-[340px] leading-[1.6]">
                Choose a strong password to keep your account secure.
              </p>

              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[13px] bg-[#b3e653]">
                  <span className="material-symbols-rounded text-[#191d24] text-[14px] leading-none font-bold select-none">
                    check
                  </span>
                </span>
                <p className="font-inter font-medium text-[16px] text-[#dbe0e8]">
                  At least 6 characters
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[13px] bg-[#b3e653]">
                  <span className="material-symbols-rounded text-[#191d24] text-[14px] leading-none font-bold select-none">
                    check
                  </span>
                </span>
                <p className="font-inter font-medium text-[16px] text-[#dbe0e8]">
                  Keep it unique and hard to guess
                </p>
              </div>
            </div>

            <div />
          </div>
        </div>

        {/* Form Area */}
        <div className="flex flex-1 items-center justify-center px-4 py-12 bg-[#f6f7f4]" data-section="form-area">
          <div
            className="bg-white rounded-[28px] shadow-[0px_16px_40px_0px_rgba(0,0,0,0.08)] p-[40px] w-full max-w-[460px] flex flex-col gap-4"
            data-section="auth-card"
          >
            {stage === "verifying" && (
              <div className="flex flex-col gap-4 items-center py-6">
                <span className="material-symbols-rounded text-[#6a7282] text-[40px] animate-spin" style={{ animationDuration: "1s" }}>
                  progress_activity
                </span>
                <p className="font-inter text-[15px] text-[#6a7282]">Verifying your link…</p>
              </div>
            )}

            {stage === "invalid" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-[#e54552]/10">
                  <span className="material-symbols-rounded text-[#e54552] text-[28px] leading-none">
                    error
                  </span>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="font-display font-bold text-[28px] leading-[1.08] tracking-[-0.56px] text-[#191d24]">
                    Link expired
                  </h2>
                  <p className="font-inter font-normal text-[15px] text-[#6a7282]">
                    {errorMsg || "This reset link is invalid or has expired."}
                  </p>
                </div>
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="inline-flex"
                >
                  <Button variant="primary" size="md" fullWidth>
                    Request a new link
                  </Button>
                </Link>
                <Link
                  href={ROUTES.LOGIN()}
                  className="font-inter font-bold text-[14px] text-[#9ad534] hover:underline"
                >
                  ← Back to Sign In
                </Link>
              </div>
            )}

            {stage === "success" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-[#b3e653]/20">
                  <span className="material-symbols-rounded text-[#4f8600] text-[28px] leading-none">
                    check_circle
                  </span>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="font-display font-bold text-[30px] leading-[1.08] tracking-[-0.6px] text-[#9ad534]">
                    Password updated!
                  </h2>
                  <p className="font-inter font-normal text-[15px] text-[#6a7282]">
                    Your password has been reset. Sign in with your new password.
                  </p>
                </div>
                <Link href={ROUTES.LOGIN()} className="inline-flex">
                  <Button variant="primary" size="md" fullWidth>
                    Sign in
                  </Button>
                </Link>
              </div>
            )}

            {stage === "ready" && (
              <>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="font-display font-bold text-[30px] leading-[1.08] tracking-[-0.6px] text-[#9ad534]">
                    New password
                  </h2>
                  <p className="font-inter font-normal text-[15px] text-[#6a7282]">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-[6px]">
                    <label
                      htmlFor="rp-password"
                      className="font-inter font-semibold text-[13px] text-[#191d24]"
                    >
                      New password
                    </label>
                    <Controller
                      control={control}
                      name="password"
                      rules={{
                        required: "Please enter a new password",
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="rp-password"
                          type={showPassword ? "text" : "password"}
                          size="lg"
                          placeholder="Enter new password"
                          leftIcon={<LockIcon />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="flex items-center justify-center p-0 bg-transparent border-none cursor-pointer leading-none"
                            >
                              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          }
                          error={!!errors.password}
                          fullWidth
                        />
                      )}
                    />
                    {errors.password && (
                      <span className="font-inter text-[12px] text-[#e54552]">
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-[6px]">
                    <label
                      htmlFor="rp-confirm"
                      className="font-inter font-semibold text-[13px] text-[#191d24]"
                    >
                      Confirm password
                    </label>
                    <Controller
                      control={control}
                      name="confirmPassword"
                      rules={{
                        required: "Please confirm your password",
                        validate: (v) => v === watch("password") || "Passwords do not match",
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="rp-confirm"
                          type={showConfirm ? "text" : "password"}
                          size="lg"
                          placeholder="Repeat new password"
                          leftIcon={<LockIcon />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowConfirm((v) => !v)}
                              aria-label={showConfirm ? "Hide password" : "Show password"}
                              className="flex items-center justify-center p-0 bg-transparent border-none cursor-pointer leading-none"
                            >
                              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          }
                          error={!!errors.confirmPassword}
                          fullWidth
                        />
                      )}
                    />
                    {errors.confirmPassword && (
                      <span className="font-inter text-[12px] text-[#e54552]">
                        {errors.confirmPassword.message}
                      </span>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="bg-[#191d24] flex flex-col gap-10 md:flex-row md:items-start md:justify-between px-6 sm:px-10 lg:px-[90px] py-12 lg:py-[48px] shrink-0 w-full"
        data-section="auth-footer"
      >
        <div className="flex flex-col gap-[14px]">
          <div className="flex items-center font-display font-bold text-[19px] leading-[1.3]">
            <span className="text-white">VIT</span>
            <span className="text-[#9ad534]">IELTS</span>
          </div>
          <p className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282] max-w-[280px]">
            Smarter IELTS preparation for ambitious learners. Practice, track, improve — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 md:contents">
          <div className="flex flex-col gap-[10px]">
            <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">LEARN</p>
            <div className="h-1" />
            {["Listening", "Reading", "Writing", "Speaking"].map((item) => (
              <p key={item} className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">{item}</p>
            ))}
          </div>
          <div className="flex flex-col gap-[10px]">
            <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">RESOURCES</p>
            <div className="h-1" />
            {["Mock tests", "Vocabulary", "Blog", "Band guide"].map((item) => (
              <p key={item} className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">{item}</p>
            ))}
          </div>
          <div className="flex flex-col gap-[10px]">
            <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">COMPANY</p>
            <div className="h-1" />
            {["About", "Teachers", "Pricing", "Contact"].map((item) => (
              <p key={item} className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]">{item}</p>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

PageResetPassword.Layout = BlankLayout;
