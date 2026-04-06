export interface ReviewItem {
  name: string;
  score: string;
  avatar: string;
  review: string;
  rating: number;
}

export interface TestimonialsConfig {
  title: string;
  description: string;
  cta: {
    text: string;
    link: string;
  };
  reviews: ReviewItem[];
}
