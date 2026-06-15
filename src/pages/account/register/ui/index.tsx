import { useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { BlankLayout } from "@/widgets/layouts";
import { useAppContext, useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { toast } from "react-toastify";
import { GoogleIcon } from "@/shared/ui/icons";
import { Button } from "@/shared/ui/ds/atoms/button";
import { Input } from "@/shared/ui/ds/atoms/input";
import type { RegisterPageConfig } from "@/shared/types/admin-config";

const imgLogoText = "/assets/logos/logo-on-dark.svg";

const TrophyIcon = () => (
  <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28H20M16 23V28M7.25 16H6C4.93913 16 3.92172 15.5786 3.17157 14.8284C2.42143 14.0783 2 13.0609 2 12V10C2 9.73478 2.10536 9.48043 2.29289 9.29289C2.48043 9.10536 2.73478 9 3 9H7M24.75 16H26C27.0609 16 28.0783 15.5786 28.8284 14.8284C29.5786 14.0783 30 13.0609 30 12V10C30 9.73478 29.8946 9.48043 29.7071 9.29289C29.5196 9.10536 29.2652 9 29 9H25M7 6H25V13.8875C25 18.85 21.0313 22.9625 16.0688 23C14.8811 23.0091 13.7034 22.783 12.6035 22.3348C11.5036 21.8865 10.5033 21.225 9.6603 20.3884C8.81728 19.5518 8.14819 18.5565 7.6916 17.4601C7.23502 16.3637 6.99997 15.1877 7 14V6Z" stroke="#b3e653" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
const UserIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    person
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

const FEATURES = [
  "920+ real mock tests, free to start",
  "Instant band scores & analytics",
  "Feedback from expert teachers",
  "A study plan built around your goal",
];

const BAND_OPTIONS = ["Band 6.5", "Band 7.0", "Band 7.5", "Band 8.0"];

type FormData = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
};

interface PageRegisterProps {
  registerConfig?: RegisterPageConfig;
  totalTests?: number;
}

export function PageRegister({ registerConfig: _registerConfig, totalTests = 920 }: PageRegisterProps) {
  const { masterData: _masterData } = useAppContext();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<FormData>();

  const passwordValue = watch("password");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedBand, setSelectedBand] = useState("Band 7.5");
  const submittingRef = useRef(false);

  const features = [
    `${totalTests}+ real mock tests, free to start`,
    "Instant band scores & analytics",
    "Feedback from expert teachers",
    "A study plan built around your goal",
  ];

  const onSubmit = async (data: FormData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created successfully!");
      // signUp already creates the auth session, just sign in to set cookie & redirect
      await signIn({ email: data.email, password: data.password });
    } catch (err: any) {
      setIsLoading(false);
      submittingRef.current = false;
      const message = err?.message || "Registration failed. Please try again.";
      setError("email", {
        type: "manual",
        message,
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    /* === SECTION: Page Root === */
    <div
      className="flex flex-col min-h-screen bg-[#f6f7f4]"
      data-section="auth-register-root"
    >
      {/* === SECTION: Body (Brand Panel + Form Area) === */}
      <div
        className="relative flex flex-1 min-h-screen"
        data-section="auth-register-body"
      >
        {/* Dark bleed — fills left half of viewport edge-to-edge (brand side, md+ only) */}
        <div className="hidden md:block absolute inset-y-0 left-0 right-1/2 bg-[#191d24]" aria-hidden="true" />

        {/* Decoration blobs — clipped within exact left-half boundary (md+ only) */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-1/2 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
          <div className="absolute right-[-40px] top-[-104px] w-[320px] h-[320px] rounded-full bg-white/10" />
          <div className="absolute left-[-157px] bottom-[-60px] w-[401px] h-[401px] rounded-full bg-white/10" />
        </div>

        {/* === SECTION: Brand Panel (dark) === */}
        <div
          className="hidden md:flex flex-1 flex-col bg-[#191d24] relative"
          data-section="brand-panel"
        >

          {/* Content constrained to container-md, right-aligned toward form */}
          <div className="relative z-10 flex flex-col justify-between h-full py-[10vh] px-[60px] w-full max-w-[var(--max-width-container-md)] ml-auto">
            {/* Logo */}
            <img
              src={imgLogoText}
              alt="VitIELTS"
              className="h-auto w-full max-w-[480px]"
            />

            {/* Headline + feature bullets */}
            <div className="flex flex-col gap-[26px]">
              <h1 className="font-display font-bold text-[46px] leading-[1.08] tracking-[-0.92px] text-white">
                Start your<br />
                Band 8.0 journey.
              </h1>

              {features.map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[13px] bg-[#b3e653]">
                    <span className="material-symbols-rounded text-[#191d24] text-[14px] leading-none font-bold select-none">
                      check
                    </span>
                  </span>
                  <p className="font-inter font-medium text-[16px] text-[#dbe0e8]">
                    {feat}
                  </p>
                </div>
              ))}
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
            <h2 className="font-display font-bold text-[30px] leading-[1.08] tracking-[-0.6px] text-[#9ad534]">
              Create account
            </h2>
            <p className="font-inter font-normal text-[15px] text-[#6a7282]">
              Free forever. No card required.
            </p>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* === Full name === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="register-name"
                  className="font-inter font-semibold text-[13px] text-[#191d24]"
                >
                  Full name
                </label>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="register-name"
                      type="text"
                      size="lg"
                      placeholder="Your name"
                      leftIcon={<UserIcon />}
                      error={!!errors.name}
                      fullWidth
                    />
                  )}
                />
                {errors.name && (
                  <span className="font-inter text-[12px] text-[#e54552]">
                    Please enter your full name
                  </span>
                )}
              </div>

              {/* === Email === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="register-email"
                  className="font-inter font-semibold text-[13px] text-[#191d24]"
                >
                  Email
                </label>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: { value: true, message: "Email is required" },
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email",
                    },
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="register-email"
                      type="text"
                      size="lg"
                      placeholder="you@email.com"
                      leftIcon={<EnvelopeIcon />}
                      error={!!errors.email}
                      fullWidth
                    />
                  )}
                />
                {errors.email && (
                  <span className="font-inter text-[12px] text-[#e54552]">
                    {errors.email.message || "Please enter your email"}
                  </span>
                )}
              </div>

              {/* === Password === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="register-password"
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
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      size="lg"
                      placeholder="Create a password"
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
                    Please enter a password
                  </span>
                )}
              </div>

              {/* === Confirm Password === */}
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="register-confirm-password"
                  className="font-inter font-semibold text-[13px] text-[#191d24]"
                >
                  Confirm password
                </label>
                <Controller
                  control={control}
                  name="confirm_password"
                  rules={{
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === passwordValue || "Passwords do not match",
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      size="lg"
                      placeholder="Repeat your password"
                      leftIcon={<LockIcon />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="flex items-center justify-center p-0 bg-transparent border-none cursor-pointer leading-none"
                        >
                          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      }
                      error={!!errors.confirm_password}
                      fullWidth
                    />
                  )}
                />
                {errors.confirm_password && (
                  <span className="font-inter text-[12px] text-[#e54552]">
                    {errors.confirm_password.message}
                  </span>
                )}
              </div>

              {/* === Target band (decorative UI toggle, no backend impact) === */}
              <div className="flex flex-col gap-[10px]">
                <label className="font-inter font-semibold text-[13px] text-[#191d24]">
                  Target band
                </label>
                <div className="flex items-center justify-between gap-2">
                  {BAND_OPTIONS.map((band) => {
                    const isSelected = selectedBand === band;
                    return (
                      <button
                        key={band}
                        type="button"
                        onClick={() => setSelectedBand(band)}
                        className={[
                          "flex-1 h-[38px] flex items-center justify-center rounded-[100px]",
                          "font-inter font-bold text-[13px] text-[#191d24]",
                          "transition-colors cursor-pointer border",
                          isSelected
                            ? "bg-[#b3e653] border-[#b3e653]"
                            : "bg-white border-[rgba(25,29,36,0.1)] hover:border-[rgba(25,29,36,0.2)]",
                        ].join(" ")}
                      >
                        {band}
                      </button>
                    );
                  })}
                </div>
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
                Create account
              </Button>
            </form>

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

            {/* === Login link === */}
            <div className="flex gap-[5px] items-center text-[14px]">
              <span className="font-inter font-normal text-[#6a7282]">
                Already have an account?
              </span>
              <Link
                href={ROUTES.LOGIN()}
                className="font-inter font-bold text-[#9ad534] hover:underline"
              >
                Log in
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

PageRegister.Layout = BlankLayout;
