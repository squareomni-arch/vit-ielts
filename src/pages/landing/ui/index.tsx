import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Footer } from "@/shared/ui/ds/organisms/footer";
import { BlankLayout } from "@/widgets/layouts";
import { FOOTER_COLUMNS } from "@/widgets/layouts/footer-columns";
import { ROUTES } from "@/shared/routes";
import styles from "./landing.module.css";

/* ─────────────────────────────────────────────────────────────────────────
   Static marketing landing page — Figma "01 - Landing — UI Kit Styled"
   (node 4018:227). UI-only: all copy is static, no data fetching. The lead
   form posts nowhere yet (see handleSubmit). Brand/ink/accent colors come
   from the global @theme tokens; incidental slate values are page-local.
   ───────────────────────────────────────────────────────────────────────── */

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-rounded ${className}`}>{name}</span>
);

/* Exact SVG icons extracted from Figma (paths + viewBox preserved 1:1; colors
   swapped to currentColor so each adopts its parent's text color). */
type SvgProps = React.SVGProps<SVGSVGElement>;
const IconPlay = (p: SvgProps) => (
  <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M30.9062 23L31.6681 24.219C32.0884 23.9563 32.3438 23.4956 32.3438 23C32.3438 22.5044 32.0884 22.0437 31.6681 21.781L30.9062 23ZM19.4062 15.8125L20.1681 14.5935C19.725 14.3165 19.1665 14.3019 18.7094 14.5552C18.2523 14.8085 17.9688 15.2899 17.9688 15.8125H19.4062ZM19.4062 30.1875H17.9688C17.9688 30.7101 18.2523 31.1915 18.7094 31.4448C19.1665 31.6981 19.725 31.6835 20.1681 31.4065L19.4062 30.1875ZM40.25 23H38.8125C38.8125 31.733 31.733 38.8125 23 38.8125V40.25V41.6875C33.3208 41.6875 41.6875 33.3208 41.6875 23H40.25ZM23 40.25V38.8125C14.267 38.8125 7.1875 31.733 7.1875 23H5.75H4.3125C4.3125 33.3208 12.6792 41.6875 23 41.6875V40.25ZM5.75 23H7.1875C7.1875 14.267 14.267 7.1875 23 7.1875V5.75V4.3125C12.6792 4.3125 4.3125 12.6792 4.3125 23H5.75ZM23 5.75V7.1875C31.733 7.1875 38.8125 14.267 38.8125 23H40.25H41.6875C41.6875 12.6792 33.3208 4.3125 23 4.3125V5.75ZM30.9062 23L31.6681 21.781L20.1681 14.5935L19.4062 15.8125L18.6444 17.0315L30.1444 24.219L30.9062 23ZM19.4062 15.8125H17.9688V30.1875H19.4062H20.8438V15.8125H19.4062ZM19.4062 30.1875L20.1681 31.4065L31.6681 24.219L30.9062 23L30.1444 21.781L18.6444 28.9685L19.4062 30.1875Z" fill="currentColor" />
  </svg>
);
const IconTrend = (p: SvgProps) => (
  <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M41.6875 10.0625L24.4375 27.3125L17.25 20.125L4.3125 33.0625M30.1875 10.0625H41.6875V21.5625" stroke="currentColor" strokeWidth="2.875" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconChalkboard = (p: SvgProps) => (
  <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M5.75 35.9375V10.0625C5.75 9.68125 5.90145 9.31562 6.17103 9.04603C6.44062 8.77645 6.80625 8.625 7.1875 8.625H38.8125C39.1937 8.625 39.5594 8.77645 39.829 9.04603C40.0986 9.31562 40.25 9.68125 40.25 10.0625V35.9375M2.875 35.9375H43.125M21.5625 35.9375V30.1875H34.5V35.9375M11.5 35.9375V14.375H34.5V24.4375" stroke="currentColor" strokeWidth="2.875" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconExam = (p: SvgProps) => (
  <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M11.5 28.75L17.25 17.25L23 28.75M12.9375 25.875H21.5625M25.875 23H34.5M30.1875 18.6875V27.3125M5.75 38.8125V10.0625C5.75 9.68125 5.90145 9.31562 6.17103 9.04603C6.44062 8.77645 6.80625 8.625 7.1875 8.625H38.8125C39.1937 8.625 39.5594 8.77645 39.829 9.04603C40.0986 9.31562 40.25 9.68125 40.25 10.0625V38.8125L34.5 35.9375L28.75 38.8125L23 35.9375L17.25 38.8125L11.5 35.9375L5.75 38.8125Z" stroke="currentColor" strokeWidth="2.875" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClock = (p: SvgProps) => (
  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M7 3.5V7L9.33333 8.16667" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.00008 12.8333C10.2217 12.8333 12.8334 10.2216 12.8334 6.99996C12.8334 3.7783 10.2217 1.16663 7.00008 1.16663C3.77842 1.16663 1.16675 3.7783 1.16675 6.99996C1.16675 10.2216 3.77842 12.8333 7.00008 12.8333Z" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheck = (p: SvgProps) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconFire = (p: SvgProps) => (
  <svg viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M12.6875 10.875L15.6634 2.71875C18.1091 4.74875 23.5625 9.98574 23.5625 16.3125C23.5625 18.716 22.6077 21.0211 20.9082 22.7207C19.2086 24.4202 16.9035 25.375 14.5 25.375C12.0965 25.375 9.79139 24.4202 8.09184 22.7207C6.3923 21.0211 5.4375 18.716 5.4375 16.3125C5.4375 12.8495 7.07102 9.71273 8.94922 7.25L12.6875 10.875Z" fill="currentColor" />
  </svg>
);
const IconPaperPlane = (p: SvgProps) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M8.43757 11.5627L12.5001 7.50019M8.43757 11.5627L1.6071 8.23925C1.49209 8.18481 1.39643 8.09655 1.33293 7.98629C1.26942 7.87603 1.24107 7.74901 1.25169 7.6222C1.26231 7.4954 1.31138 7.37486 1.39234 7.27669C1.4733 7.17852 1.58229 7.10741 1.70475 7.07284L16.7048 2.52441C16.8117 2.49428 16.9247 2.49319 17.0321 2.52124C17.1396 2.5493 17.2377 2.60549 17.3162 2.68403C17.3948 2.76258 17.451 2.86063 17.479 2.96811C17.5071 3.07558 17.506 3.18859 17.4758 3.2955L12.9274 18.2947C12.8928 18.4172 12.8217 18.5262 12.7236 18.6071C12.6254 18.6881 12.5049 18.7372 12.3781 18.7478C12.2512 18.7584 12.1242 18.7301 12.014 18.6665C11.9037 18.603 11.8154 18.5074 11.761 18.3924L8.43757 11.5627Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SHELL = "mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-8";

// ── Why-choose cards ────────────────────────────────────────────────────────
const WHY_CARDS = [
  { img: "card-online.png", Glyph: IconPlay, tint: "var(--color-accent-blue)", title: "Học Online Chủ Động", desc: "Học mọi lúc mọi nơi trên nhiều thiết bị." },
  { img: "card-path.png", Glyph: IconTrend, tint: "var(--color-accent-orange)", title: "Lộ Trình Cá Nhân Hóa", desc: "Lựa chọn mục tiêu và tốc độ học phù hợp." },
  { img: "card-teacher.png", Glyph: IconChalkboard, tint: "var(--color-brand-hover)", title: "Giảng Viên 8.0+ IELTS", desc: "Đội ngũ chuyên gia giàu kinh nghiệm hướng dẫn." },
  { img: "card-exam.png", Glyph: IconExam, tint: "var(--color-accent-pink)", title: "Hệ Thống Sát Đề Thực Tế", desc: "Cập nhật liên tục các mẫu đề thi thật mới nhất." },
];

// ── Pricing ─────────────────────────────────────────────────────────────────
const SINGLE_FEATURES = [
  "Kho 200+ đề mẫu IELTS chuẩn xác nhất",
  "Giao diện giả lập thi thật sát tới 99%",
  "Giải thích chi tiết từng câu Reading & Listening",
  "Mẫu đề Writing & Speaking đạt band cực cao",
];
const SINGLE_PLANS = [
  { name: "Single Pack 2M", months: "2 Tháng", m: 2, was: "180.000đ", now: "90.000đ" },
  { name: "Single Pack 6M", months: "6 Tháng", m: 6, was: "480.000đ", now: "240.000đ" },
  { name: "Single Pack 12M", months: "12 Tháng", m: 12, was: "840.000đ", now: "420.000đ", badge: "BÁN CHẠY NHẤT" },
];

const PREMIUM_FEATURES = [
  "Cập nhật liên tục các bộ đề Ielts mới nhất",
  "Truy cập đầy đủ kho đề Reading & Listening",
  "Chấm điểm tự động và thống kê tiến độ học tập",
  "Chi tiết hóa bách khoa đáp án mọi bộ đề thi thật",
];
const PREMIUM_PLANS = [
  { name: "Standard Plan", months: "2 Tháng", m: 2, was: "360.000đ", now: "180.000đ", badge: "HOT SLOT", slots: "Còn đúng 15 chỗ cuối!" },
  { name: "Premium Plan 6M", months: "6 Tháng", m: 6, was: "960.000đ", now: "480.000đ", badge: "HOT SLOT", slots: "Còn đúng 5 chỗ cuối!" },
  { name: "Premium Plan 12M", months: "12 Tháng", m: 12, was: "1.680.000đ", now: "840.000đ", badge: "PHỔ BIẾN NHẤT", slots: "Còn đúng 3 chỗ cuối!" },
];

// Buy → checkout for the matching package, with VIT50 pre-applied.
const PROMO_CODE = "VIT50";
const checkoutHref = (type: "single" | "combo", months: number) =>
  `${ROUTES.CHECKOUT}?type=${type}&months=${months}&coupon=${PROMO_CODE}`;

// ── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { initials: "KL", color: "var(--color-accent-blue)", name: "Khánh Linh", band: "7.5 Overall IELTS", quote: "Giao diện thi máy giống y hệt thi thật, giúp mình đỡ bỡ ngỡ rất nhiều khi bước vào phòng thi." },
  { initials: "MQ", color: "var(--color-accent-orange)", name: "Minh Quân", band: "8.0 Reading IELTS", quote: "Phần giải thích chi tiết thực sự là cứu cánh, giúp mình hiểu tại sao mình sai và cách sửa lỗi." },
  { initials: "TT", color: "var(--color-accent-pink)", name: "Thu Trang", band: "7.0 Writing IELTS", quote: "Hệ thống chấm chữa rất sát, chỉ ra những lỗi ngữ pháp nhỏ nhất mà mình thường bỏ qua." },
];

const BAND_TARGETS = [
  "Mất gốc - Chinh phục 4.5",
  "Mục tiêu 5.0 - 5.5",
  "Mục tiêu 6.0 - 6.5",
  "Mục tiêu 7.0+",
];

const PriceBlock = ({ was, now }: { was: string; now: string }) => (
  <div className="w-full rounded-2xl border border-[#f1f5f9] bg-[#f8f8fc] p-[17px]">
    <div className="flex items-center justify-center gap-2">
      <span className="text-[14px] font-semibold text-[var(--color-ink-muted)] line-through">{was}</span>
      <span className="rounded-full bg-[var(--color-surface-blush)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">-50% OFF</span>
    </div>
    <p className="text-center font-display text-[30px] font-bold leading-9 text-[var(--color-brand-hover)]">{now}</p>
  </div>
);

const FeatureList = ({ items, boldFirst = false }: { items: string[]; boldFirst?: boolean }) => (
  <ul className="flex w-full flex-col gap-4 pb-7 pt-5">
    {items.map((f, i) => (
      <li key={f} className={`flex items-start gap-3 text-[14px] ${boldFirst && i === 0 ? "font-bold text-[var(--color-ink-700)]" : "font-medium text-[var(--color-ink-muted)]"}`}>
        <IconCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
        <span>{f}</span>
      </li>
    ))}
  </ul>
);

// Corner-ribbon badge (top-right, flush, rounded bottom-left) — Figma 4018:550.
// "PHỔ BIẾN NHẤT" (highlighted plan) uses brand green (4018:648); rest orange.
const Ribbon = ({ text, tone = "orange" }: { text: string; tone?: "orange" | "brand" }) => (
  <span className={`absolute right-0 top-0 flex items-center gap-1 rounded-bl-2xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-[1px] text-[var(--color-ink-900)] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${tone === "brand" ? "bg-[var(--color-brand)]" : "bg-[var(--color-accent-orange)]"}`}>
    {text} <IconFire className="size-[14px]" />
  </span>
);

// "Thời gian học: …" row — clock SVG (Figma 4018:366).
const Duration = ({ months }: { months: string }) => (
  <div className="flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-bold text-[var(--color-ink-muted)]">
    <IconClock className="size-[14px] text-[var(--color-brand)]" /> Thời gian học: {months}
  </div>
);

export const PageLanding = () => {
  const [form, setForm] = useState({ name: "", phone: "", target: BAND_TARGETS[0] });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // ponytail: lead form has no backend yet — capture locally and confirm.
  // Wire to a /pages/api lead route + service when the backend phase reaches it.
  // The plane "flies off" (CSS) before swapping to the thank-you state.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => setSent(true), 650);
  };

  return (
    <div className={`${styles.page} min-h-dvh bg-[#fafbf4] text-[var(--color-ink-900)]`}>
      <Head>
        <title>Vịt IELTS — Nền tảng thi thử IELTS trên máy chuẩn 1:1</title>
        <meta name="description" content="Vịt IELTS là website luyện thi IELTS trên máy, giúp bạn luyện đề thực chiến, làm quen giao diện thi thật và tự tin chinh phục Band điểm mong muốn." />
      </Head>
      {/* Be Vietnam Pro — scoped to this page (kept out of globals/_document).
          React 19 hoists & dedupes a body-rendered stylesheet link. */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&display=swap" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[rgba(25,29,36,0.06)] bg-white/90 backdrop-blur">
        <div className={`${SHELL} flex h-16 items-center justify-between`}>
          <Link href={ROUTES.HOME} className="flex items-center gap-2" aria-label="Vịt IELTS">
            <img src="/assets/logos/logo-on-bright.svg" alt="Vịt IELTS" className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-10 md:flex">
            <a href="#packages" className="text-[15px] font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-hover)]">Gói học</a>
            <a href="#testimonials" className="text-[15px] font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-hover)]">Học viên</a>
            <a href="#register" className="text-[15px] font-semibold text-[var(--color-ink-900)] hover:text-[var(--color-brand-hover)]">Đăng ký</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href={ROUTES.LOGIN()} className="hidden items-center gap-1.5 text-[14px] font-bold text-[var(--color-ink-900)] hover:text-[var(--color-brand-hover)] sm:flex">
              <Icon name="login" className="text-[18px]" /> ĐĂNG NHẬP
            </Link>
            <a href="tel:19008888" className="flex items-center gap-2 rounded-[34px] bg-[var(--color-brand)] px-5 py-2 text-[14px] font-bold text-[var(--color-ink-900)] hover:bg-[var(--color-brand-hover)]">
              <Icon name="call" className="text-[18px]" /> <span className="hidden sm:inline">Hotline:</span> 1900 8888
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#fafbf4]">
          {/* Hero-only shell: Figma frame is 1920px wide with 260px side padding
              → content caps at 1400px. At ≥1920 the centered max-w yields exactly
              260px padding; below that it scales down (px-16, then small-screen px).
              SHELL's 1440/px-16 stays on every other section. */}
          <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-12 px-6 py-16 sm:px-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8 lg:px-8 lg:py-[76px] 2xl:px-0">
            <div className="flex max-w-[570px] flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-[36px] font-bold leading-[1.1] sm:text-[48px] sm:leading-[60px]" style={{ color: "#219653" }}>
                  Nền tảng thi thử IELTS trên máy chuẩn 1:1
                </h1>
                <p className="text-[18px] font-bold leading-[29px] text-[var(--color-ink-muted)]">
                  Vịt IELTS là website luyện thi IELTS trên máy, được thiết kế để giúp bạn luyện đề thực chiến, làm quen giao diện thi thật và tự tin chinh phục Band điểm mong muốn.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href="#packages" className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-8 py-4 text-[18px] font-bold text-[var(--color-ink-900)] shadow-[0px_20px_25px_-5px_#dcfce7,0px_8px_10px_-6px_#dcfce7] hover:bg-[var(--color-brand-hover)]">
                  KHÁM PHÁ CÁC GÓI DỊCH VỤ <Icon name="arrow_forward" className="text-[18px]" />
                </a>
                <a href="#register" className="flex items-center justify-center rounded-xl border-2 border-[#e2e8f0] bg-white px-8 py-4 text-[18px] font-bold text-[#242938] hover:border-[var(--color-brand)]">
                  Đăng ký ngay
                </a>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center px-4">
                  <span className="font-display text-[30px] font-bold leading-9 text-[var(--color-brand)]">95%</span>
                  <span className="text-center text-[12px] font-bold uppercase leading-4 tracking-[0.6px] text-[var(--color-ink-muted)]">Đạt mục tiêu học</span>
                </div>
                <div className="flex flex-col items-center border-l border-[#f1f5f9] px-4">
                  <span className="font-display text-[30px] font-bold leading-9 text-[var(--color-ink-900)]">8.0+</span>
                  <span className="text-center text-[12px] font-bold uppercase leading-4 tracking-[0.6px] text-[var(--color-ink-muted)]">Giảng viên chất lượng</span>
                </div>
              </div>
            </div>
            {/* Hero art: photo bleeds bottom + decorative blobs behind.
                Like Figma, the person is sized by HEIGHT and overflows the column
                width (w-auto, not clipped) so the pointing hand is never cropped,
                and bleeds to the section's bottom edge (lg:-bottom-[76px] cancels
                the row's py-[76px]; section overflow-hidden cuts it flush). */}
            <div className="relative h-[280px] w-full max-w-none overflow-visible sm:h-[360px] lg:h-auto lg:w-[471px] lg:shrink-0 lg:self-stretch">
              {/* Figma 4017:3236 — big dark circle (#9AD534), centered */}
              <div className={`${styles.blob} absolute -top-4 right-6 h-[300px] w-[300px] sm:h-[380px] sm:w-[380px] lg:right-auto lg:left-[6px] lg:top-[-16px] lg:h-[486px] lg:w-[486px]`} style={{ background: "var(--color-brand-hover)" }} />
              {/* Figma 4017:3238 — small light circle (#B3E653), top-right */}
              <div className={`${styles.blob} absolute right-0 top-0 h-[100px] w-[100px] sm:h-[140px] sm:w-[140px] lg:right-auto lg:left-[388px] lg:top-[-16px] lg:h-[167px] lg:w-[167px]`} style={{ background: "var(--color-brand)" }} />
              {/* Figma 4017:3237 — small light circle (#B3E653), bottom-left (diagonally opposite) */}
              <div className={`${styles.blob} absolute bottom-10 left-0 h-[100px] w-[100px] sm:h-[140px] sm:w-[140px] lg:bottom-auto lg:left-[-25px] lg:top-[310px] lg:h-[167px] lg:w-[167px]`} style={{ background: "var(--color-brand)" }} />
              <img src="/assets/landing/hero-student.png" alt="Học viên Vịt IELTS" className="absolute inset-x-0 bottom-0 h-full w-full object-cover object-center lg:inset-x-auto lg:left-1/2 lg:bottom-[-76px] lg:top-auto lg:h-[135%] lg:w-auto lg:max-w-none lg:-translate-x-1/2 lg:object-contain" />
            </div>
          </div>
        </section>

        {/* ── Why choose + both package areas (one shared green container) ───
            Figma 4018:290 / 4018:353 / 4018:502 merged into a single rounded
            brand-surface box; the two pricing groups split by a divider line. */}
        <section id="packages" className="bg-[var(--color-brand-surface)] py-16">
          <div className={SHELL}>
            <div className="flex flex-col gap-14">

              {/* Why choose */}
              <div className="flex flex-col gap-12">
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-[32px] font-bold leading-[1.1] tracking-[-0.95px] text-[var(--color-ink-900)] sm:text-[38px]">Tại sao chọn Vịt IELTS?</h2>
                  <p className="text-[18px] leading-7 text-[var(--color-ink-muted)]">Tiết kiệm 40% thời gian học so với phương pháp truyền thống.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
                  {WHY_CARDS.map((c) => (
                    <div key={c.title} className="relative flex h-[264px] flex-col justify-between overflow-hidden rounded-3xl border border-[#f1f5f9] bg-white p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
                      <img src={`/assets/landing/${c.img}`} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 h-[136px]" style={{ background: `linear-gradient(to top, ${c.tint}, transparent)` }} />
                      <div className="relative flex size-[70px] items-center justify-center rounded-2xl text-white shadow" style={{ background: `color-mix(in srgb, ${c.tint} 90%, transparent)` }}>
                        <c.Glyph className="size-[46px]" />
                      </div>
                      <div className="relative flex flex-col gap-1 text-white">
                        <p className="font-display text-[19px] font-bold leading-tight">{c.title}</p>
                        <p className="text-[16px] leading-normal">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Single Pack */}
              <div className="flex flex-col gap-12">
                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="flex max-w-[960px] flex-col gap-3">
                    <h2 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.95px] sm:text-[38px]">GÓI LUYỆN THI CƠ BẢN (SINGLE PACK)</h2>
                    <p className="text-[16px] leading-6 text-[var(--color-ink-muted)]">Rèn luyện phản xạ, làm quen trực tiếp với áp lực phòng thi thật. Tối ưu hóa điểm số qua hàng trăm đề cập nhật liên tục.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#de621d] to-[var(--color-accent-orange)] px-6 py-4 text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <IconFire className="size-[29px]" />
                    <span className="text-[19px] font-bold">Khuyến mãi độc quyền Tháng 6!</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {SINGLE_PLANS.map((p) => (
                    <div key={p.name} className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border-2 border-[#f1f5f9] bg-white p-[34px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                      {p.badge && <Ribbon text={p.badge} />}
                      <h3 className="text-center font-display text-[24px] font-bold leading-8 text-[var(--color-ink-700)]">{p.name}</h3>
                      <Duration months={p.months} />
                      <PriceBlock was={p.was} now={p.now} />
                      <FeatureList items={SINGLE_FEATURES} />
                      <a href={checkoutHref("single", p.m)} className="w-full rounded-full bg-[var(--color-brand)] px-6 py-[15px] text-center text-[14px] font-bold uppercase text-[var(--color-ink-900)] shadow-[0px_4px_7.5px_rgba(25,29,36,0.2)] hover:bg-[var(--color-brand-hover)]">
                        HỌC NGAY GÓI CƠ BẢN!
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider between the two package areas */}
              <hr className="border-t border-[rgba(25,29,36,0.08)]" />

              {/* Premium */}
              <div className="flex flex-col gap-12">
                <div className="flex max-w-[1400px] flex-col gap-3">
                  <h2 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.95px] sm:text-[38px]">GÓI CHUYÊN SÂU NÂNG CAO (PREMIUM)</h2>
                  <p className="text-[16px] leading-6 text-[var(--color-ink-muted)]">Trải nghiệm kèm cặp từ giảng viên 8.0+. Chữa chi tiết kỹ năng Writing và Speaking hàng tuần giúp tự tin đạt target sớm.</p>
                </div>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {PREMIUM_PLANS.map((p) => (
                    <div key={p.name} className={`relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border-2 bg-white p-[34px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] ${p.badge === "PHỔ BIẾN NHẤT" ? "border-[var(--color-brand)]" : "border-[#f1f5f9]"}`}>
                      <Ribbon text={p.badge} tone={p.badge === "PHỔ BIẾN NHẤT" ? "brand" : "orange"} />
                      <h3 className="text-center font-display text-[24px] font-bold leading-8 text-[var(--color-ink-700)]">{p.name}</h3>
                      <Duration months={p.months} />
                      <PriceBlock was={p.was} now={p.now} />
                      <FeatureList items={PREMIUM_FEATURES} boldFirst />
                      <div className="flex w-full flex-col items-center gap-4">
                        <p className="text-center font-display text-[19px] font-bold leading-[1.3] text-[var(--color-danger)]">{p.slots}</p>
                        <a href={checkoutHref("combo", p.m)} className="w-full rounded-full bg-[var(--color-accent-orange)] px-6 py-[15px] text-center text-[14px] font-bold uppercase text-[var(--color-ink-900)] shadow-[0px_4px_7.5px_rgba(25,29,36,0.2)] hover:brightness-95">
                          GIA NHẬP LỚP PREMIUM
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────── */}
        <section id="testimonials" className="bg-[#fafbf4] py-16">
          <div className={SHELL}>
            <div className={`${styles.plusSigns} flex flex-col gap-8 rounded-[40px] bg-[var(--color-ink-900)] p-8 shadow-[0px_10px_20px_rgba(0,0,0,0.05)] sm:p-[60px]`}>
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-[32px] font-bold leading-[1.1] tracking-[-0.95px] text-[var(--color-brand)] sm:text-[38px]">Học viên nói gì về Vịt IELTS?</h2>
                <p className="text-[16px] leading-6 text-[var(--color-ink-muted)]">Hàng ngàn bạn đã bứt phá band điểm thành công cùng chúng mình.</p>
              </div>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#374151] p-[33px]">
                    <div className="flex gap-1 text-[var(--color-accent-orange)]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon key={i} name="star" className="text-[16px]" />
                      ))}
                    </div>
                    <p className="text-[16px] leading-6 text-white">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex flex-col pt-2">
                      <span className="text-[16px] font-bold text-white">{t.name}</span>
                      <span className="text-[14px] font-semibold text-[var(--color-brand)]">{t.band}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Results bar */}
              <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#374151] px-6 py-5 lg:flex-row lg:items-center lg:px-10">
                <span className="shrink-0 text-[14px] font-bold uppercase tracking-[1.4px] text-[var(--color-accent-orange)]">Kết quả mới nhất:</span>
                <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:justify-center">
                  {TESTIMONIALS.map((t) => (
                    <div key={t.name} className="flex min-w-0 flex-1 items-center gap-3 sm:border-l sm:border-[#242938] sm:pl-6 sm:first:border-0 sm:first:pl-0">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: t.color }}>{t.initials}</span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[12px] font-bold text-white">{t.name} ({t.band.split(" IELTS")[0]})</span>
                        <span className="line-clamp-2 text-[10px] text-[var(--color-brand)]">&ldquo;{t.quote}&rdquo;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Registration CTA ─────────────────────────────────────────────── */}
        <section id="register" className="bg-[#fafbf4] py-16">
          <div className={SHELL}>
            <div className="grid grid-cols-1 overflow-hidden rounded-[40px] bg-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] lg:grid-cols-2">
              {/* Intro / green panel */}
              <div className={`${styles.polkaDots} relative flex flex-col justify-center gap-2.5 overflow-hidden bg-[var(--color-brand)] p-8 sm:p-12`}>
                <span className="flex w-full justify-center rounded-full bg-[var(--color-ink-900)] p-3 text-center text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-accent-orange)]">Giữ Ưu Đãi Độc Quyền ngay hôm nay</span>
                <div className="flex flex-col gap-1.5">
                  {/* Title hook stays on one line at desktop; font scales with the
                      panel width (clamp) so it never wraps, never overflows. */}
                  <h2 className="font-display font-bold leading-[1.1] tracking-[-0.95px] text-[var(--color-ink-900)] lg:whitespace-nowrap" style={{ fontSize: "clamp(1.05rem, 1.8vw, 2rem)" }}>Gia nhập biệt đội Vịt IELTS ngay!</h2>
                  <p className="text-[18px] leading-relaxed text-[#242938]">Thực chiến như thi thật. Tự tin bứt tốc Band điểm.</p>
                </div>
                <div className="mt-2 overflow-hidden rounded-[32px] bg-[var(--color-brand-hover)]">
                  <img src="/assets/landing/cta-duck.png" alt="Vịt IELTS mascot" className="h-full w-full object-cover" />
                </div>
              </div>
              {/* Form panel */}
              <div className="flex flex-col justify-center bg-[rgba(248,250,252,0.5)] p-8 sm:p-12">
                <h3 className="font-display text-[24px] font-bold leading-8 text-[#242938]">ĐĂNG KÝ NHẬN GIỮ ƯU ĐÃI</h3>
                <p className="pb-6 pt-2 text-[14px] font-medium text-[var(--color-ink-muted)]">Điền thông tin chính xác, Vịt IELTS sẽ liên hệ trực tiếp cho bạn qua Zalo.</p>
                {sent ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand-tint)] px-5 py-6 text-[15px] font-semibold text-[var(--color-ink-900)]">
                    <Icon name="check_circle" className="text-[24px] text-[var(--color-brand-hover)]" />
                    Cảm ơn bạn! Vịt IELTS sẽ liên hệ với bạn sớm nhất qua Zalo.
                  </div>
                ) : (
                  <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-ink-muted)]">Họ và tên của bạn</span>
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Nguyễn Văn A" className="rounded-xl border border-[#e2e8f0] bg-white px-[21px] py-[19px] text-[16px] outline-none focus:border-[var(--color-brand)]" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-ink-muted)]">Số điện thoại</span>
                      <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ví dụ: 0987345678" className="rounded-xl border border-[#e2e8f0] bg-white px-[21px] py-[19px] text-[16px] outline-none focus:border-[var(--color-brand)]" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-ink-muted)]">Mục tiêu band điểm</span>
                      <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="rounded-xl border border-[#e2e8f0] bg-white px-[21px] py-[17px] text-[16px] text-[#242938] outline-none focus:border-[var(--color-brand)]">
                        {BAND_TARGETS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </label>
                    <button type="submit" disabled={sending} className="flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[var(--color-brand)] px-6 py-[15px] text-[14px] font-bold uppercase text-[var(--color-ink-900)] shadow-[0px_4px_7.5px_rgba(25,29,36,0.2)] hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed">
                      Gửi Thông Tin Đăng Ký <IconPaperPlane className={`size-5 ${sending ? styles.planeFly : ""}`} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer columns={FOOTER_COLUMNS} showCopyright />
    </div>
  );
};

PageLanding.Layout = BlankLayout;
