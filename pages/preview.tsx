// Styles loaded globally via _app.tsx → styles.css

import { Button } from '@/shared/ui/ds/atoms/button';
import { Input } from '@/shared/ui/ds/atoms/input';
import { Badge } from '@/shared/ui/ds/atoms/badge';
import { Avatar } from '@/shared/ui/ds/atoms/avatar';
import { Tag } from '@/shared/ui/ds/atoms/tag';
import { PartTag } from '@/shared/ui/ds/atoms/part-tag';
import { Divider } from '@/shared/ui/ds/atoms/divider';
import { Spinner } from '@/shared/ui/ds/atoms/spinner';
import { FormField } from '@/shared/ui/ds/molecules/form-field';
import { NavLink } from '@/shared/ui/ds/molecules/nav-link';
import { Breadcrumb } from '@/shared/ui/ds/molecules/breadcrumb';
import { TestCard } from '@/shared/ui/ds/molecules/test-card';
import { BlogCard } from '@/shared/ui/ds/molecules/blog-card';
import { StatCard } from '@/shared/ui/ds/molecules/stat-card';
import { PricingCard } from '@/shared/ui/ds/molecules/pricing-card';
import { Header } from '@/shared/ui/ds/organisms/header';
import { Footer } from '@/shared/ui/ds/organisms/footer';
import { CTABanner } from '@/shared/ui/ds/organisms/cta-banner';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_29_35)">
      <path d="M14.5938 6.59375H9.40625V1.40625C9.40625 0.629594 8.77666 0 8 0C7.22334 0 6.59375 0.629594 6.59375 1.40625V6.59375H1.40625C0.629594 6.59375 0 7.22334 0 8C0 8.77666 0.629594 9.40625 1.40625 9.40625H6.59375V14.5938C6.59375 15.3704 7.22334 16 8 16C8.77666 16 9.40625 15.3704 9.40625 14.5938V9.40625H14.5938C15.3704 9.40625 16 8.77666 16 8C16 7.22334 15.3704 6.59375 14.5938 6.59375Z" fill="currentColor"/>
    </g>
    <defs>
      <clipPath id="clip0_29_35">
        <rect width="16" height="16" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const s = {
  page: { fontFamily: "'Noto Sans', sans-serif", background: '#f5f5f5', minHeight: '100vh' } as React.CSSProperties,
  section: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px' } as React.CSSProperties,
  title: { fontSize: 28, fontWeight: 700, color: '#171717', marginBottom: 8, borderBottom: '3px solid #D94A56', paddingBottom: 8, display: 'inline-block' } as React.CSSProperties,
  sub: { fontSize: 14, color: '#737373', marginBottom: 32 } as React.CSSProperties,
  group: { marginBottom: 40 } as React.CSSProperties,
  label: { fontSize: 16, fontWeight: 600, color: '#404040', marginBottom: 16, textTransform: 'uppercase' as const, letterSpacing: '0.05em' } as React.CSSProperties,
  row: { display: 'flex', flexWrap: 'wrap' as const, gap: 12, alignItems: 'center', marginBottom: 16 } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 } as React.CSSProperties,
  swatch: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: '#fff', border: '1px solid #e5e5e5', fontSize: 13 } as React.CSSProperties,
  circle: (c: string) => ({ width: 32, height: 32, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }),
  hero: { background: '#D94A56', padding: '60px 24px', textAlign: 'center' as const, color: '#fff' } as React.CSSProperties,
  box: { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e5e5' } as React.CSSProperties,
};

const NAV = [
  { label: 'IELTS Online Test', href: '#', active: true, children: [{ label: 'Practice - Listening', href: '#' }, { label: 'Practice - Reading', href: '#' }] },
  { label: 'IELTS Sample', href: '#' },
  { label: 'IELTS Prediction', href: '#' },
  { label: 'Subscription', href: '#' },
];

