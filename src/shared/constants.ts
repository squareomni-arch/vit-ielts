/**
 * Question Form filter options per skill.
 *
 * These slugs MUST match the canonical values stored in
 * `quizzes.question_form` (comma-separated) and `questions.question_form`.
 *
 * Canonical slugs are populated by scripts/backfill-question-form.js
 * which maps question.type + matching layout → canonical slug:
 *
 *   fillup              → fill-in-the-blank
 *   radio               → multiple-choice
 *   checkbox            → multiple-select
 *   select              → dropdown
 *   matching (standard) → matching
 *   matching (summary)  → summary-completion
 *   matching (heading)  → heading-match
 *   matrix              → classification
 */
export const LISTENING_QUESTION_FORMS = [
    { value: "gap_filling", label: "Gap Filling" },
    { value: "map", label: "Map" },
    { value: "diagram_label", label: "Diagram Label" },
    { value: "matching_features", label: "Matching Features" },
    { value: "matching_information", label: "Matching Information" },
    { value: "multiple_choice_many", label: "Multiple Choice (Many Answers)" },
    { value: "multiple_choice_single", label: "Multiple Choice (Single Answer)" },
    { value: "other", label: "Other Types" },
] as const;

export const READING_QUESTION_FORMS = [
    { value: "gap_filling", label: "Gap Filling" },
    { value: "matching_endings", label: "Matching Endings" },
    { value: "matching_features", label: "Matching Features" },
    { value: "matching_headings", label: "Matching Headings" },
    { value: "matching_information", label: "Matching Information" },
    { value: "multiple_choice_many", label: "Multiple Choice (Many Answers)" },
    { value: "multiple_choice_single", label: "Multiple Choice (Single Answer)" },
    { value: "summary_completion", label: "Summary Completion" },
    { value: "true_false_not_given", label: "True - False - Not Given" },
    { value: "yes_no_not_given", label: "Yes - No - Not Given" },
    { value: "other", label: "Other Types" },
] as const;

import type { CoursePackagesConfig } from "./types/admin-config";

export const DEFAULT_COURSE_PACKAGES: CoursePackagesConfig = {
  combo: {
    plans: [
      {
        name: "Standard Plan",
        price: 200000,
        months: 1,
        popular: false,
        dealNote: "Best starter choice",
        featuredDeal: true
      },
      {
        name: "Standard Plan",
        price: 400000,
        months: 2,
        popular: true
      },
      {
        name: "Standard Plan",
        price: 600000,
        months: 3,
        popular: true
      },
      {
        name: "Standard Plan",
        price: 800000,
        months: 4
      },
      {
        name: "Standard Plan",
        price: 1000000,
        months: 5
      },
      {
        name: "Premium Plan",
        price: 1000000,
        months: 6,
        dealNote: "Giảm 200.000đ",
        featuredDeal: true,
        originalPrice: 1200000
      },
      {
        name: "Standard Plan",
        price: 1400000,
        months: 7
      },
      {
        name: "Standard Plan",
        price: 1600000,
        months: 8
      },
      {
        name: "Standard Plan",
        price: 1800000,
        months: 9
      },
      {
        name: "Standard Plan",
        price: 2000000,
        months: 10
      },
      {
        name: "Standard Plan",
        price: 2200000,
        months: 11
      },
      {
        name: "Premium Plan",
        price: 1800000,
        months: 12,
        dealNote: "Giảm 600.000đ",
        featuredDeal: true,
        originalPrice: 2400000
      }
    ],
    title: "Combo Plan",
    ctaText: "Đăng ký ngay",
    basePrice: 200000,
    monthlyIncrementPrice: 100000
  },
  single: {
    plans: [
      {
        name: "Single Pack",
        price: 200000,
        months: 2,
        popular: false,
        dealNote: "Best starter choice",
        featuredDeal: true
      },
      {
        name: "Single Pack",
        price: 300000,
        months: 3,
        popular: false,
        dealNote: "",
        featuredDeal: false
      },
      {
        name: "Single Pack",
        price: 400000,
        months: 4
      },
      {
        name: "Single Pack",
        price: 500000,
        months: 5
      },
      {
        name: "Single Pack",
        price: 500000,
        months: 6,
        popular: true,
        dealNote: "Giảm 100.000đ",
        featuredDeal: true,
        originalPrice: 600000
      },
      {
        name: "Single Pack",
        price: 700000,
        months: 7
      },
      {
        name: "Single Pack",
        price: 800000,
        months: 8
      },
      {
        name: "Single Pack",
        price: 900000,
        months: 9
      },
      {
        name: "Single Pack",
        price: 1000000,
        months: 10
      },
      {
        name: "Single Pack",
        price: 1100000,
        months: 11
      },
      {
        name: "Single Pack",
        price: 900000,
        months: 12,
        popular: false,
        dealNote: "Giảm 300.000đ",
        featuredDeal: true,
        originalPrice: 1200000
      }
    ],
    title: "Single Package",
    skills: ["listening", "reading"],
    ctaText: "Đăng ký ngay",
    basePrice: 129000,
    monthlyIncrementPrice: 80000
  },
  features: {
    excluded: [],
    included: [
      "Truy cập không giới hạn kho đề",
      "Giải thích đáp án chi tiết",
      "Cập nhật dự đoán W/S hàng tuần",
      "Giao diện mô phỏng thi máy tại nhà"
    ]
  },
  monthText: {
    plural: "tháng",
    singular: "tháng"
  },
  accessText: "Truy cập",
  priceSuffix: "/Tài Khoản",
  skillLabels: {
    reading: "Reading",
    listening: "Listening"
  },
  currencySuffix: "đ",
  dealNoteTemplate: "Tiết kiệm {percent}%",
  popularBadgeText: "Phổ biến nhất"
};