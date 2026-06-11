export const ROUTES = {
  HOME: "/",

  LOGIN: (redirect?: string) =>
    `/account/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
  REGISTER: "/account/register",
  FORGOT_PASSWORD: "/account/forgot-password",
  RESET_PASSWORD: "/account/reset-password",

  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin",
  },

  ACCOUNT: {
    DASHBOARD: "/account/dashboard",
    MY_PROFILE: "/account/my-profile",
    ORDER_HISTORY: "/account/order-history",
    AFFILIATE: "/account/affiliate",
    SETTINGS: "/account/settings",
  },

  HELP: "/help",

  SUBSCRIPTION: "/subscription",

  MY_PROGRESS: "/my-progress",
  STUDY_PLAN: "/study-plan",
  VOCABULARY: "/vocabulary",
  COMMUNITY: "/community",

  CLASSROOM: {
    // Teacher
    OVERVIEW: "/classroom/overview",
    LIST: "/classroom",
    STUDENTS: "/classroom/students",
    COLLABORATORS: "/classroom/collaborators",
    DETAIL: (id: string) => `/classroom/${id}`,
    ASSIGNMENTS: (id: string) => `/classroom/${id}/assignments`,
    ASSIGNMENT_DETAIL: (id: string, aid: string) =>
      `/classroom/${id}/assignments/${aid}`,
    TRACKING: (id: string) => `/classroom/${id}/tracking`,
    STUDENT_HISTORY: (id: string, studentId: string) =>
      `/classroom/${id}/tracking/${studentId}`,
    // Student
    MY_ASSIGNMENTS: "/classroom/my-assignments",
    MY_ASSIGNMENT: (id: string) => `/classroom/my-assignments/${id}`,
    // Invite link (?role=student|teacher)
    JOIN: (code: string) => `/join/${code}`,
  },

  EXAM: {
    ARCHIVE: "/ielts-exam-library",
    SINGLE: (slug: string) => `/ielts-exam-library/${slug}`,
  },

  PRACTICE: {
    ARCHIVE_LISTENING: "/ielts-practice-library/listening",
    ARCHIVE_READING: "/ielts-practice-library/reading",
    SINGLE: (slug: string) => `/ielts-practice-library/${slug}`,
  },

  PREDICTION: {
    ARCHIVE: "/ielts-prediction",
    SINGLE: (slug: string) => `/${slug}`,
  },

  BLOG: {
    ARCHIVE: "/blog",
    SINGLE: (slug: string) => `/blog/${slug}`,
  },

  CHECKOUT: "/account/checkout",
  ORDER_RECEIVED: "/account/order-received",

  TAKE_THE_TEST: (slug: string) => `/take-the-test/${slug}`,
  TEST_RESULT: (id: string) => `/test-result/${id}`,
  TEST_RESULT_EXPLANATION: (id: string) => `/test-result/explanation/${id}`,

  SAMPLE_ESSAY: {
    ARCHIVE_SPEAKING: "/ielts-speaking-sample",
    ARCHIVE_WRITING: "/ielts-writing-sample",
    ARCHIVE_READING: "/ielts-reading-sample",
    ARCHIVE_LISTENING: "/ielts-listening-sample",
    SINGLE: (slug: string) => `/${slug}`,
  },
};
