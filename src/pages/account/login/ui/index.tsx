import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BlankLayout } from "@/widgets/layouts";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { GoogleIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/ds/atoms/button";
import { Input } from "@/shared/ui/ds/atoms/input";
import type { LoginPageConfig } from "@/shared/types/admin-config";

const imgLogoFull = "/assets/logos/logo-on-green.svg";

const TrophyIcon = () => (
  <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28H20M16 23V28M7.25 16H6C4.93913 16 3.92172 15.5786 3.17157 14.8284C2.42143 14.0783 2 13.0609 2 12V10C2 9.73478 2.10536 9.48043 2.29289 9.29289C2.48043 9.10536 2.73478 9 3 9H7M24.75 16H26C27.0609 16 28.0783 15.5786 28.8284 14.8284C29.5786 14.0783 30 13.0609 30 12V10C30 9.73478 29.8946 9.48043 29.7071 9.29289C29.5196 9.10536 29.2652 9 29 9H25M7 6H25V13.8875C25 18.85 21.0313 22.9625 16.0688 23C14.8811 23.0091 13.7034 22.783 12.6035 22.3348C11.5036 21.8865 10.5033 21.225 9.6603 20.3884C8.81728 19.5518 8.14819 18.5565 7.6916 17.4601C7.23502 16.3637 6.99997 15.1877 7 14V6Z" stroke="#191d24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Icon helpers (Material Symbols Rounded via className) ── */
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
const EnvelopeIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    mail
  </span>
);
const LockIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    lock
  </span>
);

type FormData = {
  email: string;
  password: string;
};

interface PageLoginProps {
  loginConfig?: LoginPageConfig;
}

