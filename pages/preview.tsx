/**
 * Design System Preview — /preview
 *
 * Sticky sidebar nav + full token/component gallery.
 * Rebuild: 2026-06-09 — aligned to current globals.css @theme tokens.
 */

import { useState } from 'react';
import { Button } from '@/shared/ui/ds/atoms/button';
import { Input } from '@/shared/ui/ds/atoms/input';
import { Badge } from '@/shared/ui/ds/atoms/badge';
import { Avatar } from '@/shared/ui/ds/atoms/avatar';
import { Tag } from '@/shared/ui/ds/atoms/tag';
import { PartTag } from '@/shared/ui/ds/atoms/part-tag';
import { Divider } from '@/shared/ui/ds/atoms/divider';
import { Spinner } from '@/shared/ui/ds/atoms/spinner';
import { ScoreRing } from '@/shared/ui/ds/atoms/score-ring';
import { Checkbox } from '@/shared/ui/ds/atoms/checkbox';
import { SkillCard } from '@/shared/ui/ds/molecules/skill-card';
import { CourseCard } from '@/shared/ui/ds/molecules/course-card';
import { FormField } from '@/shared/ui/ds/molecules/form-field';
import { NavLink } from '@/shared/ui/ds/molecules/nav-link';
import { Breadcrumb } from '@/shared/ui/ds/molecules/breadcrumb';
import { TestCard } from '@/shared/ui/ds/molecules/test-card';
import { BlogCard } from '@/shared/ui/ds/molecules/blog-card';
import { StatCard } from '@/shared/ui/ds/molecules/stat-card';
import { PricingCard } from '@/shared/ui/ds/molecules/pricing-card';
import { Toast } from '@/shared/ui/ds/molecules/toast';
import { Tabs } from '@/shared/ui/ds/molecules/tabs';
import { Select } from '@/shared/ui/ds/molecules/select';
import { FilterDropdown } from '@/shared/ui/ds/molecules/filter-dropdown';
import { Stepper } from '@/shared/ui/ds/molecules/stepper';
import { ProgressBar } from '@/shared/ui/ds/atoms/progress-bar';
import { Pagination } from '@/shared/ui/ds/molecules/pagination';
import { Header } from '@/shared/ui/ds/organisms/header';
import { Footer } from '@/shared/ui/ds/organisms/footer';
import { CTABanner } from '@/shared/ui/ds/organisms/cta-banner';
import { SidebarStudent, SidebarTeacher, SidebarTopActions } from '@/shared/ui/ds/organisms/sidebar';
import { SidebarNavItem } from '@/shared/ui/ds/molecules/sidebar-nav-item';
import { ResultsTable } from '@/shared/ui/ds/molecules/results-table';
import { Tooltip } from '@/shared/ui/ds/molecules/tooltip';

// ─── Section IDs (for sidebar nav) ─────────────────────────────────────────
const SECTIONS = [
  { id: 'colors',       label: '1. Colors' },
  { id: 'typography',   label: '2. Typography' },
  { id: 'atoms',        label: '3. Atoms' },
  { id: 'inputs-data',  label: '4. Inputs & Data' },
  { id: 'icons',        label: '5. Icons' },
  { id: 'molecules',    label: '6. Molecules' },
  { id: 'cards',        label: '7. Cards' },
  { id: 'toasts',       label: '8. Toasts' },
  { id: 'navigation',   label: '9. Navigation' },
  { id: 'controls',     label: '10. Controls' },
  { id: 'data-display', label: '11. Data Display' },
  { id: 'organisms',    label: '12. Organisms' },
] as const;

// ─── Icon list (from public/assets/icons/) ──────────────────────────────────
const ICONS = [
  'ArrowLeft','ArrowRight','ArrowsClockwise','ArrowsOut',
  'Bell','Book','BookOpenText','BookmarkSimple',
  'Calendar-1','Calendar','CalendarBlank',
  'CaretDown','CaretLeft-1','CaretLeft','CaretRight-1','CaretRight','CaretUp',
  'Chalkboard','ChartBar','Check','CheckCircle','ClipboardText',
  'Clock-1','Clock','ClockUser','Copy','CreditCard',
  'DotsThreeVertical','DownloadSimple','Envelope','Exam','ExclamationMark',
  'Eye','EyeSlash','Gear','GlobeHemisphereWest','GraduationCap',
  'Headphones','House','LinkSimple','List','Lock',
  'MagnifyingGlass','MagnifyingGlassMinus','MagnifyingGlassPlus',
  'MicrophoneStage','Minus','PaperPlaneTilt','PencilLine','Percent',
  'Phone','Play','PlayCircle','Plus','PushPin','Question',
  'ShareNetwork','ShoppingCart','SignOut',
  'SpeakerHigh','SpeakerLow','SpeakerX',
  'SquaresFour','Student','Timer-1','Timer','Trash','TrendUp','Trophy',
  'User','UserPlus','UserSound','UsersThree',
  'Video','Wallet','Warning','WarningCircle','X','XCircle',
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M14.594 6.594H9.406V1.406a1.406 1.406 0 1 0-2.812 0v5.188H1.406a1.406 1.406 0 1 0 0 2.812h5.188v5.188a1.406 1.406 0 1 0 2.812 0V9.406h5.188a1.406 1.406 0 1 0 0-2.812Z" fill="currentColor" />
  </svg>
);

