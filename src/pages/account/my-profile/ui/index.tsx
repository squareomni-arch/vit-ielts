import { useAppContext } from "@/appx/providers";
import Head from "next/head";
import { AppShell } from "@/widgets/layouts";
import { Button as AntButton, DatePicker, Input, Select, Skeleton } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { AvatarUpload, UserAccountTypeBadge } from "@/shared/ui";
import { toast } from "react-toastify";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";

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
  country?: string;
  native_language?: string;
  target_band?: number;
};

export const PageMyProfile = () => {
  const [preview, setPreview] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const {
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
    handleSubmit,
    getValues,
    reset,
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
        const isProActive =
          Boolean(profile.is_pro) &&
          (profile.pro_expiration_date
            ? dayjs(profile.pro_expiration_date).isAfter(dayjs())
            : false);
        setUserData({
          viewer: {
            id: profile.id,
            name: profile.name || "",
            email: profile.email || "",
            userData: {
              isPro: isProActive,
              proExpirationDate: profile.pro_expiration_date,
              gender: profile.gender ? [profile.gender] : ["male"],
              dateOfBirth: profile.date_of_birth,
              phoneNumber: profile.phone_number || "",
              country: profile.country || "",
              nativeLanguage: profile.native_language || "",
              targetScore: profile.target_score || null,
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
      setValue("country", data.viewer.userData.country || "");
      setValue("native_language", data.viewer.userData.nativeLanguage || "");
      const tb =
        data.viewer.userData.targetScore?.reading ??
        data.viewer.userData.targetScore?.listening;
      if (tb != null) setValue("target_band", tb);
    }
  }, [data, setValue]);

  const onSubmit = async (formData: UserDataForm) => {
    try {
      const supabase = createClient();
      const updateData: Record<string, any> = {};

      if (dirtyFields.name) updateData.name = formData.name;
      // Email is display-only (cannot be edited here) — never written.
      if (dirtyFields.gender) updateData.gender = formData.gender;
      if (dirtyFields.phoneNumber) updateData.phone_number = formData.phoneNumber;
      if (dirtyFields.date_of_birth)
        updateData.date_of_birth = formData.date_of_birth?.format("YYYY-MM-DD");
      if (dirtyFields.country) updateData.country = formData.country;
      if (dirtyFields.native_language)
        updateData.native_language = formData.native_language;
      // The page exposes a single "target band"; store it across all four
      // skills in the per-skill target_score JSONB column.
      if (dirtyFields.target_band && formData.target_band != null) {
        const b = formData.target_band;
        updateData.target_score = {
          reading: b,
          listening: b,
          speaking: b,
          writing: b,
        };
      }

      // Update profile fields only when something actually changed (an empty
      // update would be a wasted write — and breaks "password only" saves).
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", formData.id);
        if (error) throw error;
      }

      // Change the auth password if a new one was entered.
      if (dirtyFields.password && formData.password) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (pwError) throw pwError;
        setValue("password", "");
        setValue("confirm_password", "");
      }

      await fetchProfile();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (data?.viewer) {
      reset({
        id: data.viewer.id,
        name: data.viewer.name,
        email: data.viewer.email,
        gender: data.viewer.userData.gender?.[0] || "male",
        date_of_birth: data.viewer.userData.dateOfBirth
          ? dayjs(data.viewer.userData.dateOfBirth)
          : undefined,
        phoneNumber: data.viewer.userData.phoneNumber,
        country: data.viewer.userData.country || "",
        native_language: data.viewer.userData.nativeLanguage || "",
        target_band:
          data.viewer.userData.targetScore?.reading ??
          data.viewer.userData.targetScore?.listening,
        password: "",
        confirm_password: "",
        avatar: null,
      });
    }
    setIsEditing(false);
  };

  const viewer = data?.viewer;
  const isPro = viewer?.userData?.isPro;

  return (
    <>
      <Head>
        <title>{`My Profile | ${generalSettingsTitle}`}</title>
      </Head>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-heading-2 font-display font-bold text-ink-900 mb-1">
          My Profile
        </h1>
        <p className="text-body-s text-ink-muted">
          Manage your account, plan and study preferences.
        </p>
      </div>

      {dataLoading || !viewer ? (
        <div className="bg-surface-card rounded-2xl p-6 shadow-primary">
          <Skeleton active />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* ── Profile card ── */}
          <div className="bg-surface-card rounded-2xl p-6 shadow-primary flex items-center gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              <Controller
                control={control}
                name="avatar"
                render={({ field: { onChange } }) => (
                  <div className="relative group">
                    <div className="border-2 border-solid border-border-hairline rounded-full overflow-hidden group-hover:border-brand duration-300 shadow-primary">
                      <AvatarUpload
                        classNames={{
                          container: "w-[72px] h-[72px] border-none",
                          image: "object-cover",
                          wrapper: "p-0",
                        }}
                        setFile={(file) => file && onChange(file)}
                        previewUrl={preview}
                      />
                    </div>
                    <div className="bottom-0 right-0 absolute rounded-full pointer-events-none group-hover:text-ink-900 border-border-hairline border-2 bg-surface-card p-0.5 group-hover:border-brand group-hover:bg-brand duration-300">
                      <span className="material-symbols-rounded block! text-base! leading-none!">
                        add_a_photo
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Name + email + badge */}
            <div className="flex-1 min-w-0">
              <p className="text-title-m font-display font-bold text-ink-900 truncate">
                {viewer.name}
              </p>
              <p className="text-body-s text-ink-muted truncate mt-0.5">
                {viewer.email}
              </p>
              {isPro && (
                <span className="inline-block mt-2">
                  <UserAccountTypeBadge isPro={isPro} />
                </span>
              )}
            </div>

            {/* Edit profile button — right side */}
            <div className="shrink-0 ml-auto">
              {!isEditing && (
                <AntButton
                  size="large"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl! font-medium!"
                >
                  Edit profile
                </AntButton>
              )}
            </div>
          </div>

          {/* ── Two-column lower section ── */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Left — Account details */}
            <div className="flex-1 min-w-0 bg-surface-card rounded-2xl p-6 shadow-primary">
              <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-6">
                Account details
              </h2>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5">
                  {/* Full name */}
                  <div>
                    <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                      Full name
                      <span className="text-danger ml-0.5">*</span>
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
                          disabled={!isEditing}
                          placeholder="Enter your full name"
                          status={errors.name ? "error" : ""}
                          className="rounded-xl!"
                        />
                      )}
                    />
                    {errors.name && (
                      <span className="text-danger text-body-s block mt-1">
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  {/* Email address */}
                  <div>
                    <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                      Email address
                    </label>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <Input
                          size="large"
                          {...field}
                          disabled
                          placeholder="Email"
                          className="rounded-xl!"
                        />
                      )}
                    />
                  </div>

                  {/* Phone + Gender row */}
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                        Phone number
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
                            disabled={!isEditing}
                            placeholder="Enter phone number"
                            status={errors.phoneNumber ? "error" : ""}
                            className="rounded-xl!"
                          />
                        )}
                      />
                      {errors.phoneNumber && (
                        <span className="text-danger text-body-s block mt-1">
                          {errors.phoneNumber.message}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                        Gender
                        <span className="text-danger ml-0.5">*</span>
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
                            disabled={!isEditing}
                            options={[
                              { value: "male", label: "Male" },
                              { value: "female", label: "Female" },
                            ]}
                            {...field}
                          />
                        )}
                      />
                      {errors.gender && (
                        <span className="text-danger text-body-s block mt-1">
                          {errors.gender.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date of birth */}
                  <div>
                    <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                      Date of birth
                      <span className="text-danger ml-0.5">*</span>
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
                          format="DD/MM/YYYY"
                          className="w-full rounded-xl!"
                          maxDate={dayjs()}
                          disabled={!isEditing}
                          {...field}
                        />
                      )}
                    />
                    {errors.date_of_birth && (
                      <span className="text-danger text-body-s block mt-1">
                        {errors.date_of_birth.message}
                      </span>
                    )}
                  </div>

                  {/* Country + Native language row */}
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1">
                      <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                        Country
                      </label>
                      <Controller
                        control={control}
                        name="country"
                        render={({ field }) => (
                          <Input
                            size="large"
                            {...field}
                            disabled={!isEditing}
                            placeholder="Enter your country"
                            className="rounded-xl!"
                          />
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                        Native language
                      </label>
                      <Controller
                        control={control}
                        name="native_language"
                        render={({ field }) => (
                          <Input
                            size="large"
                            {...field}
                            disabled={!isEditing}
                            placeholder="Enter your native language"
                            className="rounded-xl!"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Target band */}
                  <div>
                    <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                      Target band
                    </label>
                    <Controller
                      control={control}
                      name="target_band"
                      render={({ field }) => (
                        <Select
                          size="large"
                          className="w-full sm:w-[220px]"
                          disabled={!isEditing}
                          placeholder="Select target band"
                          allowClear
                          options={[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((b) => ({
                            value: b,
                            label: `Band ${b.toFixed(1)}`,
                          }))}
                          {...field}
                        />
                      )}
                    />
                  </div>

                  {/* Password row — only shown when editing */}
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="flex-1">
                        <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                          New password
                        </label>
                        <Controller
                          control={control}
                          name="password"
                          render={({ field }) => (
                            <Input.Password
                              size="large"
                              {...field}
                              className="rounded-xl!"
                            />
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-label-bold font-bold text-ink-900 mb-1.5">
                          Confirm new password
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
                            <Input.Password
                              size="large"
                              {...field}
                              className="rounded-xl!"
                            />
                          )}
                        />
                        {errors.confirm_password && (
                          <span className="text-danger text-body-s block mt-1">
                            {errors.confirm_password.message}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons — only shown when editing */}
                  {isEditing && (
                    <div className="flex items-center gap-3 pt-2 border-t border-border-hairline">
                      <AntButton
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={isSubmitting}
                        disabled={!isDirty}
                        className="rounded-xl! bg-brand! border-brand! text-ink-900! font-semibold! hover:bg-brand-hover! hover:border-brand-hover!"
                      >
                        Save changes
                      </AntButton>
                      <AntButton
                        size="large"
                        onClick={handleCancel}
                        className="rounded-xl!"
                      >
                        Cancel
                      </AntButton>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Right column */}
            <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5">
              {/* Your plan card */}
              <div className="bg-surface-card rounded-2xl p-6 shadow-primary">
                <p className="text-eyebrow font-bold text-brand-hover tracking-widest uppercase mb-2">
                  Your plan
                </p>
                <h3 className="text-title-m font-display font-bold text-ink-900 mb-4">
                  {isPro ? "Pro Member" : "Free Plan"}
                </h3>
                {viewer.userData.proExpirationDate && (
                  <p className="text-body-s mb-4">
                    {isPro ? (
                      <span className="text-ink-muted">
                        Active until{" "}
                        <span className="font-medium text-ink-900">
                          {dayjs(viewer.userData.proExpirationDate).format(
                            "DD MMM YYYY"
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-danger">
                        Expired on{" "}
                        <span className="font-medium">
                          {dayjs(viewer.userData.proExpirationDate).format(
                            "DD MMM YYYY"
                          )}
                        </span>
                      </span>
                    )}
                  </p>
                )}
                <AntButton
                  href={ROUTES.SUBSCRIPTION}
                  size="large"
                  className="w-full rounded-xl! font-medium!"
                >
                  Manage subscription
                </AntButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

PageMyProfile.Layout = AppShell;
