import { Button, Checkbox, Input } from "antd";
import { Controller, useForm } from "react-hook-form";
import { Container } from "@/shared/ui";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { useState } from "react";
import { GoogleIcon } from "@/shared/ui/icons";
import { Breadcrumb } from "antd";
import type { LoginPageConfig } from "@/shared/types/admin-config";

type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    const result = await signIn({
      email: data.email,
      password: data.password,
    }).catch(() => {
      setError("email", {
        type: "manual",
        message:
          "You entered an invalid Email and/or Password combination. Please verify that you entered this information correctly.",
      });
    });

    if (result) {
      const { redirect } = router.query;
      if (redirect) {
        router.push(redirect as string);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner Section */}
      <div
        className="py-10 md:py-12"
        style={{
          background:
            loginConfig?.backgroundColor ||
            "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
        }}
      >
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Login & Register
            </h1>
            <div className="flex justify-center">
              <Breadcrumb
                items={[
                  {
                    title: <Link href={ROUTES.HOME}>Home</Link>,
                  },
                  {
                    title: "Login & Register",
                  },
                ]}
              />
            </div>
          </div>
        </Container>
      </div>

      <Container className="max-w-[500px]">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Login
          </h1>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <div className="relative">
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: { value: true, message: "Email is required" },
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => {
                    const isFloating = emailFocused || field.value;
                    return (
                      <>
                        <label
                          htmlFor="email"
                          className={`absolute left-0 pointer-events-none transition-all duration-200 ease-in-out z-10 ${
                            isFloating
                              ? `top-0 text-xs -translate-y-1 px-1 bg-white ${
                                  emailFocused
                                    ? "text-[#d94a56]"
                                    : "text-gray-700"
                                }`
                              : "top-3 text-sm text-gray-900"
                          }`}
                        >
                          Username or email *
                        </label>
                        <Input
                          {...field}
                          id="email"
                          placeholder=""
                          status={errors.email ? "error" : ""}
                          bordered={false}
                          className={`!border-b-2 !px-0 !pt-6 !pb-2 !rounded-none !shadow-none !bg-transparent transition-colors ${
                            emailFocused
                              ? "!border-b-[#d94a56] focus:!border-b-[#d94a56]"
                              : "!border-b-gray-300 focus:!border-b-[#d94a56]"
                          }`}
                          style={{
                            borderBottom: errors.email
                              ? "2px solid #ff4d4f"
                              : emailFocused
                              ? "2px solid #d94a56"
                              : "2px solid #d1d5db",
                            borderRadius: 0,
                            boxShadow: "none",
                          }}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                        />
                      </>
                    );
                  }}
                />
              </div>
              {errors.email && (
                <span className="text-red-500 block mt-1 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: true }}
                  render={({ field }) => {
                    const isFloating = passwordFocused || field.value;
                    return (
                      <>
                        <label
                          htmlFor="password"
                          className={`absolute left-0 pointer-events-none transition-all duration-200 ease-in-out z-10 ${
                            isFloating
                              ? `top-0 text-xs -translate-y-1 px-1 bg-white ${
                                  passwordFocused
                                    ? "text-[#d94a56]"
                                    : "text-gray-700"
                                }`
                              : "top-3 text-sm text-gray-900"
                          }`}
                        >
                          Password *
                        </label>
                        <Input.Password
                          {...field}
                          id="password"
                          placeholder=""
                          status={errors.password ? "error" : ""}
                          bordered={false}
                          className={`!border-b !px-0 !pt-6 !pb-2 !rounded-none !shadow-none !bg-transparent transition-colors ${
                            passwordFocused
                              ? "!border-b-[#d94a56] focus:!border-b-[#d94a56]"
                              : "!border-b-gray-300 focus:!border-b-[#d94a56]"
                          }`}
                          style={{
                            borderBottom: errors.password
                              ? "2px solid #ff4d4f"
                              : passwordFocused
                              ? "1px solid #d94a56"
                              : "1px solid #d1d5db",
                            borderRadius: 0,
                            boxShadow: "none",
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                        />
                      </>
                    );
                  }}
                />
              </div>
              {errors.password && (
                <span className="text-red-500 block mt-1 text-sm">
                  Password is required
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Controller
                control={control}
                name="rememberMe"
                defaultValue={true}
                render={({ field }) => (
                  <Checkbox
                    {...field}
                    checked={field.value}
                    className="text-gray-700"
                  >
                    Remember me
                  </Checkbox>
                )}
              />
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-gray-700 hover:text-[#d94a56] transition-colors"
              >
                Lost your password?
              </Link>
            </div>
            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              loading={isSubmitting || isLoading}
              className="!h-12 !rounded-lg !text-base !font-medium !border-none transition-all duration-300"
              style={{
                background: isLoginHovered
                  ? "linear-gradient(90deg, #c43a46 0%, #d94a56 100%)"
                  : "linear-gradient(90deg, #d94a56 0%, rgba(217, 74, 86, 0.8) 100%)",
                transform: isLoginHovered
                  ? "translateY(-2px)"
                  : "translateY(0)",
                boxShadow: isLoginHovered
                  ? "0 4px 12px rgba(217, 74, 86, 0.4)"
                  : "none",
              }}
              onMouseEnter={() => setIsLoginHovered(true)}
              onMouseLeave={() => setIsLoginHovered(false)}
            >
              <span className="flex items-center justify-center gap-2">
                Log In
                <span className="material-symbols-rounded text-lg">
                  arrow_forward
                </span>
              </span>
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={handleGoogleLogin}
              block
              size="large"
              loading={isLoading || isSubmitting}
              className="!h-12 !rounded-lg"
            >
              <GoogleIcon />
              Log in with Google
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="text-[#d94a56] hover:underline font-medium"
            >
              Create one now!
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

PageLogin.Layout = AuthLayout;
