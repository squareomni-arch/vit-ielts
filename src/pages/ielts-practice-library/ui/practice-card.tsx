import Image from "next/image";
import Link from "next/link";
import { MouseEvent, useMemo } from "react";
import { useAuth } from "@/appx/providers";
import { IPracticeTest } from "@/entities/practice-test";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";

type PracticeCardProps = {
  item: IPracticeTest;
  priority?: boolean;
};

const PART_META = {
  listening: [
    { slug: "0", label: "Part 1", className: "bg-tertiary-500 text-[var(--color-default)]" },
    { slug: "1", label: "Part 2", className: "bg-quaternary-400 text-white" },
    { slug: "2", label: "Part 3", className: "bg-primary-400 text-white" },
    { slug: "3", label: "Part 4", className: "bg-secondary-500 text-[var(--color-default)]" },
  ],
  reading: [
    { slug: "0", label: "Passage 1", className: "bg-tertiary-500 text-[var(--color-default)]" },
    { slug: "1", label: "Passage 2", className: "bg-quaternary-400 text-white" },
    { slug: "2", label: "Passage 3", className: "bg-primary-400 text-white" },
  ],
} as const;

export const PracticeCard = ({ item, priority = false }: PracticeCardProps) => {
  const openProContentModal = useProContentModal((state) => state.open);
  const { currentUser } = useAuth();

  const skill = item.quizFields.skill[0] === "listening" ? "listening" : "reading";
  const partMeta = useMemo(() => {
    const group = PART_META[skill];
    const match = group.find((entry) => entry.slug === String(item.quizFields.part ?? "0"));
    return match ?? group[0];
  }, [item.quizFields.part, skill]);

  const requiresUpgrade = item.quizFields.proUserOnly && !currentUser?.userData.isPro;
  const detailHref = ROUTES.PRACTICE.SINGLE(item.slug);
  const actionHref = currentUser
    ? ROUTES.TAKE_THE_TEST(item.slug)
    : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(item.slug));

  const handleProtectedAction = (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (!requiresUpgrade) return;
    event.preventDefault();
    if (!currentUser) {
      window.location.href = ROUTES.LOGIN(detailHref);
      return;
    }
    openProContentModal();
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.28)]">
      <Link
        href={detailHref}
        onClick={handleProtectedAction}
        className="relative block aspect-[1.14] overflow-hidden bg-secondary-50"
      >
        {item.featuredImage?.node.sourceUrl ? (
          <Image
            src={item.featuredImage.node.sourceUrl}
            alt={item.featuredImage.node.altText || item.title}
            fill
            priority={priority}
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--color-secondary-200),_white_55%,_var(--color-primary-50))]" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${partMeta.className}`}
          >
            {partMeta.label}
          </span>
          {item.quizFields.proUserOnly && (
            <span className="rounded-full border border-primary/20 bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-sm">
              Pro
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45">
            <span>{skill}</span>
            <span className="h-1 w-1 rounded-full bg-black/20" />
            <span>{item.quizFields.type?.[0] || "practice"}</span>
          </div>
          <Link href={detailHref} onClick={handleProtectedAction} className="block">
            <h3 className="line-clamp-2 font-[var(--font-noto-sans)] text-lg font-extrabold leading-tight text-[var(--color-default)] transition-colors group-hover:text-primary sm:text-[1.35rem]">
              {item.title}
            </h3>
          </Link>
          <p className="text-sm font-medium text-black/55">
            {(item.quizFields.testsTaken || 0).toLocaleString()} attempts
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {requiresUpgrade ? (
            <button
              type="button"
              onClick={handleProtectedAction}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
            >
              <span className="material-symbols-rounded text-base">lock</span>
              Start Practice
            </button>
          ) : (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              <span className="material-symbols-rounded text-base">play_circle</span>
              Start Practice
            </Link>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-sm font-bold text-primary">
            {item.quizFields.part ? Number(item.quizFields.part) + 1 : 1}
          </div>
        </div>
      </div>
    </article>
  );
};
