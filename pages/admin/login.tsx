import { Button, Input, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { createAdminClient } from "~supabase/admin-client";
import { isAdminRole } from "~lib/parseRoles";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createAdminServerSupabase } from "~supabase/server";
import { ROUTES } from "@/shared/routes";
import Head from "next/head";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

type FormData = {
  email: string;
  password: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createAdminClient();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError("email", {
          type: "manual",
          message: "Email hoặc mật khẩu không chính xác.",
        });
        return;
      }

      // Check admin role
      if (authData.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("roles")
          .eq("id", authData.user.id)
          .single();

        if (!isAdminRole(profile?.roles)) {
          // Not admin — sign out and show error
          await supabase.auth.signOut();
          setError("email", {
            type: "manual",
            message: "Tài khoản này không có quyền truy cập Admin.",
          });
          return;
        }
      }

      // Redirect to admin dashboard
      const redirect =
        (router.query.redirect as string) || ROUTES.ADMIN.DASHBOARD;
      message.success("Đăng nhập thành công!");
      window.location.href = redirect;
    } catch {
      setError("email", {
        type: "manual",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login — Vit IELTS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-login-badge">
              <LockOutlined style={{ fontSize: 22, color: "#7DB024" }} />
            </div>
            <img
              src="/assets/logos/logo-on-bright.svg"
              alt="VIT IELTS"
              className="admin-login-logo"
            />
            <h1 className="admin-login-title">Đăng nhập Admin</h1>
            <p className="admin-login-subtitle">
              Khu vực quản trị — chỉ dành cho quản trị viên hệ thống
            </p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="admin-login-field">
              <label className="admin-login-label" htmlFor="admin-email">
                Email
              </label>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: { value: true, message: "Email là bắt buộc" },
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="admin-email"
                    prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
                    placeholder="admin@example.com"
                    size="large"
                    status={errors.email ? "error" : ""}
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && (
                <span className="admin-login-error">{errors.email.message}</span>
              )}
            </div>

            <div className="admin-login-field">
              <label className="admin-login-label" htmlFor="admin-password">
                Mật khẩu
              </label>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: { value: true, message: "Mật khẩu là bắt buộc" },
                }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    id="admin-password"
                    prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
                    placeholder="Nhập mật khẩu"
                    size="large"
                    status={errors.password ? "error" : ""}
                    autoComplete="current-password"
                  />
                )}
              />
              {errors.password && (
                <span className="admin-login-error">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              htmlType="submit"
              type="primary"
              block
              size="large"
              loading={isSubmitting}
              className="admin-login-submit-btn"
            >
              Đăng nhập
            </Button>
          </form>

          <p className="admin-login-footer">
            Truy cập trái phép sẽ bị ghi nhận.
          </p>
        </div>
      </div>

      <style jsx>{`
        .admin-login-page {
          color-scheme: light;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(
              circle at 50% 0%,
              rgba(154, 213, 52, 0.08),
              transparent 60%
            ),
            #f1f5f9;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
        }

        .admin-login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 40px 32px 28px;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
        }

        .admin-login-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .admin-login-badge {
          width: 52px;
          height: 52px;
          margin: 0 auto 18px;
          border-radius: 14px;
          background: rgba(154, 213, 52, 0.12);
          border: 1px solid rgba(154, 213, 52, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-login-logo {
          height: 28px;
          width: auto;
          object-fit: contain;
          margin-bottom: 16px;
        }

        .admin-login-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }

        .admin-login-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .admin-login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-login-label {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .admin-login-error {
          font-size: 12.5px;
          color: #ef4444;
        }

        .admin-login-footer {
          margin: 24px 0 0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
      `}</style>

      <style jsx global>{`
        .admin-login-page .ant-input-affix-wrapper {
          border-radius: 12px;
          padding: 10px 14px;
        }
        .admin-login-page .ant-input-affix-wrapper:hover,
        .admin-login-page .ant-input-affix-wrapper-focused {
          border-color: rgba(154, 213, 52, 0.6);
          box-shadow: 0 0 0 2px rgba(154, 213, 52, 0.1);
        }
        .admin-login-page .admin-login-submit-btn {
          height: 46px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          color: #191d24;
          border: none;
          background: linear-gradient(135deg, #9ad534 0%, #7db024 100%);
          box-shadow: 0 4px 12px rgba(154, 213, 52, 0.25);
          transition: all 0.25s ease;
        }
        .admin-login-page .admin-login-submit-btn:hover {
          background: linear-gradient(135deg, #7db024 0%, #6a9920 100%) !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(154, 213, 52, 0.4);
        }
        .admin-login-page .admin-login-submit-btn:focus {
          box-shadow: 0 0 0 3px rgba(154, 213, 52, 0.3) !important;
        }
      `}</style>
    </>
  );
}

// No layout — standalone page
AdminLoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

/**
 * SSR: Chỉ redirect về dashboard nếu đã đăng nhập với tài khoản admin.
 * User thường đang đăng nhập vẫn được xem trang này bình thường.
 */
export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createAdminServerSupabase(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Chỉ redirect nếu đã là admin
    const { data: profile } = await supabase
      .from("users")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();

    if (isAdminRole(profile?.roles)) {
      return {
        redirect: {
          destination: ROUTES.ADMIN.DASHBOARD,
          statusCode: 302,
        },
      };
    }
    // User thường đang đăng nhập → vẫn hiển thị form admin login
  }

  return { props: {} };
};
