export interface ExamLibraryHeroConfig {
  title: string;
  backgroundColor?: string;
  breadcrumb: {
    homeLabel: string;
    currentLabel: string;
    items?: BreadcrumbItem[];
  };
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
