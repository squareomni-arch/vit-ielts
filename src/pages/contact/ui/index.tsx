import { Container } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { Button, Input } from "@/shared/ui/ds";
import { HeroBanner } from "@/shared/ui/ds";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  FacebookRoundedIcon,
  TikTokIcon,
  YoutubeIcon,
  ZaloIcon,
} from "@/shared/ui/icons";
import { useState } from "react";
import type { ContactPageConfig } from "@/shared/types/admin-config";

type FormValues = {
  name: string;
  email: string;
  message: string;
  subject: string;
};

type PageContactProps = {
  config: ContactPageConfig | null;
};

const DEFAULT_LINKS = [
  { platform: "facebook", icon: <FacebookRoundedIcon className="h-8 w-8" />, url: "https://www.facebook.com/groups/ielts.practice", label: "Facebook Group", username: "@ielts.practice" },
  { platform: "tiktok", icon: <TikTokIcon className="h-8 w-8 rounded-full" />, url: "https://tiktok.com/@ielts.practice", label: "TikTok", username: "@ielts.practice" },
  { platform: "youtube", icon: <YoutubeIcon className="h-8 w-8 rounded-full" />, url: "https://tiktok.com/@ielts.practice", label: "YouTube", username: "@ielts.practice" },
  { platform: "zalo", icon: <ZaloIcon className="h-8 w-8 rounded-full" />, url: "https://tiktok.com/@ielts.practice", label: "Zalo", username: "@ielts.practice" },
];

export const PageContact = ({ config }: PageContactProps) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset
  } = useForm<FormValues>();

  const cfg = config || {
    banner: {
      title: "Contact",
      backgroundImage: ""
    },
    form: {
      nameLabel: "Your name", namePlaceholder: "Name",
      emailLabel: "Your email address", emailPlaceholder: "Email",
      subjectLabel: "Subject", subjectPlaceholder: "Subject",
      messageLabel: "Message", messagePlaceholder: "Message",
      buttonText: "Send message",
      successMessage: "Thank you for your message! We will get back to you soon.",
      errorMessage: "Something went wrong"
    },
    socialLinks: []
  };

  const activeLinks = cfg.socialLinks && cfg.socialLinks.length > 0 
    ? cfg.socialLinks
    : DEFAULT_LINKS;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook": return <FacebookRoundedIcon className="h-8 w-8" />;
      case "tiktok": return <TikTokIcon className="h-8 w-8 rounded-full" />;
      case "youtube": return <YoutubeIcon className="h-8 w-8 rounded-full" />;
      case "zalo": return <ZaloIcon className="h-8 w-8 rounded-full" />;
      default: return <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold">{platform[0]?.toUpperCase() || '#'}</div>;
    }
  };

  const handleSendEmail = async (data: FormValues) => {
    setLoading(true);
    try {
      await toast.promise(
        fetch("/api/contact/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || cfg.form.errorMessage);
          }
          return res.json();
        }),
        {
          pending: "Sending...",
          success: cfg.form.successMessage,
          error: cfg.form.errorMessage,
        }
      );
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHeader fullHead={""} title={cfg.banner.title || "Contact"} />
      
      {/* Hero Banner Area */}
      <HeroBanner 
        title={cfg.banner.title || "Contact"} 
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" }
        ]}
      />

      <section className="py-12 lg:py-20">
        <Container>
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* Left Column: Contact Form */}
              <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <form
                  className="space-y-6"
                  onSubmit={handleSubmit(handleSendEmail)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                        {cfg.form.nameLabel}
                      </label>
                      <Controller
                        control={control}
                        name="name"
                        rules={{ required: "Name is required" }}
                        render={({ field }) => (
                          <Input 
                            {...field} 
                            placeholder={cfg.form.namePlaceholder} 
                            id="name" 
                            fullWidth
                            error={!!errors.name}
                          />
                        )}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                        {cfg.form.emailLabel}
                      </label>
                      <Controller
                        control={control}
                        name="email"
                        rules={{
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address",
                          },
                        }}
                        render={({ field }) => (
                          <Input 
                            {...field} 
                            placeholder={cfg.form.emailPlaceholder} 
                            id="email"
                            fullWidth
                            error={!!errors.email}
                          />
                        )}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                      {cfg.form.subjectLabel}
                    </label>
                    <Controller
                      control={control}
                      name="subject"
                      rules={{ required: "Subject is required" }}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          placeholder={cfg.form.subjectPlaceholder} 
                          id="subject"
                          fullWidth
                          error={!!errors.subject}
                        />
                      )}
                    />
                    {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      {cfg.form.messageLabel}
                    </label>
                    <Controller
                      control={control}
                      name="message"
                      rules={{ required: "Message is required" }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          id="message"
                          placeholder={cfg.form.messagePlaceholder}
                          rows={6}
                          className={`w-full px-4 py-3 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors ${
                            errors.message ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-primary-500"
                          }`}
                        />
                      )}
                    />
                    {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? "Sending..." : cfg.form.buttonText}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right Column: Social Links */}
              <div className="lg:col-span-4">
                <div className="bg-[#FAF7EB] h-full rounded-2xl p-6 lg:p-8 flex flex-col space-y-4 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Connect With Us</h3>
                  
                  {activeLinks.map((item, index) => (
                    <Link 
                      href={item.url || "#"} 
                      target="_blank"
                      className="group flex items-center p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 border border-transparent hover:border-primary-100"
                      key={index}
                    >
                      <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                        {item.iconUrl ? (
                          <img src={item.iconUrl} alt={item.label} className="h-8 w-8 object-contain rounded-full" />
                        ) : 'icon' in item ? (item as any).icon : getPlatformIcon(item.platform)}
                      </div>
                      <div className="ml-4 flex-grow">
                        <p className="font-bold text-gray-900 group-hover:text-primary-500 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {item.username}
                        </p>
                      </div>
                      <div className="ml-2 text-gray-300 group-hover:text-primary-500 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                  
                  <div className="mt-auto pt-8">
                    <p className="text-sm text-gray-600">
                      If you have any questions, our support team is available 24/7. Use the form to reach out directly.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Container>
      </section>
    </>
  );
};
