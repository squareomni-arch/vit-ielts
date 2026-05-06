import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
import { AuthLayout } from "@/widgets/layouts";
import { HeroBanner } from "@/shared/ui/ds/organisms/hero-banner";
import { ROUTES } from "@/shared/routes";
import { createClient } from "~supabase/client";

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
    <div className="flex flex-col min-h-screen items-center bg-white">
      <HeroBanner
        title="Quên mật khẩu"
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "Đăng nhập & Đăng ký", href: ROUTES.LOGIN() },
          { label: "Quên mật khẩu" },
        ]}
      />

      <div className="w-full flex justify-center py-[130px] relative z-30 px-4 max-w-7xl">
        <div className="w-[562px] bg-white rounded-[32px] shadow-[0px_2px_10px_rgba(0,0,0,0.5)] flex flex-col items-center py-8 px-6 sm:px-[64px]">
          <h2 className="font-noto-sans font-bold text-[32px] leading-[39px] text-center text-[#D94A56] mb-[20px]">
            Quên mật khẩu
          </h2>

          {sentTo ? (
            <div className="w-full flex flex-col gap-6 text-center">
              <p className="font-noto-sans text-[16px] leading-[22px] text-[#374151]">
                Chúng tôi đã gửi link đặt lại mật khẩu đến{" "}
                <span className="font-bold text-[#191D24]">{sentTo}</span>.
                <br />
                Vui lòng kiểm tra hộp thư (kể cả Spam) và bấm vào link để tiếp tục.
              </p>
              <Link
                href={ROUTES.LOGIN()}
                className="font-noto-sans font-medium text-[16px] text-[#D94A56] hover:underline"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <p className="font-noto-sans text-[14px] leading-[20px] text-[#374151] text-center mb-[24px]">
                Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
              </p>

              <form
                className="w-full flex flex-col gap-[24px]"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="w-full flex flex-col items-start gap-[10px]">
                  <label
                    htmlFor="email"
                    className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]"
                  >
                    Email
                  </label>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: "Vui lòng nhập email",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Email không hợp lệ",
                      },
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="example@email.com"
                        className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] px-[18px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                      />
                    )}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-sm">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[55px] flex justify-center items-center py-3 px-3 bg-[#D94A56] rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] hover:bg-[#E3636E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  <span className="font-noto-sans font-bold text-[20px] leading-[24px] text-white">
                    {isSubmitting ? "Đang gửi..." : "Gửi link đặt lại"}
                  </span>
                </button>
              </form>

              <div className="w-full text-center mt-[24px]">
                <span className="font-noto-sans font-medium text-[14px] text-[#374151]">
                  Đã nhớ mật khẩu?{" "}
                </span>
                <Link
                  href={ROUTES.LOGIN()}
                  className="font-noto-sans font-medium text-[14px] text-[#D94A56] hover:underline"
                >
                  Đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

PageForgotPassword.Layout = AuthLayout;
