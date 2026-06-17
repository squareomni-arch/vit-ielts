import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
import { BlankLayout } from "@/widgets/layouts";
import { ROUTES } from "@/shared/routes";
import { createClient } from "~supabase/client";
import { Button } from "@/shared/ui/ds/atoms/button";
import { Input } from "@/shared/ui/ds/atoms/input";

const imgLogoText = "/assets/logos/logo-on-dark.svg";

const EnvelopeIcon = () => (
  <span className="material-symbols-rounded text-[#6a7282] text-[18px] leading-none select-none">
    mail
  </span>
);

type FormData = {
  email: string;
};

export function PageForgotPassword() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async ({ email }: FormData) => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}${ROUTES.RESET_PASSWORD}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError("email", { type: "manual", message: error.message });
      return;
    }
    setSentTo(email);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f4]" data-section="auth-forgot-root">
      <div className="relative flex flex-1 min-h-screen" data-section="auth-forgot-body">
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
                Reset your<br />
                password.
              </h1>
              <p className="font-inter font-normal text-[16px] text-[#dbe0e8] max-w-[340px] leading-[1.6]">
                Enter your email and we'll send you a secure link to create a new password.
              </p>

              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[13px] bg-[#b3e653]">
                  <span className="material-symbols-rounded text-[#191d24] text-[14px] leading-none font-bold select-none">
                    lock
                  </span>
                </span>
                <p className="font-inter font-medium text-[16px] text-[#dbe0e8]">
                  Secure, one-time reset link
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[13px] bg-[#b3e653]">
                  <span className="material-symbols-rounded text-[#191d24] text-[14px] leading-none font-bold select-none">
                    schedule
                  </span>
                </span>
                <p className="font-inter font-medium text-[16px] text-[#dbe0e8]">
                  Link expires after 1 hour
                </p>
              </div>
            </div>

            {/* Bottom spacer to balance vertical layout */}
            <div />
          </div>
        </div>

        {/* Form Area */}
        <div className="flex flex-1 items-center justify-center px-4 py-12 bg-[#f6f7f4]" data-section="form-area">
          <div
            className="bg-white rounded-[28px] shadow-[0px_16px_40px_0px_rgba(0,0,0,0.08)] p-[40px] w-full max-w-[460px] flex flex-col gap-4"
            data-section="auth-card"
          >
            {sentTo ? (
              /* Success state */
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-center w-[56px] h-[56px] rounded-full bg-[#b3e653]/20">
                  <span className="material-symbols-rounded text-[#4f8600] text-[28px] leading-none">
                    mark_email_read
                  </span>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <h2 className="font-display font-bold text-[30px] leading-[1.08] tracking-[-0.6px] text-[#9ad534]">
                    Check your inbox
                  </h2>
                  <p className="font-inter font-normal text-[15px] text-[#6a7282]">
                    We sent a reset link to{" "}
                    <span className="font-semibold text-[#191d24]">{sentTo}</span>.
                    Check your inbox and spam folder.
                  </p>
                </div>

                <div className="bg-[#f6f7f4] rounded-[14px] p-4 flex flex-col gap-[6px]">
                  <p className="font-inter font-semibold text-[13px] text-[#191d24]">
                    Didn't receive it?
                  </p>
                  <p className="font-inter font-normal text-[13px] text-[#6a7282]">
                    Check your spam folder, or wait a minute and try again.
                  </p>
                </div>

                <Link
                  href={ROUTES.LOGIN()}
                  className="font-inter font-bold text-[14px] text-[#9ad534] hover:underline"
                >
                  ← Back to Sign In
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="font-display font-bold text-[30px] leading-[1.08] tracking-[-0.6px] text-[#9ad534]">
                    Forgot password?
                  </h2>
                  <p className="font-inter font-normal text-[15px] text-[#6a7282]">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-[6px]">
                    <label
                      htmlFor="fp-email"
                      className="font-inter font-semibold text-[13px] text-[#191d24]"
                    >
                      Email
                    </label>
                    <Controller
                      control={control}
                      name="email"
                      rules={{
                        required: "Please enter your email",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="fp-email"
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
                        {errors.email.message}
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
                    Send Reset Link
                  </Button>
                </form>

                <div className="flex gap-[5px] items-center text-[14px]">
                  <span className="font-inter font-normal text-[#6a7282]">
                    Remembered your password?
                  </span>
                  <Link
                    href={ROUTES.LOGIN()}
                    className="font-inter font-bold text-[#9ad534] hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
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

PageForgotPassword.Layout = BlankLayout;
