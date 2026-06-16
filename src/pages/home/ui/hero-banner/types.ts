export interface HeroBannerConfig {
  title: {
    line1: string;       // "Vit IELTS"
    line2: string;       // "Thi"
    highlight: string;   // "Thử Như Thật"
  };
  subtitle: string;
  checklist: string[];
  cta: {
    text: string;
    link: string;
  };
  images: {
    screen: string;      // "/assets/figma/icons/screen 1.png"
    mascot: string;      // "/assets/figma/icons/like 1.png"
  };
}
