import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAppContext, useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { toast } from "react-toastify";
import { GoogleIcon } from "@/shared/ui/icons";
import { HeroBanner } from "@/shared/ui/ds/organisms/hero-banner";
import type { RegisterPageConfig } from "@/shared/types/admin-config";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
};

interface PageRegisterProps {
  registerConfig?: RegisterPageConfig;
}

export function PageRegister({ registerConfig }: PageRegisterProps) {
  const { masterData } = useAppContext();
  const router = useRouter();
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

  const onSubmit = async (data: FormData) => {
    try {
      await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Tạo tài khoản thành công!");
      // signUp already creates the auth session, just sign in to set cookie & redirect
      await signIn({ email: data.email, password: data.password });
    } catch (err: any) {
      const message = err?.message || "Đăng ký thất bại. Vui lòng thử lại.";
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
    <div className="flex flex-col min-h-screen items-center bg-white">
      {/* Hero Banner Section */}
      <HeroBanner
        title="Đăng nhập & Đăng ký"
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "Đăng nhập & Đăng ký", href: ROUTES.LOGIN() },
          { label: "Đăng ký" },
        ]}
      />

      {/* Register Box */}
      <div className="w-full flex justify-center py-[130px] relative z-30 px-4 max-w-7xl">
        <div className="w-[562px] bg-white rounded-[32px] shadow-[0px_2px_10px_rgba(0,0,0,0.5)] flex flex-col items-center py-8 px-6 sm:px-[64px]">
          <h2 className="font-noto-sans font-bold text-[32px] leading-[39px] text-center text-[#D94A56] mb-[30px]">
            Đăng Ký
          </h2>

          <form className="w-full flex flex-col gap-[20px]" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Full Name */}
            <div className="w-full flex flex-col items-start gap-[10px]">
              <label htmlFor="name" className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]">
                Họ và Tên
              </label>
              <Controller
                control={control}
                name="name"
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] px-[18px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                  />
                )}
              />
              {errors.name && (
                <span className="text-red-500 text-sm">Vui lòng nhập họ và tên</span>
              )}
            </div>

            {/* Email */}
            <div className="w-full flex flex-col items-start gap-[10px]">
              <label htmlFor="email" className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]">
                Email*
              </label>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: { value: true, message: "Email is required" },
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ",
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    id="email"
                    type="text"
                    placeholder="Nhập email của bạn"
                    className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] px-[18px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                  />
                )}
              />
              {errors.email && (
                <span className="text-red-500 text-sm">{errors.email.message || "Vui lòng nhập email"}</span>
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

            {/* Confirm Password */}
            <div className="w-full flex flex-col items-start gap-[10px]">
              <label htmlFor="confirm_password" className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#191D24]">
                Nhập lại mật khẩu
              </label>
              <div className="w-full relative">
                <Controller
                  control={control}
                  name="confirm_password"
                  rules={{ 
                    required: "Vui lòng nhập lại mật khẩu",
                    validate: (value) => value === passwordValue || "Mật khẩu không khớp"
                  }}
                  render={({ field }) => (
                     <input
                       {...field}
                       id="confirm_password"
                       type={showConfirmPassword ? "text" : "password"}
                       placeholder="Nhập lại mật khẩu của bạn"
                       className="w-full box-border border border-[#BDBDBD] rounded-[12px] h-[40px] pl-[18px] pr-[40px] font-noto-sans font-normal text-[14px] text-[#374151] outline-none focus:border-[#D94A56] transition-colors"
                     />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-[8px] top-[10px] w-[20px] h-[20px] flex items-center justify-center text-[#71717A] hover:text-[#374151] transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  {showConfirmPassword ? (
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
              {errors.confirm_password && (
                <span className="text-red-500 text-sm">{errors.confirm_password.message}</span>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-[55px] flex justify-center items-center py-3 px-3 gap-[15px] bg-[#D94A56] rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] hover:bg-[#E3636E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-none cursor-pointer mt-[10px]"
            >
              <span className="font-noto-sans font-bold text-[20px] leading-[24px] text-white">
                Đăng ký
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex flex-row items-center my-[20px]">
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
            className="w-full h-[55px] flex justify-center items-center py-3 px-3 gap-[15px] bg-white rounded-[10px] shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.11),0px_0px_10px_rgba(0,0,0,0.1)] border border-transparent hover:border-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mb-[30px]"
          >
            <GoogleIcon />
            <span className="font-noto-sans font-bold text-[16px] leading-[22px] text-[#18181B]">
              Google
            </span>
          </button>

          {/* Login Link */}
          <div className="w-full text-center">
            <span className="font-noto-sans font-medium text-[16px] leading-[19px] text-[#374151]">
              Bạn đã có tài khoản?{" "}
            </span>
            <Link href={ROUTES.LOGIN()} className="font-noto-sans font-medium text-[16px] leading-[19px] text-[#D94A56] hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}

PageRegister.Layout = AuthLayout;
