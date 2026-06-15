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

/* ── Figma asset: Decoration blobs (temporary remote URLs, expires ~7 days) ── */
const imgDecorationTop =
  "https://www.figma.com/api/mcp/asset/9ac236a3-c745-4ad6-98dd-b1faa9a5568c";
const imgDecorationBottom =
  "https://www.figma.com/api/mcp/asset/0dd2a09a-0301-4ed1-9274-438deab9261b";
const imgLogoFull = "/assets/logos/logo-on-green.svg";
const imgTrophy =
  "https://www.figma.com/api/mcp/asset/2175c9aa-8033-4dc5-8005-ab4f3c1df65c";

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
        className="relative flex flex-1 min-h-screen justify-center"
        data-section="auth-login-body"
      >
        {/* Green bleed — extends brand colour to left screen edge on wide viewports */}
        <div className="absolute inset-y-0 left-0 right-1/2 bg-[#b3e653]" aria-hidden="true" />

        {/* Content capped at design-system container-2xl, centered */}
        <div className="relative z-10 flex w-full">

        {/* === SECTION: Brand Panel === */}
        <div
          className="hidden md:flex flex-1 flex-col justify-between px-[8%] py-[100px] bg-[#b3e653] relative overflow-hidden"
          data-section="brand-panel"
        >
          {/* Decoration blobs */}
          <img
            src={imgDecorationTop}
            alt=""
            aria-hidden="true"
            className="absolute right-[-40px] top-[-104px] w-[360px] h-[360px] pointer-events-none"
          />
          <img
            src={imgDecorationBottom}
            alt=""
            aria-hidden="true"
            className="absolute left-[-100px] bottom-[-20px] w-[251px] h-[251px] pointer-events-none"
          />

          {/* Logo */}
          <div className="relative z-10">
            <img
              src={imgLogoFull}
              alt="VitIELTS Logo"
              className="h-auto w-full max-w-[320px]"
            />
          </div>

          {/* Headline + tagline */}
          <div className="relative z-10 flex flex-col gap-5 max-w-[520px]">
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
            className="relative z-10 flex items-center gap-4 bg-white rounded-[20px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.1)] px-5 h-[92px] w-[330px]"
            data-section="band-card"
          >
            <img
              src={imgTrophy}
              alt=""
              aria-hidden="true"
              className="w-[34px] h-[34px] shrink-0"
            />
            <div className="flex flex-col gap-[2px]">
              <p className="font-inter font-bold text-[15px] text-[#191d24] whitespace-nowrap">
                Band 7.5 — last mock
              </p>
              <p className="font-inter font-normal text-[13px] text-[#6a7282] whitespace-nowrap">
                +1.5 since you started
              </p>
            </div>
          </div>
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
            {false && (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-[rgba(25,29,36,0.1)]" />
                <span className="font-inter font-medium text-[12px] text-[#6a7282]">
                  or
                </span>
                <div className="flex-1 h-px bg-[rgba(25,29,36,0.1)]" />
              </div>
            )}

            {/* === Google button === */}
            {false && (
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
            )}

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
        </div>{/* end max-width wrapper */}
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
