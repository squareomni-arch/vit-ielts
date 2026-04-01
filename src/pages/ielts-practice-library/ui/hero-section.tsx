import Link from "next/link";
import { Container } from "@/shared/ui";

type HeroSectionProps = {
  title: string;
  skillLabel: string;
};

export const HeroSection = ({ title, skillLabel }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-white bg-[linear-gradient(rgba(217,74,86,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(217,74,86,0.07)_1px,transparent_1px)] [background-position:center_top] [background-size:40px_40px]">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary-50/60 to-transparent" />
      <div className="absolute left-[-8rem] top-20 h-56 w-56 rounded-full bg-primary-100/60 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-64 w-64 rounded-full bg-secondary-200/70 blur-3xl" />

      <Container className="relative py-18 sm:py-24 lg:py-28">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chu
            </Link>
            <span>/</span>
            <Link
              href="/ielts-practice-library"
              className="transition-colors hover:text-primary"
            >
              Thu vien bai thi thu IELTS
            </Link>
            <span>/</span>
            <span className="text-primary">{skillLabel}</span>
          </div>

          <h1 className="max-w-3xl font-[var(--font-noto-sans)] text-4xl font-extrabold tracking-[-0.04em] text-[var(--color-default)] sm:text-5xl lg:text-[3.6rem]">
            {title}
          </h1>
        </div>
      </Container>
    </section>
  );
};
