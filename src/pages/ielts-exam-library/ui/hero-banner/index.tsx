import { HeroBanner as DSHeroBanner } from "@/shared/ui/ds";
import type { ExamLibraryHeroConfig, BreadcrumbItem } from "../types";

interface ExamLibraryHeroBannerProps {
  config: ExamLibraryHeroConfig;
}

export const ExamLibraryHeroBanner = ({
  config,
}: ExamLibraryHeroBannerProps) => {
  const breadcrumbItems: BreadcrumbItem[] = config.breadcrumb.items?.length
    ? config.breadcrumb.items
    : [
        { label: config.breadcrumb.homeLabel, href: "/" },
        { label: config.breadcrumb.currentLabel },
      ];

  return (
    <DSHeroBanner 
      title={config.title}
      breadcrumbs={breadcrumbItems}
    />
  );
};
