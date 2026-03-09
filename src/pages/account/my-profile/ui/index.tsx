import { useAppContext } from "@/appx/providers";
import Head from "next/head";
import { MyProfileLayout } from "@/widgets/layouts";
import { Button, Card, DatePicker, Input, Select, Skeleton } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { AvatarUpload, UserAccountTypeBadge } from "@/shared/ui";
import { toast } from "react-toastify";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";

type UserDataForm = {
  id: string;
  name: string;
  email: string;
  date_of_birth: Dayjs;
  gender: "male" | "female";
  avatar: File | null;
  password: string;
  confirm_password: string;
  phoneNumber: string;
};

export const PageMyProfile = () => {
  const [preview, setPreview] = useState<string | undefined>();
  const {
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
    handleSubmit,
    getValues,
  } = useForm<UserDataForm>();
  const {
    masterData: {
      allSettings: { generalSettingsTitle },
    },
  } = useAppContext();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch user profile from Supabase
  const fetchProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        setUserData({
          viewer: {
            id: profile.id,
            name: profile.name || "",
            email: profile.email || "",
            userData: {
              isPro: profile.is_pro,
              gender: profile.gender ? [profile.gender] : ["male"],
              dateOfBirth: profile.date_of_birth,
              phoneNumber: profile.phone_number || "",
              avatar: profile.avatar_url
                ? {
                  node: {
                    mediaDetails: {
                      sizes: [{ sourceUrl: profile.avatar_url, width: "96" }],
                    },
                  },
                }
                : undefined,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser?.id]);

  const data = userData;

  useEffect(() => {
    if (data?.viewer) {
      setPreview(
        data.viewer.userData.avatar?.node.mediaDetails.sizes[0].sourceUrl
      );
      setValue("id", data.viewer.id);
      setValue("name", data.viewer.name);
      setValue("email", data.viewer.email);
      setValue("gender", data.viewer.userData.gender?.[0] || "male");
      if (data.viewer.userData.dateOfBirth)
        setValue("date_of_birth", dayjs(data.viewer.userData.dateOfBirth));
      setValue("phoneNumber", data.viewer.userData.phoneNumber);
    }
  }, [data, setValue]);

  const onSubmit = async (formData: UserDataForm) => {
    try {
      const supabase = createClient();
      const updateData: Record<string, any> = {};

      if (dirtyFields.name) updateData.name = formData.name;
      if (dirtyFields.email) updateData.email = formData.email;
      if (dirtyFields.gender) updateData.gender = formData.gender;
      if (dirtyFields.phoneNumber) updateData.phone_number = formData.phoneNumber;
      if (dirtyFields.date_of_birth) updateData.date_of_birth = formData.date_of_birth?.format("YYYY-MM-DD");

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", formData.id);

      if (error) throw error;

      await fetchProfile();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  return (
    <Card>
      <Head>
        <title>{`My Profile | ${generalSettingsTitle}`}</title>
      </Head>
         {data?.viewer && !dataLoading ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center space-x-4 border-b pb-4 border-gray-100 mb-4">
            <div className="h-24">
              <Controller
                control={control}
                name="avatar"
                render={({ field: { onChange } }) => (
                  <div className="relative group">
                    <div className="border-2 shadow border-solid border-white rounded-full overflow-hidden group-hover:border-primary duration-300">
                      <AvatarUpload
                        classNames={{
                          container: "w-[100px] h-[100px] border-none",
                          image: "object-cover",
                          wrapper: "p-0",
                        }}
                        setFile={(file) => file && onChange(file)}
                        previewUrl={preview}
                      />
                    </div>
                    <div className="bottom-0 right-0 absolute rounded-full pointer-events-none group-hover:text-white border-white border-2 shadow bg-white p-1 group-hover:border-primary group-hover:bg-primary duration-300">
                      <span className="material-symbols-rounded block! text-lg! leading-none!">
                        add_a_photo
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>
            <div>
              <h3 className="text-lg space-x-2">
                <span className="font-semibold">{data.viewer.name}</span>
                <UserAccountTypeBadge isPro={data.viewer.userData.isPro} />
              </h3>
              <p className="text-gray-500">{data.viewer.email}</p>
            </div>
          </div>
          <div className="flex -m-2 flex-wrap">
            <div className="p-2 w-full">
              <label htmlFor="email" className="block font-medium mb-2">
                <span>Name</span>
                <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: { value: true, message: "Name is required" },
                }}
                render={({ field }) => (
                  <Input
                    size="large"
                    {...field}
                    placeholder="Please enter your name"
                    status={errors.name ? "error" : ""}
                  />
                )}
              />
              {errors.name && (
                <span className="text-red-500 block mt-1">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label htmlFor="email" className="block font-medium mb-2">
                <span>Email</span>
                <span className="text-red-500">*</span>
              </label>
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
                render={({ field }) => (
                  <Input
                    size="large"
                    {...field}
                    placeholder="Please enter Email"
                    status={errors.email ? "error" : ""}
                  />
                )}
              />
              {errors.email && (
                <span className="text-red-500 block mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label htmlFor="phoneNumber" className="block font-medium mb-2">
                <span>Phone number</span>
              </label>
              <Controller
                control={control}
                name="phoneNumber"
                rules={{
                  pattern: {
                    value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/g,
                    message: "Invalid phone number",
                  },
                }}
                render={({ field }) => (
                  <Input
                    size="large"
                    {...field}
                    placeholder="Please enter phone number"
                    status={errors.phoneNumber ? "error" : ""}
                  />
                )}
              />
              {errors.phoneNumber && (
                <span className="text-red-500 block mt-1">
                  {errors.phoneNumber.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label htmlFor="date_of_birth" className="block font-medium mb-2">
                <span>Date of Birth</span>
                <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="date_of_birth"
                rules={{
                  required: {
                    value: true,
                    message: "Date of birth is required",
                  },
                }}
                render={({ field }) => (
                  <DatePicker
                    size="large"
                    format={"DD/MM/YYYY"}
                    className="w-full"
                    maxDate={dayjs()}
                    {...field}
                  />
                )}
              />
              {errors.date_of_birth && (
                <span className="text-red-500 block mt-1">
                  {errors.date_of_birth.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label htmlFor="gender" className="block font-medium mb-2">
                <span>Gender</span>
                <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="gender"
                defaultValue="male"
                rules={{
                  required: { value: true, message: "Gender is required" },
                }}
                render={({ field }) => (
                  <Select
                    size="large"
                    className="w-full"
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
                    {...field}
                  />
                )}
              />
              {errors.gender && (
                <span className="text-red-500 block mt-1">
                  {errors.gender.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label htmlFor="password" className="block font-medium mb-2">
                <span>New Password</span>
              </label>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <Input.Password size="large" {...field} />
                )}
              />
            </div>
            <div className="p-2 w-full md:w-1/2">
              <label
                htmlFor="confirm_password"
                className="block font-medium mb-2"
              >
                <span>Confirm New Password</span>
              </label>
              <Controller
                control={control}
                name="confirm_password"
                rules={{
                  validate: (value) => {
                    if (value !== getValues("password")) {
                      return "Passwords do not match";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Input.Password size="large" {...field} />
                )}
              />
              {errors.confirm_password && (
                <span className="text-red-500 block mt-1">
                  {errors.confirm_password.message}
                </span>
              )}
            </div>
            <div className="p-2 w-full text-end">
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isSubmitting}
                disabled={!isDirty}
                className="w-full md:w-auto"
              >
                Save
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <Skeleton active />
      )}
    </Card>
  );
};

PageMyProfile.Layout = MyProfileLayout;
