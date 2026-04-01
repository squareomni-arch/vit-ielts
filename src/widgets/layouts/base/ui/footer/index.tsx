import Link from "next/link";
import { Container } from "@/shared/ui";
import { FacebookRoundedIcon, ZaloIcon } from "@/shared/ui/icons";
import { useAppContext } from "@/appx/providers";
import { Button, Input } from "antd";
import { ROUTES } from "@/shared/routes";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { FooterCtaBannerConfig } from "./types";

export const Footer = () => {
  const {
    masterData: {
      websiteOptions: {
        websiteOptionsFields: {
          generalSettings: {
            facebook,
            email,
            phoneNumber,
            logo,
            zalo,
            buyProLink,
          },
        },
      },
      allSettings: { generalSettingsTitle },
    },
  } = useAppContext();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [ctaBannerConfig, setCtaBannerConfig] =
    useState<FooterCtaBannerConfig | null>(null);

  // Fetch CTA Banner config on mount
  useEffect(() => {
    const fetchCtaBannerConfig = async () => {
      try {
        const res = await fetch("/api/admin/footer/cta-banner");
        if (res.ok) {
          const data = await res.json();
          setCtaBannerConfig(data);
        }
      } catch {
        // Use default config if fetch fails
        setCtaBannerConfig({
          title: "Ready to start creating a standard website?",
          description: "Finest choice for your home & office",
          backgroundGradient:
            "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
          button: {
            text: "Purchase Histudy",
            link: "#",
          },
        });
      }
    };
    fetchCtaBannerConfig();
  }, []);

  const socialLinks = [
    {
      icon: <FacebookRoundedIcon className="w-6 h-6" />,
      url: facebook,
      name: "Facebook",
    },
    {
      icon: <ZaloIcon className="w-6 h-6" />,
      url: zalo,
      name: "Zalo",
    },
    {
      icon: (
        <Image src="/mail.webp" alt="mail" width={24} height={24} unoptimized />
      ),
      url: email ? `mailto:${email}` : null,
      name: "Mail",
    },
  ].filter((item) => Boolean(item.url));

  // Chỉ dùng những route thực sự tồn tại trong dự án
  const usefulLinks = [
    { label: "Home", href: ROUTES.HOME },
    { label: "IELTS Exam Library", href: ROUTES.EXAM.ARCHIVE },
    {
      label: "Practice - Listening",
      href: ROUTES.PRACTICE.ARCHIVE_LISTENING,
    },
    {
      label: "Practice - Reading",
      href: ROUTES.PRACTICE.ARCHIVE_READING,
    },
    { label: "Sample Essays", href: "/sample-essay" },
    { label: "Blog", href: "/post" },
  ];

  const companyLinks = [
    { label: "About Us", href: ROUTES.ABOUT_US },
    { label: "Contact Us", href: "/contact" },
    { label: "My Dashboard", href: ROUTES.ACCOUNT.DASHBOARD },
    { label: "My Profile", href: ROUTES.ACCOUNT.MY_PROFILE },
    { label: "Order History", href: ROUTES.ACCOUNT.ORDER_HISTORY },
  ];

  const legalLinks = [
    { label: "Terms of service", href: "/terms-of-use" },
    { label: "Privacy policy", href: "/privacy-policy" },
    { label: "Login & Register", href: ROUTES.LOGIN() },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter email:", newsletterEmail);
    setNewsletterEmail("");
  };

  return (
    <footer data-section="footer" className="bg-gray-100">
      {/* === SECTION: Footer CTA Banner === */}
      <div
        data-section="footer-cta-banner"
        className="relative py-15 overflow-hidden"
        style={{
          background:
            ctaBannerConfig?.backgroundGradient ||
            "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        }}
      >
        <Container>
          <div className="relative bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 md:py-14 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Left Side - Text Content */}
            <div className="flex-1 min-w-0 w-full md:w-auto">
              <h2
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 wrap-break-word"
                style={{ color: "#000" }}
              >
                {ctaBannerConfig?.title ||
                  "Ready to start creating a standard website?"}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base wrap-break-word font-bold">
                {ctaBannerConfig?.description ||
                  "Finest choice for your home & office"}
              </p>
            </div>

            {/* Right Side - Button */}
            <div className="shrink-0 w-full md:w-auto">
              {ctaBannerConfig?.button.link || buyProLink ? (
                <Link
                  href={ctaBannerConfig?.button.link || buyProLink || "#"}
                  className="block w-full md:w-auto"
                >
                  <Button
                    type="primary"
                    size="large"
                    className="rounded-lg px-4 sm:px-8 h-12 text-sm sm:text-base font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full md:w-auto"
                    style={{
                      background: "#d94a56",
                      borderColor: "#d94a56",
                    }}
                  >
                    <span className="truncate max-w-[200px] sm:max-w-none inline-block">
                      {ctaBannerConfig?.button.text || "Purchase Histudy"}
                    </span>
                  </Button>
                </Link>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  className="rounded-lg px-4 sm:px-8 h-12 text-sm sm:text-base font-medium w-full md:w-auto"
                  style={{
                    background: "#d94a56",
                    borderColor: "#d94a56",
                  }}
                  disabled
                >
                  {ctaBannerConfig?.button.text ||
                    `Purchase ${generalSettingsTitle || "Histudy"}`}
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* === SECTION: Footer Main Content (Links + Newsletter) === */}
      <div data-section="footer-links" className="bg-white">
        <Container className="py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Left Section - Branding and Social */}
            <div className="space-y-6">
              {/* Logo */}
              <Link href={ROUTES.HOME} className="block">
                {logo?.node?.sourceUrl ? (
                  <div className="relative w-32 h-12">
                    <Image
                      src={logo.node.sourceUrl}
                      alt={generalSettingsTitle || "Logo"}
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#d94a56] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {generalSettingsTitle?.charAt(0) || "L"}
                      </span>
                    </div>
                    <span className="text-[#d94a56] font-bold text-xl">
                      {generalSettingsTitle || "Logo"}
                    </span>
                  </div>
                )}
              </Link>

              {/* Tagline */}
              <p className="text-gray-700 text-sm leading-relaxed">
                IELTS PREDICTION Test (IPT) specializes in providing highly
                accuratte test simulations and forecast sets that closely
                reflect the real IELTS exam.
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    title={social.name}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>

              {/* Contact Button */}
              <Link href="/contact">
                <Button
                  className="border-[3px] font-semibold text-gray-700 rounded-full h-[50px] px-[16px] pl-[20px] hover:bg-[#d94a56] hover:text-white hover:border-[#d94a56] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    borderColor: "#d94a56",
                  }}
                >
                  Contact With Us{" "}
                  <span className="material-symbols-rounded text-[20px]">
                    arrow_forward
                  </span>
                </Button>
              </Link>
            </div>

            {/* Middle Section - Useful Links */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Useful Links</h3>
              <ul className="space-y-3">
                {usefulLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-700 hover:text-[#d94a56] transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Middle Section - Our Company */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Our Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-700 hover:text-[#d94a56] transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Section - Get Contact & Newsletter */}
            <div className="space-y-6">
              {/* Get Contact */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Get Contact</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li>Phone: {phoneNumber || "(406) 555-0120"}</li>
                  <li>
                    E-mail:{" "}
                    <Link
                      href={`mailto:${email}`}
                      className="hover:text-[#d94a56] transition-colors"
                    >
                      {email || "admin@example.com"}
                    </Link>
                  </li>
                  <li>Address: 15205 North Kierland Blvd.</li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Newsletter</h3>
                <form onSubmit={handleNewsletterSubmit}>
                  {/* Container chính tạo hình viên thuốc và viền bao quanh */}
                  <div className="flex items-center justify-between p-1 pl-1 bg-white border border-gray-200 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    {/* Input: Loại bỏ viền mặc định, set background trong suốt */}
                    <Input
                      placeholder="Your Email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      bordered={false} // Nếu dùng Ant Design, cái này giúp bỏ viền gốc
                      className="flex-1 bg-transparent border-none shadow-none focus:shadow-none px-4 text-gray-600 placeholder-gray-400"
                    />

                    {/* Button: Bo tròn full, gradient màu tím xanh */}
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="rounded-full border-none h-12 px-8 font-medium transition-all duration-300 hover:opacity-90 hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(90deg, #d01414ff 0%, #ff4848ff 100%)", // Gradient từ Xanh sang Tím/Hồng
                      }}
                    >
                      Subscribe
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* === SECTION: Footer Copyright === */}
      <div data-section="footer-copyright" className="border-t border-gray-200">
        <Container className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              Copyright © 2025 {generalSettingsTitle || "Rainbow-Themes"}. All
              Rights Reserved
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {legalLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-400">|</span>}
                  <Link
                    href={link.href}
                    className="hover:text-gray-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};