export function PageLogin({ loginConfig: _loginConfig }: PageLoginProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    await signIn({
      email: data.email,
      password: data.password,
    }).catch(() => {
      setError("email", {
        type: "manual",
        message: "Email hoặc mật khẩu không đúng.",
      });
    });
  };

  return (
    /* === SECTION: Page Root === */
    <div
      className="flex flex-col min-h-screen bg-[#f6f7f4]"
      data-section="auth-login-root"
    >
      {/* === SECTION: Body (Brand Panel + Form Area) === */}
      <div
        className="relative flex flex-1 min-h-screen"
        data-section="auth-login-body"
      >
        {/* Green bleed — extends brand colour to left screen edge on wide viewports */}
        <div className="hidden md:block absolute inset-y-0 left-0 right-1/2 bg-[#b3e653]" aria-hidden="true" />

        {/* Decoration blobs — clipped within exact left-half boundary (md+ only) */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-1/2 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
          <div className="absolute right-[-40px] top-[-104px] w-[360px] h-[360px] rounded-full bg-white/20" />
          <div className="absolute left-[-100px] bottom-[-20px] w-[251px] h-[251px] rounded-full bg-white/20" />
        </div>

        {/* === SECTION: Brand Panel === */}
        <div
          className="hidden md:flex flex-1 flex-col bg-[#b3e653] relative"
          data-section="brand-panel"
        >
          {/* Content constrained, right-aligned toward form */}
          <div className="relative z-10 flex flex-col justify-between h-full py-[10vh] px-[60px] w-full max-w-[var(--max-width-container-md)] ml-auto">
          {/* Logo */}
          <div>
            <img
              src={imgLogoFull}
              alt="VitIELTS Logo"
              className="h-auto w-full max-w-[480px]"
            />
          </div>

          {/* Headline + tagline */}
          <div className="flex flex-col gap-5 max-w-[520px]">
            <h1 className="font-display font-bold text-[46px] leading-[1.08] tracking-[-0.92px] text-[#191d24]">
              Welcome back.<br />
              Keep your streak going.
            </h1>
            <p className="font-inter font-normal text-[17px] leading-normal text-[#33421a]">
              Pick up right where you left off — your tests, scores and study
              plan are all saved.
            </p>
          </div>

          {/* Card · Band 7.5 */}
          <div
            className="flex items-center gap-4 bg-white rounded-[20px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.1)] px-5 h-[92px] w-[330px]"
            data-section="band-card"
          >
            <TrophyIcon />
            <div className="flex flex-col gap-[2px]">
              <p className="font-inter font-bold text-[15px] text-[#191d24] whitespace-nowrap">
                Band 7.5 — last mock
              </p>
              <p className="font-inter font-normal text-[13px] text-[#6a7282] whitespace-nowrap">
                +1.5 since you started
              </p>
            </div>
          </div>
          </div>{/* end inner content */}
        </div>

        {/* === SECTION: Form Area === */}
        <div
          className="flex flex-1 items-center justify-center px-4 py-12 bg-[#f6f7f4]"
          data-section="form-area"
        >
          {/* Card · Auth Form */}
          <div
            className="bg-white rounded-[28px] shadow-[0px_16px_40px_0px_rgba(0,0,0,0.08)] p-[40px] w-full max-w-[460px] flex flex-col gap-4"
            data-section="auth-card"
          >
            {/* Title + subtitle */}
            <h2 className="font-display font-bold text-[32px] leading-[1.08] tracking-[-0.64px] text-[#9ad534]">
              Log in
            </h2>
            <p className="font-inter font-normal text-[15px] text-[#6a7282]">
              Welcome back — let&apos;s get practising.
            </p>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* === Email === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="login-email"
                  className="font-inter font-semibold text-[13px] text-[#191d24]"
                >
                  Email
                </label>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      size="lg"
                      autoComplete="email"
                      placeholder="you@email.com"
                      leftIcon={<EnvelopeIcon />}
                      error={!!errors.email}
                      fullWidth
                    />
                  )}
                />
                {errors.email && (
                  <span className="font-inter text-[12px] text-[#e54552]">
                    {errors.email.message || "Vui lòng nhập email"}
                  </span>
                )}
              </div>

              {/* === Password === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="login-password"
                  className="font-inter font-semibold text-[13px] text-[#191d24]"
                >
                  Password
                </label>
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      size="lg"
                      placeholder="••••••••"
                      leftIcon={<LockIcon />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
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
                    Vui lòng nhập mật khẩu
                  </span>
                )}
              </div>

              {/* === Forgot password === */}
              <div>
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="font-inter font-semibold text-[13px] text-[#9ad534] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* === Submit === */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting || isLoading}
                disabled={isSubmitting || isLoading}
              >
                Log in
              </Button>
            </form>

            {/* === Divider "or" === */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-[rgba(25,29,36,0.1)]" />
              <span className="font-inter font-medium text-[12px] text-[#6a7282]">
                or
              </span>
              <div className="flex-1 h-px bg-[rgba(25,29,36,0.1)]" />
            </div>

            {/* === Google button === */}
            <Button
              type="button"
              variant="outlined"
              size="md"
              fullWidth
              disabled={isLoading || isSubmitting}
              onClick={handleGoogleLogin}
              leftIcon={<GoogleIcon />}
            >
              Continue with Google
            </Button>

            {/* === Register link === */}
            <div className="flex gap-[5px] items-center text-[14px]">
              <span className="font-inter font-normal text-[#6a7282]">
                New here?
              </span>
              <Link
                href={ROUTES.REGISTER}
                className="font-inter font-bold text-[#9ad534] hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION: Footer === */}
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
            Smarter IELTS preparation for ambitious learners. Practice, track,
            improve — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 md:contents">
        <div className="flex flex-col gap-[10px]">
          <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">
            LEARN
          </p>
          <div className="h-1" />
          {["Listening", "Reading", "Writing", "Speaking"].map((item) => (
            <p
              key={item}
              className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]"
            >
              {item}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-[10px]">
          <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">
            RESOURCES
          </p>
          <div className="h-1" />
          {["Mock tests", "Vocabulary", "Blog", "Band guide"].map((item) => (
            <p
              key={item}
              className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]"
            >
              {item}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-[10px]">
          <p className="font-inter font-bold text-[12px] tracking-[0.96px] text-white">
            COMPANY
          </p>
          <div className="h-1" />
          {["About", "Teachers", "Pricing", "Contact"].map((item) => (
            <p
              key={item}
              className="font-inter font-normal text-[14px] leading-[1.4] text-[#6a7282]"
            >
              {item}
            </p>
          ))}
        </div>
        </div>
      </footer>
    </div>
  );
}

PageLogin.Layout = BlankLayout;