// Token swatch
const Swatch = ({ hex, label, token }: { hex: string; label: string; token?: string }) => (
  <div className="flex items-center gap-3 px-3 py-2 bg-white border border-[#E5E6E8] rounded-xl text-xs font-inter min-w-[200px]">
    <span
      className="w-8 h-8 rounded-full shrink-0 border border-black/10"
      style={{ background: hex }}
    />
    <div className="flex flex-col gap-0.5 overflow-hidden">
      <span className="font-semibold text-[#191D24] truncate">{label}</span>
      <span className="text-[#6A7282] font-mono">{hex}</span>
      {token && <span className="text-[#9AA0AD] font-mono text-[10px]">{token}</span>}
    </div>
  </div>
);

// Section header
const SectionHead = ({ id, n, title, sub }: { id: string; n: string; title: string; sub?: string }) => (
  <div className="mb-8" id={id} style={{ scrollMarginTop: 80 }}>
    <div className="flex items-baseline gap-3 mb-1">
      <span className="text-sm font-bold text-[#B3E653] font-display tracking-widest uppercase">{n}</span>
      <h2 className="text-2xl font-bold text-[#191D24] font-display">{title}</h2>
    </div>
    {sub && <p className="text-sm text-[#6A7282] font-inter mt-1">{sub}</p>}
    <div className="mt-3 h-px bg-[#E5E6E8]" />
  </div>
);

// Group label
const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-[#6A7282] mb-3 font-inter">{children}</p>
);

