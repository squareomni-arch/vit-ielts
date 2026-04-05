export const ROUTES = {
  HOME: "/",

  LOGIN: (redirect?: string) =>
    `/account/login${redirect ? `?redirect=${redirect}` : ""}`,
  REGISTER: "/account/register",
  FORGOT_PASSWORD: "/account/forgot-password",

  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin",
  },

  ACCOUNT: {
    DASHBOARD: "/account/dashboard",
    MY_PROFILE: "/account/my-profile",
    ORDER_HISTORY: "/account/order-history",
    AFFILIATE: "/account/affiliate",
  },

  ABOUT_US: "/about-us",

  SUBSCRIPTION: "/subscription",

  EXAM: {
    ARCHIVE: "/ielts-exam-library",
  },

  PRACTICE: {
    ARCHIVE_LISTENING: "/ielts-practice-library/listening",
    ARCHIVE_READING: "/ielts-practice-library/reading",
    SINGLE: (slug: string) => `/ielts-practice-library/${slug}`,
  },

  PREDICTION: {
    ARCHIVE: "/ielts-prediction",
    SINGLE: (slug: string) => `/ielts-prediction/${slug}`,
  },

  CHECKOUT: "/account/checkout",
  ORDER_RECEIVED: "/account/order-received",

  TAKE_THE_TEST: (slug: string) => `/take-the-test/${slug}`,
  TEST_RESULT: (id: string) => `/test-result/${id}`,

  SAMPLE_ESSAY: {
    ARCHIVE_SPEAKING: "/ielts-speaking-sample",
    ARCHIVE_WRITING: "/ielts-writing-sample",
    ARCHIVE_READING: "/ielts-reading-sample",
    ARCHIVE_LISTENING: "/ielts-listening-sample",
    SINGLE: (slug: string) => `/${slug}`,
  },
};
