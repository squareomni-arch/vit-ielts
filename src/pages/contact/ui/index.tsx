import { Container } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { Breadcrumb, Button, Input } from "antd";
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

type FormValues = {
  name: string;
  email: string;
  message: string;
  subject: string;
};

const SOCIAL_LINKS = [
  {
    icon: <FacebookRoundedIcon className="h-8 w-8" />,
    url: "https://www.facebook.com/groups/ielts.practice",
    label: "Facebook Group",
    username: "@ielts.practice",
  },
  {
    icon: <TikTokIcon className="h-8 w-8 rounded-full" />,
    url: "https://tiktok.com/@ielts.practice",
    label: "TikTok",
    username: "@ielts.practice",
  },
  {
    icon: <YoutubeIcon className="h-8 w-8 rounded-full" />,
    url: "https://tiktok.com/@ielts.practice",
    label: "YouTube",
    username: "@ielts.practice",
  },
  {
    icon: <ZaloIcon className="h-8 w-8 rounded-full" />,
    url: "https://tiktok.com/@ielts.practice",
    label: "Zalo",
    username: "@ielts.practice",
  },
];

export const PageContact = () => {
  const breadcrumbItems = [
    {
      title: <Link href="/">Home</Link>,
    },
    {
      title: "Contact",
    },
  ];

  const [loading, setLoading] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormValues>();

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
            throw new Error(err.error || "Failed to send email");
          }
          return res.json();
        }),
        {
          pending: "Sending...",
          success: "Thank you for your message! We will get back to you soon.",
          error: "Something went wrong",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHeader fullHead={""} title={"Contact"} />
      {/* === SECTION: Contact Breadcrumb === */}
      <Container>
        <div className="py-5">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        {/* === SECTION: Contact Form + Social Links === */}
        <div data-section="contact-form" className="flex -m-4 flex-wrap pb-5">
          <div className="p-4 w-full md:w-8/12">
            <form
              className="space-y-4"
              onSubmit={handleSubmit(handleSendEmail)}
            >
              <div className="space-y-1">
                <label htmlFor="name" className="block font-medium">
                  Your name
                </label>
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: {
                      value: true,
                      message: "Name is required",
                    },
                  }}
                  render={({ field }) => (
                    <Input {...field} placeholder="Name" id="name" />
                  )}
                />
                {errors.name && (
                  <span className="text-red-500">{errors.name.message}</span>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="block font-medium">
                  Your email address
                </label>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: {
                      value: true,
                      message: "Email is required",
                    },
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <Input {...field} placeholder="Email" id="email" />
                  )}
                />
                {errors.email && (
                  <span className="text-red-500">{errors.email.message}</span>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="subject" className="block font-medium">
                  Subject
                </label>
                <Controller
                  control={control}
                  name="subject"
                  rules={{
                    required: {
                      value: true,
                      message: "Subject is required",
                    },
                  }}
                  render={({ field }) => (
                    <Input {...field} placeholder="Subject" id="subject" />
                  )}
                />
                {errors.subject && (
                  <span className="text-red-500">{errors.subject.message}</span>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="message" className="block font-medium">
                  Message
                </label>
                <Controller
                  control={control}
                  name="message"
                  rules={{
                    required: {
                      value: true,
                      message: "Message is required",
                    },
                  }}
                  render={({ field }) => (
                    <Input.TextArea
                      {...field}
                      placeholder="Message"
                      id="message"
                      rows={5}
                    />
                  )}
                />
                {errors.message && (
                  <span className="text-red-500">{errors.message.message}</span>
                )}
              </div>
              <Button
              className="h-12 px-[20px]"
                type="primary"
                htmlType="submit"
                loading={isSubmitting || loading}
              >
                Send message
              </Button>
            </form>
          </div>
          <div className="p-4 md:w-4/12 w-full">
            <div className="bg-gray-100 h-full rounded-lg p-4 space-y-3">
              {SOCIAL_LINKS.map((item, index) => (
                <div
                  className="py-2 px-4 bg-white rounded-md flex items-center space-x-2"
                  key={index}
                >
                  {item.icon}
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-slate-500 text-[13px]">
                      {item.username}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Link href={item.url} target="_blank">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="hover:text-primary duration-150"
                      >
                        <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                        <path d="m21 3-9 9" />
                        <path d="M15 3h6v6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};
