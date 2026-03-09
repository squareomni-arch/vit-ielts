import { Button, DatePicker, Input, Select, Breadcrumb } from "antd";
import { Controller, useForm } from "react-hook-form";
import { AvatarUpload, Container } from "@/shared/ui";
import { AuthLayout } from "@/widgets/layouts";
import { useRouter } from "next/router";
import { useAppContext, useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import dayjs, { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { useState } from "react";
import { GoogleIcon } from "@/shared/ui/icons";
import type { RegisterPageConfig } from "@/shared/types/admin-config";

type FormData = {
  name: string;
  email: string;
  password: string;
  date_of_birth: Dayjs;
  gender: "male" | "female";
  avatar: File | null;
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
  } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [dateOfBirthFocused, setDateOfBirthFocused] = useState(false);
  const [genderFocused, setGenderFocused] = useState(false);
  const [isRegisterHovered, setIsRegisterHovered] = useState(false);

  const onSubmit = async (data: FormData) => {
    const result = await signUp(data as any);

    if (!(result as any).errors) {
      toast.success("Account created successfully");
      await signIn({ email: data.email, password: data.password });
      router.push("/");
    } else {
      setError("email", {
        type: "manual",
        message: (result as any).errors[0].message,
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
    <div className="space-y-7">
      {/* Hero Banner Section */}
      <div
        className="py-10 md:py-12"
        style={{
          background:
            registerConfig?.backgroundColor ||
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
            Register
          </h1>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <div className="relative">
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: { value: true, message: "Name is required" },
                  }}
                  render={({ field }) => {
                    const isFloating = nameFocused || field.value;
                    return (
                      <>
                        <label
                          htmlFor="name"
                          className={`absolute left-0 pointer-events-none transition-all duration-200 ease-in-out z-10 ${
                            isFloating
                              ? `top-0 text-xs -translate-y-1 px-1 bg-white ${
                                  nameFocused
                                    ? "text-[#d94a56]"
                                    : "text-gray-700"
                                }`
                              : "top-3 text-sm text-gray-900"
                          }`}
                        >
                          Full Name *
                        </label>
                        <Input
                          {...field}
                          id="name"
                          placeholder=""
                          status={errors.name ? "error" : ""}
                          bordered={false}
                          className={`!border-b-2 !px-0 !pt-6 !pb-2 !rounded-none !shadow-none !bg-transparent transition-colors ${
                            nameFocused
                              ? "!border-b-[#d94a56] focus:!border-b-[#d94a56]"
                              : "!border-b-gray-300 focus:!border-b-[#d94a56]"
                          }`}
                          style={{
                            borderBottom: errors.name
                              ? "2px solid #ff4d4f"
                              : nameFocused
                              ? "2px solid #d94a56"
                              : "2px solid #d1d5db",
                            borderRadius: 0,
                            boxShadow: "none",
                          }}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                        />
                      </>
                    );
                  }}
                />
              </div>
              {errors.name && (
                <span className="text-red-500 block mt-1 text-sm">
                  {errors.name.message}
                </span>
              )}
            </div>
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
                          Email *
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
            <div className="space-y-2">
              <div className="relative">
                <Controller
                  control={control}
                  name="date_of_birth"
                  rules={{
                    required: {
                      value: true,
                      message: "Date of birth is required",
                    },
                    validate: (value) => {
                      if (!value) {
                        return "Date of birth is required";
                      }
                      if (!dayjs.isDayjs(value)) {
                        return "Please select a valid date";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => {
                    const isFloating =
                      dateOfBirthFocused ||
                      field.value ||
                      (field.value && dayjs.isDayjs(field.value));
                    return (
                      <>
                        <label
                          htmlFor="date_of_birth"
                          className={`absolute left-0 pointer-events-none transition-all duration-200 ease-in-out z-10 ${
                            isFloating
                              ? `top-0 text-xs -translate-y-1 px-1 bg-white ${
                                  dateOfBirthFocused
                                    ? "text-[#d94a56]"
                                    : "text-gray-700"
                                }`
                              : "top-0 text-sm text-gray-900"
                          }`}
                        >
                          Date of birth
                        </label>
                        <div className="pt-6">
                          <DatePicker
                            value={field.value}
                            format={"DD/MM/YYYY"}
                            className={`w-full !border-b-2 !border-x-0 !border-t-0 !rounded-none !shadow-none !bg-transparent transition-colors ${
                              dateOfBirthFocused
                                ? "!border-b-[#d94a56] focus:!border-b-[#d94a56]"
                                : "!border-b-gray-300 focus:!border-b-[#d94a56]"
                            }`}
                            style={{
                              borderBottom: errors.date_of_birth
                                ? "2px solid #ff4d4f"
                                : dateOfBirthFocused
                                ? "2px solid #d94a56"
                                : "2px solid #d1d5db",
                              borderRadius: 0,
                              boxShadow: "none",
                              paddingBottom: "8px",
                            }}
                            maxDate={dayjs()}
                            onFocus={() => setDateOfBirthFocused(true)}
                            onBlur={() => {
                              setDateOfBirthFocused(false);
                              field.onBlur();
                            }}
                            onChange={(date) => {
                              field.onChange(date);
                              if (date) {
                                setDateOfBirthFocused(false);
                              }
                            }}
                          />
                        </div>
                      </>
                    );
                  }}
                />
              </div>
              {errors.date_of_birth && (
                <span className="text-red-500 block mt-1 text-sm">
                  {errors.date_of_birth.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Controller
                  control={control}
                  name="gender"
                  rules={{
                    required: { value: true, message: "Gender is required" },
                    validate: (value) => {
                      if (!value || (value as string) === "") {
                        return "Gender is required";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => {
                    const isFloating = genderFocused || field.value;
                    return (
                      <>
                        <label
                          htmlFor="gender"
                          className={`absolute left-0 pointer-events-none transition-all duration-200 ease-in-out z-10 ${
                            isFloating
                              ? `top-0 text-xs -translate-y-1 px-1 bg-white ${
                                  genderFocused
                                    ? "text-[#d94a56]"
                                    : "text-gray-700"
                                }`
                              : "top-3 text-sm text-gray-900"
                          }`}
                        >
                          Gender
                        </label>
                        <div className="pt-6">
                          <Select
                            value={field.value}
                            id="gender"
                            placeholder=""
                            className={`w-full !border-b-2 !border-x-0 !border-t-0 !rounded-none !shadow-none transition-colors [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selection-item]:!flex [&_.ant-select-selection-item]:!items-center [&_.ant-select-selection-item]:!leading-normal ${
                              genderFocused
                                ? "!border-b-[#d94a56]"
                                : "!border-b-gray-300"
                            }`}
                            style={{
                              borderBottom: errors.gender
                                ? "2px solid #ff4d4f"
                                : genderFocused
                                ? "2px solid #d94a56"
                                : "2px solid #d1d5db",
                              borderRadius: 0,
                              boxShadow: "none",
                              paddingBottom: "12px",
                              paddingTop: "4px",
                              minHeight: "48px",
                              height: "48px",
                            }}
                            popupClassName="gender-select-dropdown"
                            options={[
                              {
                                value: "male",
                                label: "Male",
                              },
                              {
                                value: "female",
                                label: "Female",
                              },
                            ]}
                            onFocus={() => setGenderFocused(true)}
                            onBlur={() => {
                              setGenderFocused(false);
                              field.onBlur();
                            }}
                            onChange={(value) => {
                              field.onChange(value);
                              setGenderFocused(false);
                            }}
                          />
                        </div>
                      </>
                    );
                  }}
                />
              </div>
              {errors.gender && (
                <span className="text-red-500 block mt-1 text-sm">
                  {errors.gender.message}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-nunito font-bold">Avatar</h4>
              <div className="flex items-center gap-3">
                <div className="h-24">
                  <Controller
                    control={control}
                    name="avatar"
                    render={({ field: { onChange } }) => (
                      <AvatarUpload setFile={onChange} />
                    )}
                  />
                </div>
                <div>
                  <h4 className="font-nunito font-bold w-fit">
                    Upload your photo
                  </h4>
                  <p className="text-xs">
                    Profile picture should be in the standard format png, jpg &
                    no more than 2MB.
                  </p>
                </div>
              </div>
            </div>
            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              loading={isSubmitting || isLoading}
              className="!h-12 !rounded-lg !text-base !font-medium !border-none transition-all duration-300"
              style={{
                background: isRegisterHovered
                  ? "linear-gradient(90deg, #c43a46 0%, #d94a56 100%)"
                  : "linear-gradient(90deg, #d94a56 0%, rgba(217, 74, 86, 0.8) 100%)",
                transform: isRegisterHovered
                  ? "translateY(-2px)"
                  : "translateY(0)",
                boxShadow: isRegisterHovered
                  ? "0 4px 12px rgba(217, 74, 86, 0.4)"
                  : "none",
              }}
              onMouseEnter={() => setIsRegisterHovered(true)}
              onMouseLeave={() => setIsRegisterHovered(false)}
            >
              <span className="flex items-center justify-center gap-2">
                Register
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
          <p className="mt-6 text-center text-gray-500">
            Have an account already?{" "}
            <Link
              href={ROUTES.LOGIN()}
              className="text-[#d94a56] hover:underline font-medium"
            >
              Please login here
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-gray-500">
            By joining {masterData?.allSettings.generalSettingsTitle}, you agree
            to our{" "}
            <Link
              href={"/terms-of-use"}
              className="text-[#d94a56] hover:underline font-medium"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href={"/privacy-policy"}
              className="text-[#d94a56] hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

PageRegister.Layout = AuthLayout;
