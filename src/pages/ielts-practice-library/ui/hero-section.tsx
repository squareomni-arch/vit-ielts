import { HeroBanner as DSHeroBanner } from "@/shared/ui/ds";

type HeroSectionProps = {
  title: string;
  skillLabel: string;
};

export const HeroSection = ({ title, skillLabel }: HeroSectionProps) => {
  return (
    <DSHeroBanner 
      title={title}
      breadcrumbs={[
        { label: "Trang chủ", href: "/" },
        { label: "Thư viện bài thi thử IELTS", href: "/ielts-practice-library" },
        { label: skillLabel }
      ]}
    />
  );
};
