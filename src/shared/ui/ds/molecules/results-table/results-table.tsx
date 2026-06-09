export type ResultStatus = 'passed' | 'in-review' | 'retry';

export type ResultRow = {
  test: string;
  date: string;
  band?: string;
  status: ResultStatus;
};

export type ResultsTableProps = {
  rows: ResultRow[];
  className?: string;
};

const STATUS_CONFIG: Record<ResultStatus, { label: string; bg: string; text: string }> = {
  'passed':    { label: 'Passed',    bg: 'rgba(22,155,134,0.14)',  text: '#169b86' },
  'in-review': { label: 'In review', bg: 'rgba(252,148,89,0.14)',  text: '#fc9459' },
  'retry':     { label: 'Retry',     bg: 'rgba(249,107,139,0.14)', text: '#f96b8b' },
};

const StatusPill = ({ status }: { status: ResultStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center justify-center px-[12px] py-[4px] rounded-full text-[12px] font-semibold font-inter leading-[17px] whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
};

export const ResultsTable = ({ rows, className = '' }: ResultsTableProps) => (
  <div
    className={`bg-white border border-[#e5e8eb] rounded-[14px] overflow-hidden w-full ${className}`}
  >
    {/* Header */}
    <div className="bg-[#f7fafc] flex items-center px-[20px] py-[14px]">
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold font-inter text-[var(--color-ink-muted)] tracking-[0.55px] uppercase">
          TEST
        </span>
      </div>
      <div className="w-[150px] shrink-0">
        <span className="text-[11px] font-bold font-inter text-[var(--color-ink-muted)] tracking-[0.55px] uppercase">
          DATE
        </span>
      </div>
      <div className="w-[90px] shrink-0">
        <span className="text-[11px] font-bold font-inter text-[var(--color-ink-muted)] tracking-[0.55px] uppercase">
          BAND
        </span>
      </div>
      <div className="w-[140px] shrink-0">
        <span className="text-[11px] font-bold font-inter text-[var(--color-ink-muted)] tracking-[0.55px] uppercase">
          STATUS
        </span>
      </div>
    </div>

    {/* Data rows */}
    {rows.map((row, i) => (
      <div
        key={i}
        className="flex items-center px-[20px] py-[14px] border-t border-[#edf0f2]"
      >
        <div className="flex-1 min-w-0 h-[24px] flex items-center overflow-hidden">
          <span className="text-[14px] font-semibold font-inter text-[var(--color-ink-900)] whitespace-nowrap truncate">
            {row.test}
          </span>
        </div>
        <div className="w-[150px] shrink-0 h-[24px] flex items-center">
          <span className="text-[13px] font-normal font-inter text-[var(--color-ink-muted)] whitespace-nowrap">
            {row.date}
          </span>
        </div>
        <div className="w-[90px] shrink-0 h-[24px] flex items-center">
          <span
            className="text-[14px] font-bold font-inter whitespace-nowrap"
            style={{ color: row.band ? 'var(--color-ink-900)' : 'var(--color-ink-muted)' }}
          >
            {row.band ?? '—'}
          </span>
        </div>
        <div className="w-[140px] shrink-0 h-[24px] flex items-center">
          <StatusPill status={row.status} />
        </div>
      </div>
    ))}
  </div>
);
