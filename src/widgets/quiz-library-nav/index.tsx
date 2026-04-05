import { ROUTES } from "@/shared/routes";
import _ from "lodash";
import Image from "next/image";
import { useRouter } from "next/router";
import { twMerge } from "tailwind-merge";

const navigationItems = [
  {
    label: "Mock Tests",
    link: ROUTES.EXAM.ARCHIVE,
    icon: (active: boolean) => (
      <Image
        src="/assets/figma/icons/book (1) 1.svg"
        alt="Mock Tests"
        width={24}
        height={24}
        className={active ? "" : "brightness-0"}
      />
    ),
  },
  {
    label: "Listening Practices",
    link: ROUTES.PRACTICE.ARCHIVE_LISTENING,
    icon: (active: boolean) => (
      <Image
        src="/assets/figma/icons/listen 1.svg"
        alt="Listening Practices"
        width={24}
        height={24}
        className={active ? "" : "brightness-0"}
      />
    ),
  },
  {
    label: "Reading Practices",
    link: ROUTES.PRACTICE.ARCHIVE_READING,
    icon: (active: boolean) => (
      <Image
        src="/assets/figma/icons/reading-book 1.svg"
        alt="Reading Practices"
        width={24}
        height={24}
        className={active ? "" : "brightness-0"}
      />
    ),
  },
  {
    label: "Speaking Samples",
    link: ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING,
    icon: (active: boolean) => (
      <Image
        src="/assets/figma/icons/speaking 1.svg"
        alt="Speaking Samples"
        width={24}
        height={24}
        className={active ? "" : "brightness-0"}
      />
    ),
  },
  {
    label: "Writing Samples",
    link: ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING,
    icon: (active: boolean) => (
      <Image
        src="/assets/figma/icons/copywriting (1) 1.svg"
        alt="Writing Samples"
        width={24}
        height={24}
        className={active ? "" : "brightness-0"}
      />
    ),
  },
];

function QuizLibraryNav() {
  const router = useRouter();

  const isActive = (path: string) => {
    return (
      router.pathname === path || router.query.slug?.[0] === _.trim(path, "/")
    );
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {navigationItems.map((item, index) => {
        const active = isActive(item.link);
        return (
          <a
            key={index}
            href={item.link}
            className="cursor-pointer w-full sm:w-auto"
          >
            <div
              className={twMerge(
                "flex items-center justify-center gap-4 h-[50px] py-[15px] px-[20px] rounded-[25px] border transition-colors",
                active
                  ? "bg-primary-500 border-primary text-white"
                  : "bg-white border-[#191D24] text-[#191D24] hover:bg-gray-50"
              )}
            >
              {item.icon(active)}
              <p className="text-base font-medium">{item.label}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export default QuizLibraryNav;