// Row wrapper
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-3 items-center mb-4">{children}</div>
);

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'IELTS Online Test', href: '#', active: true, children: [{ label: 'Practice - Listening', href: '#' }, { label: 'Practice - Reading', href: '#' }] },
  { label: 'IELTS Sample', href: '#' },
  { label: 'Vit IELTS', href: '#' },
  { label: 'Subscription', href: '#' },
];
// Figma node 3366:74 — columns match exactly
const FOOTER_COLS = [
  { title: 'Learn',     links: [{ label: 'Listening', href: '#' }, { label: 'Reading', href: '#' }, { label: 'Writing', href: '#' }, { label: 'Speaking', href: '#' }] },
  { title: 'Resources', links: [{ label: 'Mock tests', href: '#' }, { label: 'Vocabulary', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Band guide', href: '#' }] },
  { title: 'Company',   links: [{ label: 'About', href: '#' }, { label: 'Teachers', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Contact', href: '#' }] },
];

// ════════════════════════════════════════════════════════════════════════════
export default function Preview() {
  const [activeSection, setActiveSection] = useState('colors');
  const [cbChecked, setCbChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectVal, setSelectVal] = useState('multiple_choice');
  const [paginationPage, setPaginationPage] = useState(2);
  const [filterSel, setFilterSel] = useState<string[]>(['reading', 'writing']);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-inter text-[#191D24]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#191D24] text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-[#B3E653] font-display font-bold text-lg">DS Preview</span>
          <span className="text-white/40 text-xs font-mono">VIT IELTS — Component Library</span>
        </div>
        <span className="text-white/50 text-xs font-mono">globals.css @theme · 2026-06-09</span>
      </div>

      <div className="flex max-w-[1400px] mx-auto">

        {/* ── Sidebar nav ─────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto py-8 pr-4">
          <nav className="flex flex-col gap-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={[
                  'text-left text-sm px-3 py-2 rounded-lg transition-all duration-150 font-inter',
                  activeSection === s.id
                    ? 'bg-[#B3E653] text-[#191D24] font-bold'
                    : 'text-[#6A7282] hover:text-[#191D24] hover:bg-white',
                ].join(' ')}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-[#E5E6E8] pt-6">
            <p className="text-[10px] font-mono text-[#9AA0AD] leading-relaxed">
              Brand: <span className="text-[#B3E653] font-bold">#B3E653</span><br />
              Ink/900: <span className="text-[#6A7282]">#191D24</span><br />
              Font: Be Vietnam Pro<br />
              Body: Inter
            </p>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 py-10 px-6 lg:px-10 space-y-16">

          {/* ══ 1. COLORS ═══════════════════════════════════════════════ */}
          <section>
            <SectionHead id="colors" n="01" title="Color Tokens" sub="Nguồn gốc từ @theme trong globals.css — single source of truth" />

            <div className="space-y-8">

              <div>
                <GroupLabel>Brand — lime green (rebrand 2026)</GroupLabel>
                <Row>
                  <Swatch hex="#B3E653" label="Brand Primary"   token="--color-brand / --color-primary-500" />
                  <Swatch hex="#9AD534" label="Brand Hover"     token="--color-brand-hover" />
                  <Swatch hex="#F2FADD" label="Brand Tint"      token="--color-brand-tint / --color-primary-100" />
                  <Swatch hex="#E9F6D4" label="Brand Surface"   token="--color-brand-surface / --color-primary-200" />
                </Row>
              </div>

              <div>
                <GroupLabel>Primary scale — full ramp (#B3E653)</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['#FBFEF3','50'],['#F2FADD','100'],['#E9F6D4','200'],['#D8EFAE','300'],
                    ['#C6EA82','400'],['#B3E653','500 ★'],['#9AD534','600'],['#7DB024','700'],
                    ['#5E8420','800'],['#466420','900'],['#26380E','950'],
                  ].map(([hex, n]) => (
                    <div key={n} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-lg border border-black/10" style={{ background: hex }} />
                      <span className="text-[9px] font-mono text-[#6A7282]">{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <GroupLabel>Ink — text hierarchy</GroupLabel>
                <Row>
                  <Swatch hex="#191D24" label="Ink/900 · Text"  token="--color-ink-900 / --color-default" />
                  <Swatch hex="#242938" label="Ink/700"          token="--color-ink-700" />
                  <Swatch hex="#2E3640" label="Ink/Body"         token="--color-ink-body" />
                  <Swatch hex="#6A7282" label="Ink/Muted"        token="--color-ink-muted" />
                </Row>
              </div>

              <div>
                <GroupLabel>Surface</GroupLabel>
                <Row>
                  <Swatch hex="#1E1E1E" label="Surface/Page"   token="--color-surface-page" />
                  <Swatch hex="#FFFFFF" label="Surface/Card"   token="--color-surface-card" />
                  <Swatch hex="#FFF2F2" label="Surface/Blush"  token="--color-surface-blush" />
                </Row>
              </div>

              <div>
                <GroupLabel>Border</GroupLabel>
                <Row>
                  <Swatch hex="#191D24" label="Border/Subtle"    token="--color-border-subtle" />
                  <Swatch hex="#E5E6E8" label="Border/Hairline"  token="--color-border-hairline" />
                </Row>
              </div>

              <div>
                <GroupLabel>Accents</GroupLabel>
                <Row>
                  <Swatch hex="#FC945A" label="Orange"   token="--color-accent-orange" />
                  <Swatch hex="#5281F9" label="Blue"     token="--color-accent-blue" />
                  <Swatch hex="#FBDD60" label="Yellow"   token="--color-accent-yellow" />
                  <Swatch hex="#60FB87" label="Green"    token="--color-accent-green" />
                  <Swatch hex="#EA8D95" label="Pink"     token="--color-accent-pink" />
                  <Swatch hex="#F96B8B" label="Rose"     token="--color-accent-rose" />
                  <Swatch hex="#169B86" label="Teal"     token="--color-accent-teal" />
                  <Swatch hex="#7C6EF9" label="Violet"   token="--color-accent-violet" />
                </Row>
              </div>

              <div>
                <GroupLabel>State</GroupLabel>
                <Row>
                  <Swatch hex="#E54552" label="Danger"   token="--color-danger" />
                </Row>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 2. TYPOGRAPHY ═══════════════════════════════════════════ */}
          <section>
            <SectionHead id="typography" n="02" title="Typography" sub="Be Vietnam Pro (headings / display) · Inter (body)" />

            <div className="bg-white rounded-2xl border border-[#E5E6E8] p-8 space-y-5">

              {/* Display */}
              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">display-l</span>
                <p className="font-display font-bold leading-[1.04] tracking-[-3px] text-[60px] text-[#191D24]">
                  Display Large
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">60px · 700 · -3px</span>
              </div>

              {/* Headings */}
              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">heading-1</span>
                <p className="font-display font-bold leading-[1.1] tracking-[-2.5px] text-[38px] text-[#191D24]">
                  Heading One — 38px
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">38px · 700 · -2.5px</span>
              </div>

              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">heading-2</span>
                <p className="font-display font-bold leading-[1.2] tracking-[-1px] text-[24px] text-[#191D24]">
                  Heading Two — 24px
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">24px · 700 · -1px</span>
              </div>

              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">title-m</span>
                <p className="font-display font-bold leading-[1.3] text-[19px] text-[#191D24]">
                  Title Medium — 19px
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">19px · 700</span>
              </div>

              {/* Body */}
              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">body-l</span>
                <p className="font-inter text-[18px] leading-[1.5] text-[#2E3640]">
                  Body Large — The quick brown fox jumps over the lazy dog.
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">18px · 400 · 1.5</span>
              </div>

              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">body-m</span>
                <p className="font-inter text-[16px] leading-[1.5] text-[#2E3640]">
                  Body Medium — The quick brown fox jumps over the lazy dog.
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">16px · 400 · 1.5</span>
              </div>

              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">body-s</span>
                <p className="font-inter text-[14px] leading-[1.4] text-[#2E3640]">
                  Body Small — Secondary content, meta info, captions.
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">14px · 400 · 1.4</span>
              </div>

              {/* Labels */}
              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">label-bold</span>
                <p className="font-inter text-[14px] font-bold leading-[1.2] text-[#191D24]">
                  Label Bold — Button labels, form labels
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">14px · 700</span>
              </div>

              <div className="flex items-baseline gap-4 py-3 border-b border-[#F0F1F2]">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">caption-bold</span>
                <p className="font-inter text-[12px] font-bold leading-[1.2] text-[#6A7282]">
                  Caption Bold — Badges, tags, meta
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">12px · 700</span>
              </div>

              <div className="flex items-baseline gap-4 py-3">
                <span className="w-28 shrink-0 text-[10px] font-mono text-[#9AA0AD] uppercase">eyebrow</span>
                <p className="font-inter text-[12px] font-bold leading-[1.2] tracking-[8px] uppercase text-[#B3E653]">
                  Eyebrow Label
                </p>
                <span className="text-xs text-[#9AA0AD] font-mono ml-auto shrink-0">12px · 700 · +8px</span>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 3. ATOMS ════════════════════════════════════════════════ */}
          <section>
            <SectionHead id="atoms" n="03" title="Atoms" sub="Smallest independent UI elements — src/shared/ui/ds/atoms/" />

            {/* Button */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6 space-y-6">
              <GroupLabel>Button — variants</GroupLabel>

              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">primary</p>
                <Row>
                  <Button variant="primary" size="sm" leftIcon={<PlusIcon />}>Small</Button>
                  <Button variant="primary" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Default</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </Row>
              </div>

              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">secondary</p>
                <Row>
                  <Button variant="secondary" size="sm">Small</Button>
                  <Button variant="secondary" leftIcon={<PlusIcon />}>Default</Button>
                  <Button variant="secondary" size="lg">Large</Button>
                  <Button variant="secondary" disabled>Disabled</Button>
                </Row>
              </div>

              {/* dark — Figma canonical */}
              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">dark <span className="text-[#B3E653]">✦ Figma</span></p>
                <Row>
                  <Button variant="dark" size="sm" leftIcon={<PlusIcon />}>Small</Button>
                  <Button variant="dark" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Default</Button>
                  <Button variant="dark" size="lg">Large</Button>
                  <Button variant="dark" disabled>Disabled</Button>
                </Row>
              </div>

              {/* outlined (= Figma Ghost) */}
              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">outlined <span className="text-[#B3E653]">✦ Figma Ghost</span></p>
                <Row>
                  <Button variant="outlined" size="sm">Small</Button>
                  <Button variant="outlined" leftIcon={<PlusIcon />}>Default</Button>
                  <Button variant="outlined" size="lg">Large</Button>
                  <Button variant="outlined" disabled>Disabled</Button>
                </Row>
              </div>

              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">ghost · accent · link · danger</p>
                <Row>
                  <Button variant="ghost" leftIcon={<PlusIcon />}>Ghost</Button>
                  <Button variant="accent" leftIcon={<PlusIcon />}>Accent</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="danger">Danger</Button>
                  <span className="px-4 py-2 bg-[#191D24] rounded-lg">
                    <Button variant="white">White (dark bg)</Button>
                  </span>
                </Row>
              </div>

              {/* icon-circle — Figma canonical */}
              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">icon-circle <span className="text-[#B3E653]">✦ Figma — 36/48/56px, white→green hover</span></p>
                <Row>
                  <div className="flex flex-col items-center gap-1">
                    <Button variant="icon-circle" size="sm" icon={<img src="/assets/icons/ArrowRight.svg" width={20} height={20} />} aria-label="sm" />
                    <span className="text-[9px] text-[#9AA0AD] font-mono">sm 36px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Button variant="icon-circle" size="md" icon={<img src="/assets/icons/ArrowRight.svg" width={20} height={20} />} aria-label="md" />
                    <span className="text-[9px] text-[#9AA0AD] font-mono">md 48px</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Button variant="icon-circle" size="lg" icon={<img src="/assets/icons/ArrowRight.svg" width={20} height={20} />} aria-label="lg" />
                    <span className="text-[9px] text-[#9AA0AD] font-mono">lg 56px</span>
                  </div>
                </Row>
              </div>

              <div>
                <p className="text-xs text-[#9AA0AD] mb-2 font-mono">fullWidth</p>
                <div className="max-w-sm flex flex-col gap-2">
                  <Button variant="primary" fullWidth leftIcon={<PlusIcon />}>Full Width Primary</Button>
                  <Button variant="dark" fullWidth>Full Width Dark</Button>
                  <Button variant="outlined" fullWidth>Full Width Ghost</Button>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>Input</GroupLabel>
              <div className="flex flex-col gap-3 max-w-sm">
                <Input size="sm"  placeholder="Small input (sm)" />
                <Input size="md"  placeholder="Medium input (md) — default" />
                <Input size="lg"  placeholder="Large input (lg)" />
                <Input placeholder="Error state" error />
                <Input placeholder="Disabled" disabled />
              </div>
            </div>

            {/* Badge */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>Badge</GroupLabel>
              <div className="mb-3">
                <p className="text-[10px] text-[#9AA0AD] font-mono mb-2">Figma node 3034:257–260 ✦</p>
                <Row>
                  <Badge variant="pro">PRO</Badge>
                  <Badge variant="new">NEW</Badge>
                </Row>
              </div>
              <Row>
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </Row>
              <Row>
                <Badge variant="reading">Reading</Badge>
                <Badge variant="listening">Listening</Badge>
                <Badge variant="speaking">Speaking</Badge>
                <Badge variant="writing">Writing</Badge>
              </Row>
            </div>

            {/* Avatar */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>Avatar — sizes xs · sm · md · lg · xl</GroupLabel>
              <Row>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="xs" name="AB" />
                  <span className="text-[10px] text-[#9AA0AD] font-mono">xs</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="sm" name="CD" />
                  <span className="text-[10px] text-[#9AA0AD] font-mono">sm</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="md" name="Nguyen A" />
                  <span className="text-[10px] text-[#9AA0AD] font-mono">md</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="lg" name="Tran B" />
                  <span className="text-[10px] text-[#9AA0AD] font-mono">lg</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="xl" name="User" />
                  <span className="text-[10px] text-[#9AA0AD] font-mono">xl</span>
                </div>
              </Row>
            </div>

            {/* Tag */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>Tag — colors &amp; variants</GroupLabel>
              <Row>
                <Tag>Default</Tag>
                <Tag color="primary">Primary</Tag>
                <Tag color="reading">Reading</Tag>
                <Tag color="listening">Listening</Tag>
                <Tag color="speaking">Speaking</Tag>
                <Tag color="writing">Writing</Tag>
              </Row>
              <Row>
                <Tag variant="outlined">Outlined</Tag>
                <Tag color="primary" active>Active</Tag>
                <Tag removable>Removable ×</Tag>
              </Row>
            </div>

            {/* PartTag */}
            <div className="mb-10 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>PartTag — Parts 1–5</GroupLabel>
              <Row>
                <PartTag part={1} />
                <PartTag part={2} />
                <PartTag part={3} />
                <PartTag part={4} />
                <PartTag part={5} />
              </Row>
            </div>

            {/* Spinner */}
            <div className="mb-2 bg-white rounded-2xl border border-[#E5E6E8] p-6">
              <GroupLabel>Spinner — sm · md · lg</GroupLabel>
              <Row>
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </Row>
            </div>
          </section>

          <Divider />

          {/* ══ 4. INPUTS & DATA ════════════════════════════════════════ */}
          <section>
            <SectionHead
              id="inputs-data" n="04" title="Inputs & Data"
              sub="Text input · Score ring · Checkbox — Figma node 3035:224"
            />

            {/* Dark-background showcase card — mirrors Figma canvas */}
            <div className="rounded-2xl bg-[#191d24] p-8 space-y-8">

              {/* ── Text input — States ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Text input — State</p>
                <div className="bg-[#242938] rounded-xl p-6 flex flex-wrap gap-8 items-start">

                  {/* Default */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter">Default</p>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-white font-inter">Email address</label>
                      <Input size="lg" placeholder="you@email.com" />
                    </div>
                  </div>

                  {/* Focused (simulated via autoFocus wrapper) */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter">Focused</p>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-white font-inter">Email address</label>
                      <div
                        className="inline-flex items-center h-[48px] px-4 rounded-[14px] bg-white
                          border-2 border-[#b3e653] shadow-[0_0_0_3px_rgba(179,230,83,0.4)]
                          text-[16px] text-[#191d24] font-inter w-[240px] shrink-0"
                      >
                        minh.ha@email.com
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter">Error</p>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-bold text-white font-inter">Email address</label>
                      <Input size="lg" error defaultValue="minh.ha@email.com" />
                      <p className="text-[14px] text-[#e5484d] font-inter">Please enter a valid email address</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Score ring — States ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Score ring — State</p>
                <div className="bg-[#242938] rounded-xl p-6 flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <ScoreRing band="8.5" state="default" />
                    <p className="text-[11px] text-[#6a7282] font-mono">default</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ScoreRing band="8.5" state="muted" />
                    <p className="text-[11px] text-[#6a7282] font-mono">muted</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ScoreRing band="5.5" state="default" />
                    <p className="text-[11px] text-[#6a7282] font-mono">5.5</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ScoreRing band="9.0" state="default" />
                    <p className="text-[11px] text-[#6a7282] font-mono">9.0</p>
                  </div>
                </div>
              </div>

              {/* ── Checkbox ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Check box</p>
                <div className="bg-[#242938] rounded-xl p-6 flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox checked={false} />
                    <p className="text-[11px] text-[#6a7282] font-mono">unchecked</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox checked={true} />
                    <p className="text-[11px] text-[#6a7282] font-mono">checked</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox checked={cbChecked} onChange={setCbChecked} aria-label="Toggle" />
                    <p className="text-[11px] text-[#6a7282] font-mono">interactive</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Checkbox checked={true} aria-label="Option A" />
                    <span className="text-white text-[14px] font-inter">Option A</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={false} aria-label="Option B" />
                    <span className="text-[#9ca3af] text-[14px] font-inter">Option B</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 5. ICONS ════════════════════════════════════════════════ */}
          <section>
            <SectionHead
              id="icons" n="05" title="Icons"
              sub="public/assets/icons/ — stroke=white, dùng trên nền tối · 24×24px"
            />

            <div className="bg-[#191D24] rounded-2xl border border-[#2A2F3A] p-6">
              {/* Usage hint */}
              <div className="mb-5 px-3 py-2 bg-[#242938] rounded-lg inline-flex items-center gap-2">
                <span className="text-[#6A7282] text-xs font-mono">Usage:</span>
                <code className="text-[#B3E653] text-xs font-mono">
                  {'<img src="/assets/icons/IconName.svg" width={24} height={24} />'}
                </code>
              </div>

              {/* Icon grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1">
                {ICONS.map(name => (
                  <div
                    key={name}
                    id={`icon-${name}`}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#242938] transition-colors cursor-default"
                    title={`/assets/icons/${name}.svg`}
                  >
                    {/* Icon */}
                    <img
                      src={`/assets/icons/${name}.svg`}
                      width={24}
                      height={24}
                      alt={name}
                      className="shrink-0"
                    />
                    {/* Name */}
                    <span className="text-[#6A7282] group-hover:text-[#B3E653] text-[9px] font-mono text-center leading-tight break-all transition-colors">
                      {name}
                    </span>
                  </div>
                ))}
              </div>

              {/* ID reference note */}
              <p className="mt-5 text-[#3A4050] text-[10px] font-mono">
                Mỗi icon có <span className="text-[#6A7282]">id="icon-&#123;Name&#125;"</span> — dùng để anchor/reference trong docs. Hover để xem path đầy đủ.
              </p>
            </div>
          </section>

          <Divider />

          {/* ══ 6. MOLECULES ════════════════════════════════════════════ */}
          <section>
            <SectionHead id="molecules" n="06" title="Molecules" sub="Composed from atoms — src/shared/ui/ds/molecules/" />

            <div className="space-y-10">

              {/* FormField */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6">
                <GroupLabel>FormField — login form example</GroupLabel>
                <div className="max-w-sm flex flex-col gap-5">
                  <FormField label="Số điện thoại"  placeholder="Nhập số điện thoại" />
                  <FormField label="Mật khẩu"  type="password" placeholder="Nhập mật khẩu" required />
                  <FormField label="Email" placeholder="example@email.com" errorMessage="Email không hợp lệ" error />
                  <Button variant="primary" fullWidth>Đăng nhập</Button>
                </div>
              </div>

              {/* NavLink + Breadcrumb */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6 space-y-6">
                <div>
                  <GroupLabel>NavLink</GroupLabel>
                  <Row>
                    <NavLink href="#" active>Active Link</NavLink>
                    <NavLink href="#">Normal Link</NavLink>
                    <NavLink href="#">Another Link</NavLink>
                  </Row>
                </div>
                <div>
                  <GroupLabel>Breadcrumb</GroupLabel>
                  <Breadcrumb items={[
                    { label: 'Trang chủ', href: '#' },
                    { label: 'Đăng nhập & Đăng ký', href: '#' },
                    { label: 'Đăng nhập' },
                  ]} />
                </div>
              </div>

              {/* TestCard */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6">
                <GroupLabel>TestCard</GroupLabel>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-4">
                  <TestCard
                    image="https://picsum.photos/400/250?random=1"
                    title="Bridge to Brisbane Fun Run 2026"
                    attempts={1195} part={1} isPro={true}
                    actionText="Kiểm Tra" score="9,0"
                    author="Admin Tea" views={5200}
                  />
                  <TestCard
                    image="https://picsum.photos/400/250?random=2"
                    title="IELTS Listening Practice Test 1"
                    subtitle="Full Listening Test"
                    skill="listening" author="Admin Tea" views={3800}
                  />
                  <TestCard
                    image="https://picsum.photos/400/250?random=3"
                    title="IELTS Full Test — Academic"
                    subtitle="Complete Practice"
                    skill="writing" author="Admin Tea" views={7100}
                  />
                </div>
              </div>

              {/* BlogCard */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6">
                <GroupLabel>BlogCard</GroupLabel>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-4">
                  <BlogCard
                    image="https://picsum.photos/400/250?random=4"
                    title="Mastering IELTS Reading: Tips for Band 7+"
                    excerpt="Proven strategies to improve your Reading score."
                    category="IELTS Tips" date="25/03/2026" readTime="5 min"
                  />
                  <BlogCard
                    image="https://picsum.photos/400/250?random=5"
                    title="Listening Prediction March 2026"
                    excerpt="Forecast bộ đề IELTS Listening dự đoán kỳ thi."
                    category="Prediction" date="20/03/2026" readTime="3 min"
                  />
                </div>
              </div>

              {/* StatCard */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6">
                <GroupLabel>StatCard</GroupLabel>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 mt-4">
                  <StatCard icon="📝" value="128"  label="Tests Completed"  trend={{ value: '+12%', positive: true }} />
                  <StatCard icon="⏱️" value="45h"  label="Study Hours"      trend={{ value: '+8%',  positive: true }} />
                  <StatCard icon="🎯" value="6.5"  label="Avg Band Score"   trend={{ value: '-0.5', positive: false }} />
                </div>
              </div>

              {/* PricingCard */}
              <div className="bg-white rounded-2xl border border-[#E5E6E8] p-6">
                <GroupLabel>PricingCard</GroupLabel>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 mt-4">
                  <PricingCard
                    name="Basic" price="299,000đ" priceLabel="/tháng"
                    features={['Truy cập đề thi Reading', 'Truy cập đề thi Listening', 'Giải thích đáp án chi tiết']}
                  />
                  <PricingCard
                    name="Premium" price="499,000đ" priceLabel="/tháng" popular
                    features={['Tất cả tính năng Basic', 'Prediction đề mới nhất', 'Hỗ trợ Speaking & Writing', 'Analytics & Progress']}
                  />
                  <PricingCard
                    name="Enterprise" price="1,000,000đ" priceLabel="/tháng"
                    features={['Tất cả tính năng Premium', 'Truy cập không giới hạn', 'Priority support']}
                  />
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 7. CARDS ════════════════════════════════════════════════ */}
          <section>
            <SectionHead
              id="cards" n="07" title="Cards"
              sub="SkillCard · CourseCard — Figma node 3035:249"
            />

            <div className="rounded-2xl bg-[#191d24] p-8 space-y-8">

              {/* ── Skill cards ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Skill card — Skill</p>
                <div className="bg-[#242938] rounded-xl p-6 flex flex-wrap gap-5">
                  <SkillCard skill="listening" />
                  <SkillCard skill="reading" />
                  <SkillCard skill="writing" />
                  <SkillCard skill="speaking" />
                </div>
              </div>

              {/* ── Course cards ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Course card — Badge × State</p>
                <div className="bg-[#242938] rounded-xl p-6 flex flex-wrap gap-8 items-start">
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter">Default</p>
                    <CourseCard />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter">Hover (simulated)</p>
                    <CourseCard forceHover />
                  </div>
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 8. TOASTS ══════════════════════════════════════════════ */}
          <section>
            <SectionHead id="toasts" n="08" title="Toasts & Notifications" sub="5 variants — success · error · warning · info · loading" />

            <div className="rounded-2xl bg-[#191d24] p-8 space-y-8">

              {/* ── All types ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Toast — Type</p>
                <div className="bg-[#262626] rounded-2xl p-7 flex flex-col gap-[14px] items-start">
                  <Toast type="success" />
                  <Toast type="error" />
                  <Toast type="warning" />
                  <Toast type="info" />
                  <Toast type="loading" />
                </div>
              </div>

              {/* ── Custom content example ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Toast — Custom content</p>
                <div className="bg-[#262626] rounded-2xl p-7 flex flex-wrap gap-[14px]">
                  <Toast
                    type="success"
                    title="Payment confirmed"
                    message="Your Pro subscription is now active."
                    actionLabel="Go to dashboard"
                  />
                  <Toast
                    type="error"
                    title="Upload failed"
                    message="File exceeds the 10 MB limit. Please compress and retry."
                    actionLabel="Retry"
                  />
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 9. NAVIGATION ══════════════════════════════════════════ */}
          <section>
            <SectionHead
              id="navigation" n="09" title="Navigation"
              sub="Sidebar (Student · Teacher) · Nav item · Top actions — Figma node 3596:161"
            />

            <div className="space-y-10">

              {/* ── Sidebar — State ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Sidebar — State</p>
                <div className="bg-[#262626] rounded-[20px] p-7 overflow-x-auto">
                  <div className="flex gap-5 items-start min-w-max">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter mb-1">Student · Expanded</p>
                      <SidebarStudent state="expanded" activeItem="home" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter mb-1">Student · Collapsed</p>
                      <SidebarStudent state="collapsed" activeItem="home" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter mb-1">Teacher · Expanded</p>
                      <SidebarTeacher state="expanded" activeItem="overview" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[11px] font-bold text-[#6a7282] uppercase tracking-widest font-inter mb-1">Teacher · Collapsed</p>
                      <SidebarTeacher state="collapsed" activeItem="overview" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Nav item — State ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Nav item — State</p>
                <div className="bg-[#262626] rounded-[20px] p-7">
                  <div className="flex flex-wrap gap-4 items-start">
                    <div className="flex flex-col items-start gap-2 bg-white rounded-[16px] p-4">
                      <p className="text-[10px] text-[#9aa0ad] font-mono mb-1">active · expanded</p>
                      <SidebarNavItem icon="home" label="Home" active collapsed={false} />
                    </div>
                    <div className="flex flex-col items-start gap-2 bg-white rounded-[16px] p-4">
                      <p className="text-[10px] text-[#9aa0ad] font-mono mb-1">inactive · expanded</p>
                      <SidebarNavItem icon="home" label="Home" active={false} collapsed={false} />
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white rounded-[16px] p-4">
                      <p className="text-[10px] text-[#9aa0ad] font-mono mb-1">active · collapsed</p>
                      <SidebarNavItem icon="home" label="Home" active collapsed={true} />
                    </div>
                    <div className="flex flex-col items-center gap-2 bg-white rounded-[16px] p-4">
                      <p className="text-[10px] text-[#9aa0ad] font-mono mb-1">inactive · collapsed</p>
                      <SidebarNavItem icon="home" label="Home" active={false} collapsed={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Top actions ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Top actions</p>
                <div className="bg-[#262626] rounded-[20px] p-7">
                  <SidebarTopActions />
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 10. CONTROLS & NAVIGATION ══════════════════════════════ */}
          <section>
            <SectionHead
              id="controls" n="10" title="Controls & Navigation"
              sub="Tabs · Select · Stepper · Progress bar · Pagination — Figma node 3651:161"
            />

            <div className="rounded-2xl bg-[#191d24] p-8 space-y-8">

              {/* Tabs */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Tabs — State</p>
                <div className="bg-[#262626] rounded-[20px] px-7 py-8">
                  <Tabs
                    tabs={[
                      { id: 'overview', label: 'Overview' },
                      { id: 'reading',  label: 'Reading' },
                      { id: 'writing',  label: 'Writing' },
                      { id: 'speaking', label: 'Speaking' },
                    ]}
                    activeId={activeTab}
                    onChange={setActiveTab}
                  />
                </div>
              </div>

              {/* Select */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Select — State</p>
                <div className="bg-[#262626] rounded-[20px] px-7 py-8 flex gap-9">
                  {/* Closed */}
                  <Select
                    label="Question type"
                    options={[
                      { value: 'multiple_choice',    label: 'Multiple choice' },
                      { value: 'gap_filling',        label: 'Gap filling' },
                      { value: 'matching_headings',  label: 'Matching headings' },
                      { value: 'true_false',         label: 'True / False / Not given' },
                    ]}
                    value={selectVal}
                    onChange={setSelectVal}
                  />
                  {/* Controlled — shown open via forceOpen not needed; second instance demonstrates selected value */}
                  <Select
                    label="Skill"
                    options={[
                      { value: 'reading',   label: 'Reading' },
                      { value: 'listening', label: 'Listening' },
                      { value: 'writing',   label: 'Writing' },
                      { value: 'speaking',  label: 'Speaking' },
                    ]}
                    value="reading"
                    onChange={() => undefined}
                  />
                </div>
              </div>

              {/* FilterDropdown */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Filter dropdown <span className="text-[#6a7282]">— Figma 3521:116 / 3521:130</span></p>
                <div className="bg-[#262626] rounded-[20px] px-7 py-8 flex gap-[10px] items-start">
                  <FilterDropdown
                    label="Category"
                    options={[
                      { value: 'reading', label: 'Reading' },
                      { value: 'writing', label: 'Writing' },
                      { value: 'speaking', label: 'Speaking' },
                      { value: 'listening', label: 'Listening' },
                      { value: 'vocabulary', label: 'Vocabulary' },
                      { value: 'exam_tips', label: 'Exam tips' },
                    ]}
                    selected={filterSel}
                    onChange={setFilterSel}
                  />
                  <FilterDropdown
                    label="Read time"
                    options={[
                      { value: 'short', label: '< 5 min' },
                      { value: 'medium', label: '5–10 min' },
                      { value: 'long', label: '> 10 min' },
                    ]}
                    selected={[]}
                    onChange={() => undefined}
                  />
                </div>
              </div>

              {/* Stepper + ProgressBar */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Stepper &amp; progress</p>
                <div className="bg-[#262626] rounded-[20px] px-7 py-8 flex flex-col gap-7">
                  <Stepper
                    steps={[
                      { id: '1', label: 'Account', status: 'done' },
                      { id: '2', label: 'Plan',    status: 'active' },
                      { id: '3', label: 'Payment', status: 'pending' },
                      { id: '4', label: 'Done',    status: 'pending' },
                    ]}
                  />
                  <ProgressBar label="Course progress" value={65} width={420} />
                </div>
              </div>

              {/* Pagination */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Pagination</p>
                <div className="bg-[#262626] rounded-[20px] px-7 py-8">
                  <Pagination total={5} page={paginationPage} onChange={setPaginationPage} />
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* ══ 11. DATA DISPLAY ════════════════════════════════════════ */}
          <section>
            <SectionHead
              id="data-display" n="11" title="Data Display"
              sub="Avatar (with status) · ResultsTable · Tooltip — Figma node 3653:167"
            />

            <div className="space-y-10">

              {/* ── Avatar — Size ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Avatar — Size</p>
                <div className="bg-[#262626] rounded-[20px] px-[28px] py-[32px]">
                  <div className="flex gap-[16px] items-center">
                    <Avatar size="xs" name="NM" />
                    <Avatar size="sm" name="NM" />
                    <Avatar size="md" name="NM" />
                    <Avatar size="lg" name="NM" />
                    <Avatar size="md" name="AL" bg="#169b86" textColor="white" status />
                  </div>
                </div>
              </div>

              {/* ── Table — Results ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Table — Results</p>
                <div className="bg-[#262626] rounded-[20px] px-[28px] py-[32px]">
                  <ResultsTable
                    rows={[
                      { test: 'Academic Reading 12', date: 'Jun 6, 2026',  band: '7.5', status: 'passed'    },
                      { test: 'Listening Test 8',    date: 'Jun 3, 2026',  band: '8.0', status: 'passed'    },
                      { test: 'Writing Task 2',      date: 'Jun 1, 2026',               status: 'in-review' },
                      { test: 'Speaking Mock 4',     date: 'May 28, 2026', band: '6.0', status: 'retry'     },
                    ]}
                    className="max-w-[720px]"
                  />
                </div>
              </div>

              {/* ── Tooltip — Top ── */}
              <div>
                <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Tooltip — Top</p>
                <div className="bg-[#262626] rounded-[20px] px-[28px] py-[48px] flex items-start">
                  <Tooltip content="Band score out of 9" forceOpen>
                    <div className="bg-white border border-[#e5e8eb] flex items-center justify-center px-[14px] py-[8px] rounded-full">
                      <span className="text-[13px] font-semibold font-inter text-[#2e3640] whitespace-nowrap">Hover me</span>
                    </div>
                  </Tooltip>
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>

      {/* ══ 12. ORGANISMS ═══════════════════════════════════════════════ */}
      {/* Full-width — rendered outside constrained layout intentionally */}
      <div id="organisms" style={{ scrollMarginTop: 80 }} className="space-y-12 pb-0">

        <div className="px-10 max-w-[1400px] mx-auto">
          <div className="mb-8">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-sm font-bold text-[#B3E653] font-display tracking-widest uppercase">12</span>
              <h2 className="text-2xl font-bold text-[#191D24] font-display">Organisms</h2>
            </div>
            <p className="text-sm text-[#6A7282] font-inter mt-1">Full-width layout components — Header · CTABanner · Footer</p>
            <div className="mt-3 h-px bg-[#E5E6E8]" />
          </div>
        </div>

        <div className="px-10 max-w-[1400px] mx-auto">
          <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Header — Figma node 3040:226</p>
        </div>
        <Header navItems={NAV_ITEMS} />

        <div className="px-10 max-w-[1400px] mx-auto">
          <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">CTABanner</p>
        </div>
        <CTABanner
          title="Sẵn sàng cho kì thi IELTS máy?"
          subtitle="Ôn luyện trên các bài thi sát thực đề, xem giải thích chi tiết trước khi bước vào phòng thi!"
          ctaText="Bắt đầu luyện thi"
        />

        <div className="px-10 max-w-[1400px] mx-auto">
          <p className="text-[14px] font-bold text-[#b3e653] mb-5 font-inter">Footer — Figma node 3366:74</p>
        </div>
        <Footer
          columns={FOOTER_COLS}
          showCopyright
        />
      </div>
    </div>
  );
}
