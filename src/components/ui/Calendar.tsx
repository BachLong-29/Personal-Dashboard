'use client';

/**
 * Calendar — faithful Tailwind port of the Aetheria "Calendar — Week View" mock
 * (temp/Calendar.html + calendar.css on top of aetheria-ui.css tokens).
 *
 * All design tokens from aetheria-ui.css are inlined as Tailwind arbitrary values
 * so the component renders identically without depending on the project's CSS vars
 * or any extra stylesheet. Fonts (Cinzel / Sora / JetBrains Mono) are referenced by
 * family — load them globally if not already present.
 */

import { useEffect, useRef, useState } from 'react';

// ─── Shared token shortcuts (literal strings — Tailwind-scannable) ──────────────
const F_TITLE = "font-['Cinzel',serif]";
const F_MONO = "font-['JetBrains_Mono',monospace]";

const DOT: Record<string, string> = {
  gold: 'oklch(0.78 0.16 82)',
  violet: 'oklch(0.68 0.22 295)',
  mint: 'oklch(0.76 0.14 162)',
};

// ─── Striped image placeholder ──────────────────────────────────────────────────
function Imgph({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(135deg,oklch(0.5_0.05_290_/_0.25)_0_8px,oklch(0.4_0.05_290_/_0.15)_8px_16px)]">
      {label && (
        <span
          className={`${F_MONO} text-center text-[8px] uppercase tracking-[0.1em] text-[oklch(0.85_0_0_/_0.55)]`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Icon rail ──────────────────────────────────────────────────────────────────
function Rail() {
  const icons = [
    { ico: '◆', title: 'Events', active: true },
    { ico: '★', title: 'Favorites' },
    { ico: '⚲', title: 'Locations' },
  ];
  return (
    <aside className="mr-4 flex flex-col items-center gap-5 rounded-[20px] border border-[#2a2a48] bg-[linear-gradient(180deg,#0f0f1d,#0a0a14)] py-5">
      <div
        className={`${F_TITLE} flex h-11 w-11 flex-col items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,oklch(0.78_0.16_82),oklch(0.68_0.22_295))] text-[13px] font-black leading-none text-[#0a0400] shadow-[0_0_24px_oklch(0.68_0.22_295_/_0.35),inset_0_0_8px_oklch(1_0_0_/_0.25)]`}
      >
        31<small className="text-[8px] tracking-[0.1em] opacity-80">CAL</small>
      </div>
      <div className="h-px w-7 bg-[#2a2a48]" />
      {icons.map((it) => (
        <div
          key={it.title}
          title={it.title}
          className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-[18px] transition-all duration-[180ms] ${
            it.active
              ? 'bg-[oklch(0.68_0.22_295_/_0.12)] text-[oklch(0.68_0.22_295)]'
              : 'text-[#7676a0] hover:bg-[#1a1a30] hover:text-[#f0eeff]'
          }`}
        >
          {it.active && (
            <span className="absolute -left-2 top-3 bottom-3 w-[3px] rounded-[2px] bg-[oklch(0.68_0.22_295)] shadow-[0_0_8px_oklch(0.68_0.22_295_/_0.35)]" />
          )}
          {it.ico}
        </div>
      ))}
      <div
        title="Settings"
        className="mt-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-[18px] text-[#7676a0] transition-all duration-[180ms] hover:bg-[#1a1a30] hover:text-[#f0eeff]"
      >
        ⚙
      </div>
    </aside>
  );
}

// ─── Left event list item ───────────────────────────────────────────────────────
interface EItem {
  name: string;
  time: string;
  repeat: string;
  dot: keyof typeof DOT;
}
function EventListItem({ name, time, repeat, dot }: EItem) {
  const c = DOT[dot];
  return (
    <div className="relative flex gap-3 overflow-hidden rounded-[14px] border border-[#2a2a48] bg-[#131326] p-4 transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-[#3a3a5e] hover:shadow-[0_4px_12px_oklch(0_0_0_/_0.5)]">
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: c }} />
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-1.5">
          <span
            className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
            style={{ background: c, boxShadow: `0 0 6px ${c}` }}
          />
          <span className={`${F_TITLE} text-[13px] tracking-[0.03em] text-[#f0eeff]`}>{name}</span>
        </div>
        <div className={`${F_MONO} text-[9px] leading-[1.7] tracking-[0.04em] text-[#7676a0]`}>
          <div>{time}</div>
          <div>
            <span className="text-[#4a4a6a]">Repeat ·</span> {repeat}
          </div>
        </div>
      </div>
      <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-[10px] border border-[#3a3a5e]">
        <Imgph label="art" />
      </div>
    </div>
  );
}

// ─── Mini calendar ──────────────────────────────────────────────────────────────
function MiniCalendar() {
  const dotted = [2, 3, 4, 14, 22, 23, 28];
  const cellBase = `${F_MONO} flex aspect-square cursor-pointer items-center justify-center rounded-[3px] text-[10px] transition-all duration-[140ms]`;
  return (
    <div className="rounded-[14px] border border-[#2a2a48] bg-[#131326] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={`${F_TITLE} text-[13px] tracking-[0.06em] text-[#f0eeff]`}>
          November 2023
        </span>
        <div className="flex gap-1">
          {['◀', '▶'].map((a) => (
            <button
              key={a}
              className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#2a2a48] bg-[#0f0f1d] text-[9px] text-[#7676a0] transition-colors hover:text-[#f0eeff]"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={`dow-${i}`}
            className={`${cellBase} cursor-default text-[9px] tracking-[0.05em] text-[#4a4a6a]`}
          >
            {d}
          </div>
        ))}
        {[29, 30, 31].map((n) => (
          <div key={`lead-${n}`} className={`${cellBase} text-[#4a4a6a] opacity-40`}>
            {n}
          </div>
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const sel = d === 2;
          const isDot = dotted.includes(d);
          return (
            <div
              key={`day-${d}`}
              className={`${cellBase} relative ${
                sel
                  ? 'bg-[linear-gradient(135deg,oklch(0.55_0.20_295),oklch(0.68_0.22_295))] font-bold text-white shadow-[0_0_24px_oklch(0.68_0.22_295_/_0.35)]'
                  : 'text-[#b4b4d8] hover:bg-[#232340] hover:text-[#f0eeff]'
              }`}
            >
              {d}
              {isDot && !sel && (
                <span className="absolute bottom-[3px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[oklch(0.68_0.22_295)]" />
              )}
            </div>
          );
        })}
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={`trail-${n}`} className={`${cellBase} text-[#4a4a6a] opacity-40`}>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[#2a2a48] bg-[#131326] p-4 hover:border-[#3a3a5e]">
      <div className={`${F_TITLE} mb-3 text-[15px] tracking-[0.04em] text-[#f0eeff]`}>{label}</div>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">{children}</div>
    </div>
  );
}
const Num = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span className={`${F_TITLE} text-[18px] font-bold leading-none`} style={{ color }}>
    {children}
  </span>
);
const Unit = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[9px] tracking-[0.04em] text-[#7676a0]">{children}</span>
);

// ─── Week grid ──────────────────────────────────────────────────────────────────
const HOURS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
];

interface Evt {
  tone: 'gold' | 'violet' | 'mint' | 'crimson';
  pos: string; // tailwind col/row placement classes
  name: string;
  time: string;
  extra?: string;
  compact?: boolean;
  thumb?: string;
}
const TONE: Record<Evt['tone'], string> = {
  gold: 'border-[oklch(0.78_0.16_82)] bg-[linear-gradient(135deg,oklch(0.78_0.16_82_/_0.22),oklch(0.78_0.16_82_/_0.08))] shadow-[0_0_16px_oklch(0.78_0.16_82_/_0.18)]',
  violet:
    'border-[oklch(0.68_0.22_295)] bg-[linear-gradient(135deg,oklch(0.68_0.22_295_/_0.28),oklch(0.68_0.22_295_/_0.1))] shadow-[0_0_16px_oklch(0.68_0.22_295_/_0.35)]',
  mint: 'border-[oklch(0.76_0.14_162)] bg-[linear-gradient(135deg,oklch(0.76_0.14_162_/_0.22),oklch(0.76_0.14_162_/_0.08))] shadow-[0_0_16px_oklch(0.76_0.14_162_/_0.18)]',
  crimson:
    'border-[oklch(0.62_0.24_22)] bg-[linear-gradient(135deg,oklch(0.62_0.24_22_/_0.32),oklch(0.62_0.24_22_/_0.12))] shadow-[0_0_22px_oklch(0.62_0.24_22_/_0.35)]',
};

const EVENTS: Evt[] = [
  {
    tone: 'gold',
    pos: 'col-start-2 col-end-3 row-start-2 row-end-3',
    name: 'Honbai Impact',
    time: '07:00 — 07:45',
    compact: true,
  },
  {
    tone: 'violet',
    pos: 'col-start-3 col-end-4 row-start-3 row-end-5',
    name: 'War of PoxiNi Emporium',
    time: '08:00 — 09:30',
    thumb: 'art',
  },
  {
    tone: 'crimson',
    pos: 'col-start-4 col-end-6 row-start-4 row-end-7',
    name: 'One Piece / Chapter 1093 — OFFLINE MEETING',
    time: '09:00 — 12:00 · Nov 03 – 04, 2023',
    extra: 'Repeat · None',
    thumb: 'key art',
  },
  {
    tone: 'mint',
    pos: 'col-start-2 col-end-4 row-start-9 row-end-10',
    name: 'Music Festival · Pepsi-co RevolutionX',
    time: '14:00 — 15:00 · Paris',
    compact: true,
  },
];

function EventBlock({ e }: { e: Evt }) {
  const nameSize = e.tone === 'crimson' ? 'text-[15px]' : 'text-[13px]';
  if (e.compact) {
    return (
      <div
        className={`${e.pos} ${TONE[e.tone]} z-[2] m-[3px] flex cursor-pointer flex-row items-center gap-2 overflow-hidden rounded-[10px] border px-3 py-2 transition-all duration-[180ms] hover:-translate-y-px hover:brightness-110`}
      >
        <div className="h-[22px] w-[22px] flex-shrink-0 overflow-hidden rounded-[3px] border border-[oklch(1_0_0_/_0.2)] relative">
          <Imgph />
        </div>
        <div>
          <div className={`${F_TITLE} ${nameSize} leading-[1.2] tracking-[0.02em] text-[#f0eeff]`}>
            {e.name}
          </div>
          <div className={`${F_MONO} text-[9px] tracking-[0.04em] text-[#b4b4d8]`}>{e.time}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${e.pos} ${TONE[e.tone]} z-[2] m-[3px] flex cursor-pointer flex-col gap-0.5 overflow-hidden rounded-[10px] border px-3 py-2 transition-all duration-[180ms] hover:-translate-y-px hover:brightness-110`}
    >
      {e.thumb && (
        <div className="absolute inset-0 -z-10 opacity-[0.32]">
          <Imgph label={e.thumb} />
        </div>
      )}
      <div className={`${F_TITLE} ${nameSize} leading-[1.2] tracking-[0.02em] text-[#f0eeff]`}>
        {e.name}
      </div>
      <div className={`${F_MONO} text-[9px] tracking-[0.04em] text-[#b4b4d8]`}>{e.time}</div>
      {e.extra && (
        <div className={`${F_MONO} mt-auto text-[9px] tracking-[0.04em] text-[#b4b4d8]`}>
          {e.extra}
        </div>
      )}
    </div>
  );
}

function WeekGrid() {
  const days = [
    { dow: 'Mon', num: '01' },
    { dow: 'Tue', num: '02', today: true },
    { dow: 'Wed', num: '03' },
    { dow: 'Thu', num: '04' },
    { dow: 'Fri', num: '05' },
  ];
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-[20px] border border-[#2a2a48] bg-[#131326]">
      {/* Day header row */}
      <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[#2a2a48] bg-[#0f0f1d]">
        <div className="border-r border-[#1f1f38]" />
        {days.map((d, i) => (
          <div
            key={d.dow}
            className={`flex flex-col gap-0.5 px-4 py-3 ${i < 4 ? 'border-r border-[#1f1f38]' : ''}`}
          >
            <span
              className={`${F_MONO} text-[9px] uppercase tracking-[0.12em] ${
                d.today ? 'text-[oklch(0.68_0.22_295)]' : 'text-[#7676a0]'
              }`}
            >
              {d.dow}
            </span>
            <span
              className={`${F_TITLE} text-[22px] font-bold leading-none ${
                d.today ? 'text-[oklch(0.68_0.22_295)]' : 'text-[#b4b4d8]'
              }`}
            >
              {d.num}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative grid auto-rows-[58px] grid-cols-[60px_repeat(5,1fr)]">
          {HOURS.flatMap((h, r) => [
            <div
              key={`lbl-${r}`}
              className={`${F_MONO} border-r border-t border-[#1f1f38] px-2 pt-1 text-right text-[9px] text-[#4a4a6a]`}
            >
              {h}
            </div>,
            ...Array.from({ length: 5 }, (_, c) => (
              <div key={`slot-${r}-${c}`} className="border-r border-t border-[#1f1f38]" />
            )),
          ])}
          {EVENTS.map((e) => (
            <EventBlock key={e.name} e={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Right rail ─────────────────────────────────────────────────────────────────
function RightRail() {
  const avatars = [
    { ch: 'A', grad: 'bg-[linear-gradient(135deg,oklch(0.55_0.20_295),oklch(0.68_0.22_295))]' },
    { ch: 'K', grad: 'bg-[linear-gradient(135deg,oklch(0.55_0.16_162),oklch(0.76_0.14_162))]' },
    { ch: 'R', grad: 'bg-[linear-gradient(135deg,oklch(0.50_0.20_22),oklch(0.74_0.18_5))]' },
    { ch: 'T', grad: 'bg-[linear-gradient(135deg,oklch(0.50_0.16_205),oklch(0.78_0.16_205))]' },
  ];
  return (
    <aside className="flex flex-col gap-4 overflow-y-auto pl-2">
      {/* Featured */}
      <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,oklch(0.55_0.20_295),oklch(0.68_0.22_295)_55%,oklch(0.46_0.20_290))] p-5 shadow-[0_0_24px_oklch(0.68_0.22_295_/_0.35),0_8px_24px_oklch(0_0_0_/_0.6)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(1_0_0_/_0.18),transparent_60%)]" />
        <div
          className={`${F_TITLE} relative mb-1 text-[9px] uppercase tracking-[0.24em] text-[oklch(1_0_0_/_0.7)]`}
        >
          ◆ Upcoming Event
        </div>
        <div className={`${F_TITLE} relative text-[22px] font-bold leading-[1.05] text-white`}>
          Upcoming Event
        </div>
        <div
          className={`${F_MONO} relative mt-1 text-[11px] tracking-[0.06em] text-[oklch(1_0_0_/_0.8)]`}
        >
          Thu, 15:00
        </div>
        <div className="relative my-4 h-[150px] overflow-hidden rounded-[14px] border border-[oklch(1_0_0_/_0.25)] shadow-[inset_0_0_40px_oklch(0_0_0_/_0.4)]">
          <div className="absolute inset-0 flex items-center justify-center bg-[repeating-linear-gradient(135deg,oklch(0.2_0.02_290_/_0.6)_0_10px,oklch(0.12_0.02_290_/_0.5)_10px_20px)]">
            <span
              className={`${F_MONO} text-center text-[10px] uppercase tracking-[0.1em] text-[oklch(0.9_0_0_/_0.5)]`}
            >
              Event Cover
              <br />
              1080 × 1080
            </span>
          </div>
        </div>
        <div className="relative flex items-center gap-3 rounded-[14px] bg-[#06060d] px-4 py-3">
          <div className={`${F_TITLE} text-[28px] font-black tracking-[0.02em] text-white`}>
            15:00
          </div>
          <div className="text-[11px] leading-[1.4] text-[#b4b4d8]">
            <strong className="font-semibold text-[#f0eeff]">Fuyu Matsuri</strong>
            <br />
            Japan
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="rounded-[20px] border border-[#2a2a48] bg-[#131326] p-5">
        <div className={`${F_TITLE} text-[18px] tracking-[0.04em] text-[#f0eeff]`}>
          Participants
        </div>
        <div className={`${F_MONO} mt-1 text-[11px] tracking-[0.04em] text-[#7676a0]`}>
          <b className="text-[#b4b4d8]">35</b> joins · <b className="text-[#b4b4d8]">4</b> rejects ·{' '}
          <b className="text-[#b4b4d8]">108</b> pending
        </div>
        <div className="mt-4 flex items-center">
          {avatars.map((a, i) => (
            <div
              key={a.ch}
              className={`relative h-11 w-11 overflow-hidden rounded-[10px] border-2 border-[#131326] ${a.grad} ${
                i === 0 ? '' : '-ml-2.5'
              }`}
            >
              <span
                className={`${F_TITLE} absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white`}
              >
                {a.ch}
              </span>
            </div>
          ))}
          <div
            className={`${F_MONO} -ml-2.5 flex h-11 w-11 items-center justify-center rounded-[10px] border-2 border-[#131326] bg-[#232340] text-[11px] text-[#b4b4d8]`}
          >
            +31
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
const VIEWS = ['Day', 'Week', 'Month', 'Year'] as const;
const TABS = [
  { label: 'Unread', count: 2 },
  { label: 'Accepted', count: 8 },
] as const;

export interface CalendarProps {
  /**
   * When true, the calendar scales to fit its parent container instead of the
   * full viewport — use this to embed it inside a panel. Defaults to false
   * (full-screen scale-to-fit stage, matching the original mock).
   */
  embedded?: boolean;
}

export function Calendar({ embedded = false }: CalendarProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>('Week');
  const [tab, setTab] = useState<(typeof TABS)[number]['label']>('Unread');

  // Scale-to-fit stage (1340 × 850) — against the viewport, or the parent when embedded
  useEffect(() => {
    const DW = 1340;
    const DH = 850;
    const fit = () => {
      const w = embedded && stageRef.current ? stageRef.current.clientWidth : window.innerWidth;
      const h = embedded && stageRef.current ? stageRef.current.clientHeight : window.innerHeight;
      const s = Math.min(w / DW, h / DH);
      if (scalerRef.current) scalerRef.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    let ro: ResizeObserver | undefined;
    if (embedded && stageRef.current) {
      ro = new ResizeObserver(fit);
      ro.observe(stageRef.current);
    }
    return () => {
      window.removeEventListener('resize', fit);
      ro?.disconnect();
    };
  }, [embedded]);

  const events: EItem[] = [
    { name: 'Adidas Giveaway', time: '03:00 · Nov 22, 2023', repeat: 'None', dot: 'mint' },
    { name: 'Product Meeting', time: '07:00 · Dec 23, 2023', repeat: 'Weekly', dot: 'violet' },
    { name: 'Quarterly Review', time: '10:30 · Dec 28, 2023', repeat: 'None', dot: 'gold' },
  ];

  return (
    <div
      ref={stageRef}
      className={`flex items-center justify-center overflow-hidden bg-[#06060d] ${
        embedded ? 'relative h-full w-full' : 'fixed inset-0'
      }`}
    >
      <div ref={scalerRef} className="h-[850px] w-[1340px] flex-shrink-0 origin-center">
        <div className="grid h-[850px] w-[1340px] grid-cols-[84px_268px_minmax(0,1fr)_326px] gap-0 bg-[#06060d] p-4 text-[#f0eeff]">
          <Rail />

          {/* Left — event list */}
          <section className="flex flex-col gap-4 overflow-hidden pr-2">
            <div className="flex gap-5 border-b border-[#1f1f38] pb-3">
              {TABS.map((t) => {
                const active = tab === t.label;
                return (
                  <button
                    key={t.label}
                    onClick={() => setTab(t.label)}
                    className={`${F_TITLE} relative pb-1 text-[13px] tracking-[0.08em] ${
                      active ? 'text-[oklch(0.68_0.22_295)]' : 'text-[#7676a0]'
                    }`}
                  >
                    {t.label}{' '}
                    <span
                      className={`${F_MONO} ml-1.5 rounded-full bg-[#232340] px-1.5 py-px text-[9px] text-[#b4b4d8]`}
                    >
                      {t.count}
                    </span>
                    {active && (
                      <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-[2px] bg-[oklch(0.68_0.22_295)] shadow-[0_0_8px_oklch(0.68_0.22_295_/_0.35)]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {events.map((e) => (
                <EventListItem key={e.name} {...e} />
              ))}
            </div>

            <MiniCalendar />
          </section>

          {/* Main */}
          <main className="flex flex-col gap-5 overflow-hidden px-6">
            {/* Header */}
            <header className="flex items-center gap-5">
              <div className="flex items-center gap-5">
                <div>
                  <div className={`${F_MONO} text-[13px] tracking-[0.2em] text-[#7676a0]`}>
                    2023
                  </div>
                  <h1
                    className={`${F_TITLE} whitespace-nowrap bg-[linear-gradient(135deg,#f0eeff,oklch(0.68_0.22_295))] bg-clip-text text-[36px] font-black leading-none tracking-[0.03em] text-transparent`}
                  >
                    November
                  </h1>
                </div>
                <button
                  title="New event"
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.55_0.20_295),oklch(0.68_0.22_295))] text-[24px] font-light text-white shadow-[0_0_24px_oklch(0.68_0.22_295_/_0.35),inset_0_0_10px_oklch(1_0_0_/_0.2)] transition-all duration-200 hover:rotate-90 hover:scale-110"
                >
                  +
                </button>
              </div>

              {/* View segment */}
              <div className="mx-auto inline-flex rounded-full border border-[#2a2a48] bg-[#0f0f1d] p-1">
                {VIEWS.map((v, i) => (
                  <span key={v} className="flex items-center">
                    {i === 2 && <span className="my-1.5 mx-0.5 w-px bg-[#2a2a48]" />}
                    <button
                      onClick={() => setView(v)}
                      className={`${F_TITLE} whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] tracking-[0.06em] transition-all duration-[180ms] ${
                        view === v
                          ? 'bg-[linear-gradient(135deg,oklch(0.55_0.20_295),oklch(0.68_0.22_295))] text-white shadow-[0_0_24px_oklch(0.68_0.22_295_/_0.35)]'
                          : 'text-[#7676a0] hover:text-[#f0eeff]'
                      }`}
                    >
                      {v}
                    </button>
                  </span>
                ))}
              </div>

              {/* Tools */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <span
                  className={`${F_MONO} inline-flex items-center gap-1.5 rounded-[10px] border border-[#2a2a48] bg-[#1a1a30] px-3 py-[7px] text-[11px] text-[#b4b4d8]`}
                >
                  <span className="text-[oklch(0.68_0.22_295)]">3</span> ◫ invites
                </span>
                <button className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#2a2a48] bg-[#1a1a30] text-[#b4b4d8] hover:text-[#f0eeff]">
                  ◷
                  <span className="absolute right-1.5 top-[5px] h-1.5 w-1.5 rounded-full border border-[#0f0f1d] bg-[oklch(0.78_0.16_82)] shadow-[0_0_6px_oklch(0.78_0.16_82_/_0.35)]" />
                </button>
              </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Event">
                <Num color="#f0eeff">3</Num>
                <Unit>Passed</Unit>
                <span className="text-[#4a4a6a]">·</span>
                <Num color="oklch(0.74 0.18 5)">29</Num>
                <Unit>Upcoming</Unit>
              </StatCard>
              <StatCard label="Busy">
                <Num color="oklch(0.78 0.16 205)">14</Num>
                <Unit>hrs this week</Unit>
              </StatCard>
              <StatCard label="Free days">
                <Num color="oklch(0.76 0.14 162)">53</Num>
                <Unit>days left</Unit>
              </StatCard>
              <StatCard label="Repeat">
                <Num color="oklch(0.78 0.16 82)">12</Num>
                <Unit>events</Unit>
              </StatCard>
            </div>

            <WeekGrid />
          </main>

          <RightRail />
        </div>
      </div>
    </div>
  );
}

export default Calendar;