const FOOTER_COLS = [
  { title: 'Useful Links', links: [{ label: 'Home', href: '#' }, { label: 'IELTS Exam Library', href: '#' }, { label: 'Practice - Listening', href: '#' }, { label: 'Practice - Reading', href: '#' }, { label: 'Blog', href: '#' }] },
  { title: 'Our Company', links: [{ label: 'About Us', href: '#' }, { label: 'Contact Us', href: '#' }, { label: 'My Dashboard', href: '#' }, { label: 'My Profile', href: '#' }] },
];

export default function Preview() {
  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 8px' }}>🎨 Design System Preview</h1>
        <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>IELTS Prediction Test — Components Library</p>
      </div>

      {/* Colors — Figma Palette (6 cols × 3 rows) */}
      <div style={s.section}>
        <h2 style={s.title}>1. Color Tokens — Figma Palette</h2>
        <p style={s.sub}>Extracted from Figma COLOR PALETTE (node 14-137)</p>

        <div style={s.group}>
          <div style={s.label}>Brand (Solid)</div>
          <div style={s.row}>
            <div style={s.swatch}><div style={s.circle('#D94A56')} /><span>#D94A56 — Brand Primary</span></div>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Figma Palette — Row 1 (Saturated)</div>
          <div style={s.row}>
            <div style={s.swatch}><div style={s.circle('#D94A56')} /><span>#D94A56 Red</span></div>
            <div style={s.swatch}><div style={s.circle('#F2994A')} /><span>#F2994A Orange</span></div>
            <div style={s.swatch}><div style={s.circle('#F2C94C')} /><span>#F2C94C Yellow</span></div>
            <div style={s.swatch}><div style={s.circle('#27AE60')} /><span>#27AE60 Green</span></div>
            <div style={s.swatch}><div style={s.circle('#2F80ED')} /><span>#2F80ED Blue</span></div>
            <div style={s.swatch}><div style={s.circle('#242938')} /><span>#242938 Navy</span></div>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Figma Palette — Row 2 (Pastel / Mid)</div>
          <div style={s.row}>
            <div style={s.swatch}><div style={s.circle('#E0828B')} /><span>#E0828B</span></div>
            <div style={s.swatch}><div style={s.circle('#F5B88A')} /><span>#F5B88A</span></div>
            <div style={s.swatch}><div style={s.circle('#F5DA82')} /><span>#F5DA82</span></div>
            <div style={s.swatch}><div style={s.circle('#6FCF97')} /><span>#6FCF97</span></div>
            <div style={s.swatch}><div style={s.circle('#7FB3F5')} /><span>#7FB3F5</span></div>
            <div style={s.swatch}><div style={s.circle('#616B7B')} /><span>#616B7B</span></div>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Figma Palette — Row 3 (Light)</div>
          <div style={s.row}>
            <div style={s.swatch}><div style={s.circle('#F2C1C6')} /><span>#F2C1C6</span></div>
            <div style={s.swatch}><div style={s.circle('#FAD9BC')} /><span>#FAD9BC</span></div>
            <div style={s.swatch}><div style={s.circle('#FAE9B3')} /><span>#FAE9B3</span></div>
            <div style={s.swatch}><div style={s.circle('#C1F0D4')} /><span>#C1F0D4</span></div>
            <div style={s.swatch}><div style={s.circle('#C4DAF9')} /><span>#C4DAF9</span></div>
            <div style={s.swatch}><div style={s.circle('#DADDE3')} /><span>#DADDE3</span></div>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Primary Scale (from #D94A56)</div>
          <div style={s.row}>
            {['#FDF2F3','#FCE4E6','#F9CCD0','#F2A0A8','#E6717C','#D94A56','#C33040','#A42535','#892231','#76202F','#410D15'].map((c,i) => (
              <div key={i} style={{ ...s.swatch, padding: '4px 10px', fontSize: 11 }}><div style={s.circle(c)} /><span>{c}</span></div>
            ))}
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Neutrals</div>
          <div style={s.row}>
            {['#FFFFFF','#FAFAFA','#F5F5F5','#E5E5E5','#D4D4D4','#A3A3A3','#737373','#525252','#404040','#262626','#171717'].map((c,i) => (
              <div key={i} style={{ ...s.swatch, padding: '4px 10px', fontSize: 11 }}><div style={s.circle(c)} /><span>{c}</span></div>
            ))}
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>IELTS Skill Colors</div>
          <div style={s.row}>
            <div style={s.swatch}><div style={s.circle('#F2994A')} /><span>📖 Reading (Orange)</span></div>
            <div style={s.swatch}><div style={s.circle('#2F80ED')} /><span>🎧 Listening (Blue)</span></div>
            <div style={s.swatch}><div style={s.circle('#F2C94C')} /><span>🎤 Speaking (Yellow)</span></div>
            <div style={s.swatch}><div style={s.circle('#27AE60')} /><span>✍️ Writing (Green)</span></div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Typography */}
      <div style={s.section}>
        <h2 style={s.title}>2. Typography</h2>
        <p style={s.sub}>Noto Sans — All sizes and weights</p>
        <div style={s.box}>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 48, fontWeight: 800, margin: '0 0 8px', color: '#171717' }}>Heading 5XL — 48px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 36, fontWeight: 700, margin: '0 0 8px', color: '#171717' }}>Heading 4XL — 36px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: '#171717' }}>Heading 3XL — 28px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 24, fontWeight: 600, margin: '0 0 8px', color: '#262626' }}>Heading 2XL — 24px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#262626' }}>Heading XL — 20px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 18, fontWeight: 500, margin: '0 0 8px', color: '#404040' }}>Text LG — 18px</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 16, fontWeight: 400, margin: '0 0 8px', color: '#404040' }}>Text Base — 16px — Body text default</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 14, fontWeight: 400, margin: '0 0 8px', color: '#525252' }}>Text SM — 14px — Secondary</p>
          <p style={{ fontFamily: "'Noto Sans'", fontSize: 12, fontWeight: 400, margin: '0 0 4px', color: '#737373' }}>Text XS — 12px — Meta, captions</p>
        </div>
      </div>

      <Divider />

      {/* Atoms */}
      <div style={s.section}>
        <h2 style={s.title}>3. Atoms</h2>
        <p style={s.sub}>Smallest independent UI elements</p>

        {/* Button1 — Primary */}
        <div style={s.group}>
          <div style={s.label}>Button1 — Primary (Solid #D94A56)</div>
          <div style={s.row}>
            <Button variant="primary" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Texts</Button>
            <Button variant="primary" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="sm">Small</Button>
            <Button variant="primary" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="lg">Large</Button>
          </div>
          <div style={s.row}>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled leftIcon={<PlusIcon />}>Disabled</Button>
          </div>
        </div>

        {/* Button2 — Outlined (White → Red on hover) */}
        <div style={s.group}>
          <div style={s.label}>Button2 — Outlined (fills red on hover)</div>
          <div style={s.row}>
            <Button variant="outlined" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Texts</Button>
            <Button variant="outlined" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="sm">Small</Button>
            <Button variant="outlined" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="lg">Large</Button>
          </div>
          <div style={s.row}>
            <Button variant="outlined" disabled leftIcon={<PlusIcon />}>Disabled</Button>
          </div>
        </div>

        {/* Button3 — Ghost (dark text, transparent) */}
        <div style={s.group}>
          <div style={s.label}>Button3 — Ghost (transparent, dark text)</div>
          <div style={s.row}>
            <Button variant="ghost" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Text</Button>
            <Button variant="ghost" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="sm">Small</Button>
            <Button variant="ghost" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="lg">Large</Button>
          </div>
        </div>

        {/* Button4 — Ghost Dark (for dark/colored backgrounds) */}
        <div style={s.group}>
          <div style={s.label}>Button4 — Ghost Dark (REMOVED)</div>
          <p style={s.sub}>This variant was removed as it does not exist in the Figma Design System specs.</p>
        </div>

        {/* Button5 — Accent Outline (red icon/text, fills red on hover) */}
        <div style={s.group}>
          <div style={s.label}>Button5 — Accent Outlined (bold red text/icon → fills on hover)</div>
          <div style={s.row}>
            <Button variant="accent" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Texts</Button>
            <Button variant="accent" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="sm">Small</Button>
            <Button variant="accent" leftIcon={<PlusIcon />} rightIcon={<PlusIcon />} size="lg">Large</Button>
          </div>
        </div>

        {/* Icon Circle buttons */}
        <div style={s.group}>
          <div style={s.label}>Icon Circle — Next/Prev Slide buttons</div>
          <div style={s.row}>
            <Button variant="icon-circle" size="sm" icon={<span>›</span>} aria-label="Next" />
            <Button variant="icon-circle" size="md" icon={<span>›</span>} aria-label="Next" />
            <Button variant="icon-circle" size="lg" icon={<span>›</span>} aria-label="Next" />
            <Button variant="icon-circle" size="sm" icon={<span>‹</span>} aria-label="Previous" />
            <Button variant="icon-circle" size="md" icon={<span>‹</span>} aria-label="Previous" />
            <Button variant="icon-circle" size="lg" icon={<span>‹</span>} aria-label="Previous" />
          </div>
        </div>

        {/* Other variants */}
        <div style={s.group}>
          <div style={s.label}>Other — Link, Danger, Full Width</div>
          <div style={s.row}>
            <Button variant="link">Link button</Button>
            <Button variant="danger" leftIcon={<span>⚠</span>}>Danger</Button>
          </div>
          <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" fullWidth leftIcon={<PlusIcon />}>Full Width Primary</Button>
            <Button variant="outlined" fullWidth leftIcon={<PlusIcon />}>Full Width Outlined</Button>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Input</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
            <Input size="sm" placeholder="Small input" />
            <Input size="md" placeholder="Medium (default)" />
            <Input size="lg" placeholder="Large input" />
            <Input placeholder="Error state" error />
            <Input placeholder="Disabled" disabled />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Badge</div>
          <div style={s.row}>
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div style={s.row}>
            <Badge variant="reading">Reading</Badge>
            <Badge variant="listening">Listening</Badge>
            <Badge variant="speaking">Speaking</Badge>
            <Badge variant="writing">Writing</Badge>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Avatar</div>
          <div style={s.row}>
            <Avatar size="xs" name="AB" />
            <Avatar size="sm" name="CD" />
            <Avatar size="md" name="Nguyen Van A" />
            <Avatar size="lg" name="Tran B" />
            <Avatar size="xl" name="User" />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Tag</div>
          <div style={s.row}>
            <Tag>Default</Tag>
            <Tag color="primary">Primary</Tag>
            <Tag color="reading">Reading</Tag>
            <Tag color="listening">Listening</Tag>
            <Tag color="speaking">Speaking</Tag>
            <Tag color="writing">Writing</Tag>
          </div>
          <div style={s.row}>
            <Tag variant="outlined">Outlined</Tag>
            <Tag color="primary" active>Active</Tag>
            <Tag removable>Removable</Tag>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Part Tag</div>
          <div style={{ ...s.row, gap: 16 }}>
            <PartTag part={1} />
            <PartTag part={2} />
            <PartTag part={3} />
            <PartTag part={4} />
            <PartTag part={5} />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Spinner</div>
          <div style={s.row}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </div>
      </div>

      <Divider />

      {/* Molecules */}
      <div style={s.section}>
        <h2 style={s.title}>4. Molecules</h2>
        <p style={s.sub}>Composed from atoms</p>

        <div style={s.group}>
          <div style={s.label}>FormField (Login Form Example)</div>
          <div style={{ ...s.box, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FormField label="Số điện thoại" placeholder="Nhập số điện thoại" />
            <FormField label="Mật khẩu" type="password" placeholder="Nhập mật khẩu" required />
            <FormField label="Email" placeholder="example@email.com" errorMessage="Email không hợp lệ" error />
            <Button variant="primary" fullWidth>Đăng nhập</Button>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>NavLink</div>
          <div style={s.row}>
            <NavLink href="#" active>Active Link</NavLink>
            <NavLink href="#">Normal Link</NavLink>
            <NavLink href="#">Another Link</NavLink>
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>Breadcrumb</div>
          <Breadcrumb items={[{ label: 'Trang chủ', href: '#' }, { label: 'Đăng nhập & Đăng ký', href: '#' }, { label: 'Đăng nhập' }]} />
        </div>

        <div style={s.group}>
          <div style={s.label}>TestCard</div>
          <div style={s.grid}>
            <TestCard image="https://picsum.photos/400/250?random=1" title="[COM] Bridge to Brisbane Fun Run" subtitle="IELTS Reading Practice" skill="reading" author="Admin Tea" views={5200} />
            <TestCard image="https://picsum.photos/400/250?random=2" title="IELTS Listening Practice Test 1" subtitle="Full Listening Test" skill="listening" author="Admin Tea" views={3800} />
            <TestCard image="https://picsum.photos/400/250?random=3" title="IELTS Full Test — Academic" subtitle="Complete Practice" skill="writing" author="Admin Tea" views={7100} />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>BlogCard</div>
          <div style={s.grid}>
            <BlogCard image="https://picsum.photos/400/250?random=4" title="Mastering IELTS Reading: Tips for Band 7+" excerpt="Proven strategies to improve your Reading score." category="IELTS Tips" date="25/03/2026" readTime="5 min" />
            <BlogCard image="https://picsum.photos/400/250?random=5" title="Listening Prediction March 2026" excerpt="Forecast bộ đề IELTS Listening dự đoán kỳ thi." category="Prediction" date="20/03/2026" readTime="3 min" />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>StatCard</div>
          <div style={s.grid}>
            <StatCard icon="📝" value="128" label="Tests Completed" trend={{ value: '+12%', positive: true }} />
            <StatCard icon="⏱️" value="45h" label="Study Hours" trend={{ value: '+8%', positive: true }} />
            <StatCard icon="🎯" value="6.5" label="Avg Band Score" trend={{ value: '-0.5', positive: false }} />
          </div>
        </div>

        <div style={s.group}>
          <div style={s.label}>PricingCard</div>
          <div style={s.grid}>
            <PricingCard name="Basic" price="299,000đ" priceLabel="/tháng" features={['Truy cập đề thi Reading', 'Truy cập đề thi Listening', 'Giải thích đáp án chi tiết']} />
            <PricingCard name="Premium" price="499,000đ" priceLabel="/tháng" popular features={['Tất cả tính năng Basic', 'Prediction đề mới nhất', 'Hỗ trợ Speaking & Writing', 'Analytics & Progress']} />
            <PricingCard name="Enterprise" price="1,000,000đ" priceLabel="/tháng" features={['Tất cả tính năng Premium', 'Truy cập không giới hạn', 'Priority support']} />
          </div>
        </div>
      </div>

      <Divider />

      {/* Organisms */}
      <div style={s.section}>
        <h2 style={s.title}>5. Organisms</h2>
        <p style={s.sub}>Complex, self-contained sections</p>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ ...s.section, paddingBottom: 8 }}><div style={s.label}>Header</div></div>
        <Header navItems={NAV} />
      </div>

      <div style={s.section}>
        <div style={s.label}>CTABanner</div>
        <div style={{ marginTop: 16 }}>
          <CTABanner title="Sẵn sàng cho kì thi IELTS máy?" subtitle="Ôn luyện trên các bài thi sát thực đề, xem giải thích chi tiết trước khi bước vào phòng thi!" ctaText="Bắt đầu luyện thi" />
        </div>
      </div>

      <div style={{ marginTop: 48 }}>
        <div style={{ ...s.section, paddingBottom: 8 }}><div style={s.label}>Footer</div></div>
        <Footer
          description="IELTS PREDICTION Test (IPT) specializes in providing highly accurate test content."
          columns={FOOTER_COLS}
          contactInfo={{ phone: '0927004848', email: 'ieltsprediction@gmail.com', address: '1G203 North Kirkland Blvd.' }}
          socialLinks={[{ icon: 'f', href: '#', label: 'Facebook' }, { icon: 'yt', href: '#', label: 'YouTube' }, { icon: 'in', href: '#', label: 'LinkedIn' }]}
        />
      </div>
    </div>
  );
}
