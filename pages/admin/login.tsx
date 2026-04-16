import { useState } from "react";
import { Button, Input, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { createAdminClient } from "~supabase/admin-client";
import { isAdminRole } from "~lib/parseRoles";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createAdminServerSupabase } from "~supabase/server";
import Head from "next/head";
import {
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

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
  const [isLoginHovered, setIsLoginHovered] = useState(false);

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
      const redirect = (router.query.redirect as string) || "/admin";
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
        <title>Admin Login — IELTS Prediction</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-login-page input:-webkit-autofill,
        .admin-login-page input:-webkit-autofill:hover,
        .admin-login-page input:-webkit-autofill:focus,
        .admin-login-page input:-webkit-autofill:active {
          transition: background-color 99999s ease-in-out 0s !important;
          -webkit-text-fill-color: #1e293b !important;
          caret-color: #1e293b !important;
        }
      ` }} />

      <div className="admin-login-page">
        {/* Animated background */}
        <div className="admin-login-bg">
          <div className="admin-login-gradient-orb admin-login-orb-1" />
          <div className="admin-login-gradient-orb admin-login-orb-2" />
          <div className="admin-login-gradient-orb admin-login-orb-3" />
        </div>

        <div className="admin-login-container">
          {/* Left branding section */}
          <div className="admin-login-branding">
            <div className="admin-login-branding-content">
              <div className="admin-login-logo">
                <img
                  src="/logo.png"
                  alt="IELTS Prediction"
                  style={{ height: 40, width: "auto", objectFit: "contain" }}
                />
              </div>
              <h1 className="admin-login-branding-title">
                Quản trị hệ thống
              </h1>
              <p className="admin-login-branding-desc">
                Truy cập bảng điều khiển để quản lý nội dung, người dùng và toàn
                bộ hệ thống IELTS Prediction.
              </p>
              <div className="admin-login-features">
                <div className="admin-login-feature">
                  <div className="admin-login-feature-dot" />
                  <span>Quản lý bài thi & đề luyện tập</span>
                </div>
                <div className="admin-login-feature">
                  <div className="admin-login-feature-dot" />
                  <span>Quản lý người dùng & đơn hàng</span>
                </div>
                <div className="admin-login-feature">
                  <div className="admin-login-feature-dot" />
                  <span>Cấu hình giao diện & nội dung CMS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right login form */}
          <div className="admin-login-form-section">
            <div className="admin-login-card">
              <div className="admin-login-card-header">
                <div className="admin-login-shield-icon">
                  <LockOutlined style={{ fontSize: 24, color: "#d94a56" }} />
                </div>
                <h2 className="admin-login-card-title">Đăng nhập Admin</h2>
                <p className="admin-login-card-subtitle">
                  Vui lòng đăng nhập bằng tài khoản quản trị viên
                </p>
              </div>

              <form
                className="admin-login-form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="admin-login-field">
                  <label className="admin-login-label" htmlFor="admin-email">
                    <MailOutlined style={{ marginRight: 6 }} />
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
                        placeholder="admin@example.com"
                        size="large"
                        status={errors.email ? "error" : ""}
                        className="admin-login-input"
                        autoComplete="email"
                      />
                    )}
                  />
                  {errors.email && (
                    <span className="admin-login-error">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className="admin-login-field">
                  <label className="admin-login-label" htmlFor="admin-password">
                    <LockOutlined style={{ marginRight: 6 }} />
                    Mật khẩu
                  </label>
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: {
                        value: true,
                        message: "Mật khẩu là bắt buộc",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="admin-password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        size="large"
                        status={errors.password ? "error" : ""}
                        className="admin-login-input"
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
                  style={{
                    background: isLoginHovered
                      ? "linear-gradient(135deg, #c43a46 0%, #a83240 100%)"
                      : "linear-gradient(135deg, #d94a56 0%, #c43a46 100%)",
                    border: "none",
                    height: 48,
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "0.3px",
                    transform: isLoginHovered
                      ? "translateY(-1px)"
                      : "translateY(0)",
                    boxShadow: isLoginHovered
                      ? "0 8px 24px rgba(217, 74, 86, 0.35)"
                      : "0 4px 12px rgba(217, 74, 86, 0.2)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={() => setIsLoginHovered(true)}
                  onMouseLeave={() => setIsLoginHovered(false)}
                >
                  Đăng nhập
                </Button>
              </form>

              <div className="admin-login-footer">
                <p>
                  Chỉ dành cho quản trị viên hệ thống.
                  <br />
                  Truy cập trái phép sẽ bị ghi nhận.
                </p>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .admin-login-page {
            color-scheme: light;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            background: #f8fafc;
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
              Roboto, sans-serif;
          }

          .admin-login-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            overflow: hidden;
          }

          .admin-login-gradient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.4;
          }

          .admin-login-orb-1 {
            width: 600px;
            height: 600px;
            background: radial-gradient(
              circle,
              rgba(217, 74, 86, 0.3) 0%,
              transparent 70%
            );
            top: -200px;
            right: -100px;
            animation: admin-orb-float 8s ease-in-out infinite;
          }

          .admin-login-orb-2 {
            width: 500px;
            height: 500px;
            background: radial-gradient(
              circle,
              rgba(99, 102, 241, 0.25) 0%,
              transparent 70%
            );
            bottom: -150px;
            left: -100px;
            animation: admin-orb-float 10s ease-in-out infinite reverse;
          }

          .admin-login-orb-3 {
            width: 400px;
            height: 400px;
            background: radial-gradient(
              circle,
              rgba(59, 130, 246, 0.2) 0%,
              transparent 70%
            );
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: admin-orb-float 12s ease-in-out infinite;
          }

          @keyframes admin-orb-float {
            0%,
            100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -20px) scale(1.05);
            }
            66% {
              transform: translate(-20px, 15px) scale(0.95);
            }
          }

          .admin-login-container {
            position: relative;
            z-index: 1;
            display: flex;
            width: 100%;
            max-width: 960px;
            min-height: 560px;
            margin: 24px;
            border-radius: 24px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 1);
          }

          /* ── Left branding ── */
          .admin-login-branding {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 48px;
            background: linear-gradient(
              135deg,
              rgba(217, 74, 86, 0.05) 0%,
              rgba(99, 102, 241, 0.03) 100%
            );
            border-right: 1px solid rgba(0, 0, 0, 0.05);
          }

          .admin-login-branding-content {
            color: #475569;
          }

          .admin-login-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
          }

          .admin-login-logo-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, #d94a56 0%, #c43a46 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 12px rgba(217, 74, 86, 0.3);
          }

          .admin-login-logo-text {
            font-size: 22px;
            font-weight: 700;
            background: linear-gradient(135deg, #2D3142 0%, #4b5563 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.3px;
          }

          .admin-login-branding-title {
            font-size: 28px;
            font-weight: 700;
            color: #2D3142;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
            line-height: 1.2;
          }

          .admin-login-branding-desc {
            font-size: 14.5px;
            color: #64748b;
            line-height: 1.7;
            margin-bottom: 32px;
          }

          .admin-login-features {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .admin-login-feature {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13.5px;
            color: #475569;
          }

          .admin-login-feature-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d94a56, #f87171);
            flex-shrink: 0;
            box-shadow: 0 0 8px rgba(217, 74, 86, 0.4);
          }

          /* ── Right login form ── */
          .admin-login-form-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
          }

          .admin-login-card {
            width: 100%;
            max-width: 380px;
          }

          .admin-login-card-header {
            text-align: center;
            margin-bottom: 32px;
          }

          .admin-login-shield-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: rgba(217, 74, 86, 0.1);
            border: 1px solid rgba(217, 74, 86, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          }

          .admin-login-card-title {
            font-size: 22px;
            font-weight: 700;
            color: #2D3142;
            margin-bottom: 6px;
            letter-spacing: -0.3px;
          }

          .admin-login-card-subtitle {
            font-size: 13.5px;
            color: #6b7280;
          }

          .admin-login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .admin-login-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .admin-login-label {
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
            letter-spacing: 0.2px;
          }

          .admin-login-error {
            font-size: 12.5px;
            color: #f87171;
            margin-top: 2px;
          }

          .admin-login-footer {
            margin-top: 28px;
            text-align: center;
          }

          .admin-login-footer p {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
          }

          /* ── Responsive ── */
          @media (max-width: 768px) {
            .admin-login-container {
              flex-direction: column;
              margin: 16px;
              max-width: 100%;
            }

            .admin-login-branding {
              padding: 32px 24px;
              border-right: none;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }

            .admin-login-branding-title {
              font-size: 22px;
            }

            .admin-login-branding-desc {
              font-size: 13.5px;
              margin-bottom: 20px;
            }

            .admin-login-features {
              display: none;
            }

            .admin-login-form-section {
              padding: 32px 24px;
            }
          }
        `}</style>

        <style jsx global>{`
          /* Override Ant Design Input styles for dark admin login */
          .admin-login-page .admin-login-input .ant-input,
          .admin-login-page .admin-login-input.ant-input {
            background: #fff !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            color: #1e293b !important;
            height: 48px !important;
            font-size: 14px !important;
            padding: 12px 16px !important;
            transition: all 0.2s ease !important;
          }

          .admin-login-page .admin-login-input .ant-input:focus,
          .admin-login-page .admin-login-input.ant-input:focus,
          .admin-login-page .admin-login-input .ant-input:hover,
          .admin-login-page .admin-login-input.ant-input:hover {
            border-color: rgba(217, 74, 86, 0.3) !important;
            background: #fff !important;
            box-shadow: 0 0 0 2px rgba(217, 74, 86, 0.05) !important;
          }

          .admin-login-page .admin-login-input .ant-input::placeholder {
            color: #94a3b8 !important;
          }


          /* Password input wrapper */
          .admin-login-page
            .admin-login-input.ant-input-password
            .ant-input-suffix {
            color: #6b7280 !important;
          }

          .admin-login-page .admin-login-input.ant-input-password {
            background: #fff !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 0 16px !important;
            height: 48px !important;
            transition: all 0.2s ease !important;
          }

          .admin-login-page .admin-login-input.ant-input-password:focus-within,
          .admin-login-page .admin-login-input.ant-input-password:hover {
            border-color: rgba(217, 74, 86, 0.3) !important;
            background: #fff !important;
            box-shadow: 0 0 0 2px rgba(217, 74, 86, 0.05) !important;
          }

          .admin-login-page .admin-login-input.ant-input-password .ant-input,
          .admin-login-page .admin-login-input.ant-input-password .ant-input:focus,
          .admin-login-page .admin-login-input.ant-input-password .ant-input:hover {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            color: #1e293b !important;
            padding: 0 !important;
            height: auto !important;
          }

          .admin-login-page .admin-login-input.ant-input-password .ant-input-suffix,
          .admin-login-page .admin-login-input.ant-input-password .ant-input-suffix span,
          .admin-login-page .admin-login-input.ant-input-password .ant-input-suffix svg {
            color: #64748b !important;
            fill: #64748b !important;
          }

          /* Error status */
          .admin-login-page
            .admin-login-input.ant-input-status-error:not(
              .ant-input-disabled
            ),
          .admin-login-page
            .admin-login-input.ant-input-affix-wrapper-status-error {
            border-color: #f87171 !important;
          }

          /* Button focus outline fix */
          .admin-login-page .admin-login-submit-btn:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(217, 74, 86, 0.25) !important;
          }
        `}</style>
      </div>
    </>
  );
}

// No layout — standalone page
AdminLoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

/**
 * SSR: Chỉ redirect về /admin nếu đã đăng nhập với tài khoản admin.
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
          destination: "/admin",
          statusCode: 302,
        },
      };
    }
    // User thường đang đăng nhập → vẫn hiển thị form admin login
  }

  return { props: {} };
};
