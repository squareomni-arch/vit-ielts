import Link from "next/link";
import { Container } from "@/shared/ui";
import { FacebookRoundedIcon, ZaloIcon } from "@/shared/ui/icons";
import { useAppContext } from "@/appx/providers";
import { Button, Input } from "antd";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";
import type { FooterCtaBannerConfig } from "./types";
import { CTABanner } from "@/shared/ui/ds/organisms/cta-banner";

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
    { label: "Blog", href: ROUTES.BLOG.ARCHIVE },
  ];

  const companyLinks = [
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

  const router = useRouter();
  const hideCtaBanner =
    router.pathname === "/ielts-practice-library/[slug]" ||
    router.pathname === "/account/login" ||
    router.pathname === "/account/register";

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter email:", newsletterEmail);
    setNewsletterEmail("");
  };

  return (
    <footer data-section="footer" className="bg-gray-100">
      {/* === SECTION: Footer CTA Banner === */}
      {!hideCtaBanner && (
        <section data-section="footer-cta-banner" className="pt-16 pb-16 bg-white">
          <ScrollFadeIn className="mx-auto sm:px-6">
            <CTABanner
              title={ctaBannerConfig?.title || "Ready to ace the IELTS?"}
              subtitle={
                ctaBannerConfig?.description ||
                "Practice with realistic exam simulations and review detailed explanations before test day!"
              }
              ctaText={ctaBannerConfig?.button?.text || "Start practising"}
              ctaHref={
                ctaBannerConfig?.button?.link || buyProLink || ROUTES.LOGIN()
              }
            />
          </ScrollFadeIn>
        </section>
      )}

      {/* === SECTION: Footer Main Content (Links + Newsletter) === */}
      <div data-section="footer-links" className="bg-[#374151] pt-16 pb-12 px-4 sm:px-6">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
            
            {/* Left Section - Branding, Social & Contact CTA */}
            <div className="space-y-6 flex flex-col items-start lg:pr-6">
              {/* Logo */}
              <Link href={ROUTES.HOME} className="block w-full">
                <div className="relative w-[120px] h-[60px] md:w-[150px] md:h-[70px]">
                  <Image
                    src="/assets/logos/logo-on-dark.svg"
                    alt={generalSettingsTitle || "VitIELTS"}
                    fill
                    className="object-contain object-left"
                    sizes="150px"
                  />
                </div>
              </Link>

              {/* Tagline */}
              <p className="text-white text-[14px] leading-[21px] font-normal font-noto-sans mb-0">
                VitIELTS specializes in providing highly accurate test
                simulations and forecast sets that closely reflect the real
                IELTS exam.
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-4 items-center">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-gray-800 hover:bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    title={social.name}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>

              {/* Contact Button */}
              <div className="pt-2">
                <Link href="/contact">
                  <button className="flex flex-row justify-center items-center px-5 py-0 h-[58px] bg-white rounded-[30px] gap-2 lg:gap-4 hover:shadow-lg transition-transform hover:-translate-y-1">
                    <span className="font-noto-sans font-bold text-[14px] leading-[19px] text-[#D94A56]">
                      Contact Us
                    </span>
                    <span className="material-symbols-rounded text-[#D94A56] text-[20px] font-bold">
                      chevron_right
                    </span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Middle Section - Useful Links */}
            <div>
              <h3 className="font-noto-sans font-bold text-[14px] leading-[19px] text-white mb-6">
                Useful Links
              </h3>
              <ul className="space-y-4">
                {usefulLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="font-noto-sans font-normal text-[14px] leading-[19px] text-white hover:text-gray-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Middle Section - Our Company */}
            <div>
              <h3 className="font-noto-sans font-bold text-[14px] leading-[19px] text-white mb-6">
                Our Company
              </h3>
              <ul className="space-y-4">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="font-noto-sans font-normal text-[14px] leading-[19px] text-white hover:text-gray-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Section - Get Contact & Newsletter */}
            <div className="space-y-10">
              {/* Get Contact */}
              <div>
                <h3 className="font-noto-sans font-bold text-[14px] leading-[19px] text-white mb-6">
                  Get Contact
                </h3>
                <ul className="space-y-4 font-noto-sans font-normal text-[14px] leading-[19px] text-white">
                  <li>Phone: {phoneNumber || "0927090848"}</li>
                  <li>
                    E-mail:{" "}
                    <Link
                      href={`mailto:${email || "ieltsprediction9@gmail.com"}`}
                      className="hover:text-gray-300 transition-colors"
                    >
                      {email || "ieltsprediction9@gmail.com"}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="font-noto-sans font-bold text-[14px] leading-[19px] text-white mb-6">
                  Newsletter
                </h3>
                <form onSubmit={handleNewsletterSubmit}>
                  {/* Form Container */}
                  <div className="flex items-center justify-between p-[4px] pl-[16px] bg-white border border-[#E5E7EB] rounded-[33.5px] shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_-1px_rgba(0,0,0,0.1)] focus-within:ring-2 focus-within:ring-blue-100 transition-all w-full h-[58px]">
                    <Input
                      placeholder="Your Email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      bordered={false}
                      className="flex-1 bg-transparent border-none shadow-none focus:shadow-none p-0 text-gray-800 placeholder-[#99A1AF] font-noto-sans text-[14px] outline-none"
                    />

                    <button
                      type="submit"
                      className="flex items-center justify-center h-[49px] px-[20px] bg-[#D94A56] rounded-[25px] hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      <span className="font-noto-sans font-bold text-[14px] leading-[19px] text-white">
                        Subscribe
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* === SECTION: Footer Copyright === */}
      <div data-section="footer-copyright" className="bg-[#374151] border-t border-gray-600 px-4 sm:px-6">
        <Container className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
            <p className="font-noto-sans text-[14px]">
              Copyright © 2025 {generalSettingsTitle || "Rainbow-Themes"}. All
              Rights Reserved
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-4">
                  {index > 0 && <span className="text-gray-500">|</span>}
                  <Link
                    href={link.href}
                    className="font-noto-sans text-[14px] hover:text-white transition-colors"
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
