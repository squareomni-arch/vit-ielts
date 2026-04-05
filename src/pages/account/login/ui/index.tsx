import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { GoogleIcon } from "@/shared/ui/icons";
import { HeroBanner } from "@/shared/ui/ds/organisms/hero-banner";
import type { LoginPageConfig } from "@/shared/types/admin-config";

type FormData = {
  email: string;
  password: string;
};

interface PageLoginProps {
  loginConfig?: LoginPageConfig;
}

export function PageLogin({ loginConfig }: PageLoginProps) {
  const router = useRouter();
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
        message: "Số điện thoại / email hoặc mật khẩu không đúng.",
      });
    });
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      {/* Hero Banner Section */}
      <HeroBanner
        title="Đăng nhập & Đăng ký"
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "Đăng nhập & Đăng ký", href: ROUTES.LOGIN() },
          { label: "Đăng nhập" },
        ]}
      />

      {/* Login Box */}
      <div className="w-full flex justify-center py-[130px] relative z-30 px-4 max-w-7xl">
        <div className="w-[562px] bg-white rounded-[32px] shadow-[0px_2px_10px_rgba(0,0,0,0.5)] flex flex-col items-center py-8 px-6 sm:px-[64px]">
          <h2 className="font-noto-sans font-bold text-[32px] leading-[39px] text-center text-[#D94A56] mb-[30px]">
            Đăng Nhập
          </h2>

          <form className="w-full flex flex-col gap-[30px]" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="w-full flex flex-col gap-[10px]">
              {/* Phone Number / Email */}
              <div className="w-full flex flex-col items-start gap-[10px]">
                <label htmlFor="email" className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]">
                  Số điện thoại
                </label>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      id="email"
                      type="text"
                      placeholder="Nhập số điện thoại của bạn"
                      className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] px-[18px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                    />
                  )}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email.message || "Vui lòng nhập số điện thoại hoặc email"}</span>
                )}
              </div>

              {/* Password */}
              <div className="w-full flex flex-col items-start gap-[10px]">
                <label htmlFor="password" className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]">
                  Mật khẩu
                </label>
                <div className="w-full relative">
                  <Controller
                    control={control}
                    name="password"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu của bạn"
                        className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] pl-[18px] pr-[40px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[8px] top-[10px] w-[20px] h-[20px] flex items-center justify-center text-[#71717A] hover:text-[#374151] transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    {/* Eye SVG */}
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C5.63636 5 2 12 2 12C2 12 5.63636 19 12 19C18.3636 19 22 12 22 12C22 12 18.3636 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.2306 18.6362 14.1436 19 12 19C5.63636 19 2 12 2 12C2 12 3.65158 8.87898 6.06 6.06001M9.9 4.23001C10.5846 4.07842 11.285 4 12 4C18.3636 4 22 11 22 11C22 11 20.3484 14.121 17.9406 16.9406M14.1213 14.1213C13.5582 14.6844 12.8315 15 12 15C10.3431 15 9 13.6569 9 12C9 11.1685 9.31561 10.4418 9.87868 9.87868M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-sm">Vui lòng nhập mật khẩu</span>
                )}
              </div>
            </div>

            {/* Forgot Password */}
            <div className="w-full text-center">
              <Link href={ROUTES.FORGOT_PASSWORD} className="font-noto-sans font-medium text-[14px] leading-[17px] text-[#5281F9] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-[55px] flex justify-center items-center py-3 px-3 gap-[15px] bg-[#D94A56] rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] hover:bg-[#E3636E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <span className="font-noto-sans font-bold text-[20px] leading-[24px] text-white">
                Đăng nhập
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex flex-row items-center my-[30px]">
            <div className="flex-1 border-b border-[#374151]"></div>
            <span className="font-noto-sans font-medium text-[16px] leading-[19px] text-[#374151] px-[10px]">
              Hoặc đăng nhập bằng
            </span>
            <div className="flex-1 border-b border-[#374151]"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isSubmitting}
            className="w-full h-[55px] flex justify-center items-center py-3 px-3 gap-[15px] bg-white rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] border border-transparent hover:border-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mb-[36px]"
          >
            <GoogleIcon />
            <span className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#18181B]">
              Google
            </span>
          </button>

          {/* Register Link */}
          <div className="w-full text-center">
            <span className="font-noto-sans font-medium text-[16px] leading-[19px] text-[#374151]">
              Bạn chưa có tài khoản?{" "}
            </span>
            <Link href={ROUTES.REGISTER} className="font-noto-sans font-medium text-[16px] leading-[19px] text-[#D94A56] hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

PageLogin.Layout = AuthLayout;
