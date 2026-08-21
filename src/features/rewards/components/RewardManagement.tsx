'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { GoldPanel } from '@/components/common/GoldPanel';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';
import type { Character } from '@/features/dashboard/types';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { cn } from '@/libs/utils';
import type { Reward, RewardRarity, RewardStatus } from '@/types/reward';
import { RARITIES, STATUSES, SORT_OPTIONS } from '../constants';
import { useRewards } from '../hooks/useRewards';
import { useUpdateReward } from '../hooks/useUpdateReward';
import { useDeleteReward } from '../hooks/useDeleteReward';
import { RewardSidebar } from './RewardSidebar';
import { RewardCard } from './RewardCard';
import { RewardTable } from './RewardTable';
import { RewardInspector } from './RewardInspector';
import { RewardForgeModal } from './RewardForgeModal';

type ViewMode = 'grid' | 'table';
type InspMode = 'edit' | 'preview';

export function RewardManagement() {
  // ── Character snapshot for the shared app topbar — same pattern as TaskManagement ──
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ── Filters & Sort ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [rarFilter, setRarFilter] = useState<RewardRarity | 'all'>('all');
  const [statFilter, setStatFilter] = useState<RewardStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<ViewMode>('grid');

  // Filters/inspector are off-canvas below `lg:` — only one is meant to be open at a time.
  const [showFilters, setShowFilters] = useState(false);

  // ── Selection & draft ───────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Reward | null>(null);
  const [inspMode, setInspMode] = useState<InspMode>('edit');
  const [publishing, setPublishing] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useRewards({
    search: search || undefined,
    rarity: rarFilter !== 'all' ? rarFilter : undefined,
    status: statFilter !== 'all' ? statFilter : undefined,
    sortBy,
    order,
    limit: 100,
  });

  // Stable reference so dependent useMemos don't recompute every render.
  const rewards = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  // ── Counts for sidebar ──────────────────────────────────────────────────────
  const rarCounts = useMemo(() => {
    const m: Record<string, number> = {};
    RARITIES.forEach((r) => {
      m[r.id] = 0;
    });
    rewards.forEach((r) => {
      m[r.rarity] = (m[r.rarity] ?? 0) + 1;
    });
    return m;
  }, [rewards]);

  const statCounts = useMemo(() => {
    const m: Record<string, number> = {};
    STATUSES.forEach((s) => {
      m[s.id] = 0;
    });
    rewards.forEach((r) => {
      m[r.status] = (m[r.status] ?? 0) + 1;
    });
    return m;
  }, [rewards]);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { mutate: updateReward } = useUpdateReward();
  const { mutate: deleteReward } = useDeleteReward();

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleSelect(id: string) {
    setSelectedId(id);
    setShowFilters(false);
    const r = rewards.find((x) => x.id === id);
    if (r) setDraft({ ...r });
  }

  function handleCloseInspector() {
    setSelectedId(null);
    setDraft(null);
  }

  function handlePublish() {
    if (!draft || !selectedId) return;
    setPublishing(true);
    const { id, userId, createdAt, updatedAt, active, ...payload } = draft;
    updateReward(
      { id, ...payload },
      {
        onSuccess: () => {
          setPublishing(false);
          showToast('ok', 'Reward forged successfully');
        },
        onError: () => {
          setPublishing(false);
          showToast('err', 'Update failed');
        },
      },
    );
  }

  function handleDeleteConfirm() {
    if (!deletingId) return;
    deleteReward(deletingId, {
      onSuccess: () => {
        if (selectedId === deletingId) {
          setSelectedId(null);
          setDraft(null);
        }
        setDeletingId(null);
        showToast('ok', 'Reward deleted');
      },
      onError: () => {
        setDeletingId(null);
        showToast('err', 'Delete failed');
      },
    });
  }

  function showToast(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 2600);
  }

  const dirty =
    draft && selectedId
      ? JSON.stringify(draft) !== JSON.stringify(rewards.find((r) => r.id === selectedId))
      : false;

  return (
    <div className={shellOuter}>
      <DashboardTopbar char={char} dateStr={dateStr} />

      {/* ── Page header — title + search + forge action, same pattern as the other pages ── */}
      <GoldPanel background={false} corners={false} className={pageHeader}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className={pageTitle}>Reward Forge</h1>
            <div className={pageSubtitle}>Console › Economy › Rewards</div>
          </div>

          <div className={envPill}>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] shadow-[0_0_4px_var(--mint)]" />
            <span className="hidden sm:inline">LIVE · PROD</span>
          </div>

          <button
            type="button"
            className={forgeBtn}
            onClick={() => setShowForge(true)}
            aria-label="Forge New Reward"
            title="Forge New Reward"
          >
            <span aria-hidden="true">＋</span>
            <span className="hidden sm:inline">Forge New Reward</span>
          </button>
        </div>

        <div className={topSearch}>
          <span className="text-[13px] text-[var(--text-lo)]">⌕</span>
          <input
            className="flex-1 bg-transparent text-[12px] text-[var(--text-hi)] outline-none placeholder:text-[var(--text-dim)]"
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-lo)]"
              onClick={() => setSearch('')}
            >
              ✕
            </button>
          )}
        </div>
      </GoldPanel>

      {/* ── Shell body ── */}
      <div className={shellBody}>
        {/* Left sidebar — off-canvas drawer below `lg:`, static column from `lg:` up */}
        {showFilters && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300',
            'lg:static lg:z-auto lg:flex lg:translate-x-0',
            showFilters ? 'flex translate-x-0' : 'hidden -translate-x-full',
          )}
        >
          <RewardSidebar
            rarFilter={rarFilter}
            setRarFilter={setRarFilter}
            statFilter={statFilter}
            setStatFilter={setStatFilter}
            rarCounts={rarCounts}
            statCounts={statCounts}
            total={total}
          />
        </div>

        {/* Center — main content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* KPI strip */}
          <KPIStrip rewards={rewards} />

          {/* Toolbar */}
          <div className={toolbar}>
            <button type="button" className={filtersToggleBtn} onClick={() => setShowFilters(true)}>
              ☰ Filters
            </button>

            <div className="text-[11px] text-[var(--text-mid)] font-[var(--font-title)] tracking-[0.06em]">
              Catalog · <span className="text-[var(--text-hi)] font-bold">{rewards.length}</span>
              {total !== rewards.length && (
                <span className="text-[var(--text-dim)]"> / {total}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Sort */}
              <select className={select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={tbBtn}
                onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                title={order === 'desc' ? 'Descending' : 'Ascending'}
              >
                {order === 'desc' ? '↓' : '↑'}
              </button>

              <div className={tbDivider} />

              {/* View toggle */}
              <div className={viewToggle}>
                <button
                  type="button"
                  className={cn(viewBtn, view === 'grid' && viewBtnActive)}
                  onClick={() => setView('grid')}
                >
                  ▦ Grid
                </button>
                <button
                  type="button"
                  className={cn(viewBtn, view === 'table' && viewBtnActive)}
                  onClick={() => setView('table')}
                >
                  ≡ Table
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 sm:px-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-[var(--text-lo)] text-[12px]">
                <span className="animate-pulse">Loading rewards…</span>
              </div>
            ) : view === 'grid' ? (
              <div className={grid}>
                {rewards.map((r) => (
                  <RewardCard
                    key={r.id}
                    reward={r}
                    selected={r.id === selectedId}
                    onSelect={() => handleSelect(r.id)}
                    onDelete={() => setDeletingId(r.id)}
                  />
                ))}
                {rewards.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-[var(--text-lo)]">
                    <div className="text-[38px] mb-3 opacity-40">◇</div>
                    <div className="font-[var(--font-title)] text-[13px] tracking-[0.18em] uppercase">
                      No Rewards Found
                    </div>
                    <div className="text-[11px] mt-2">Adjust filters or forge a new reward.</div>
                  </div>
                )}
              </div>
            ) : (
              <RewardTable
                rewards={rewards}
                selectedId={selectedId}
                setSelectedId={handleSelect}
                onDelete={(id) => setDeletingId(id)}
              />
            )}
          </div>
        </main>

        {/* Right inspector — always visible from `lg:` up; full-screen overlay on mobile/tablet
            (only mounted there once a reward is selected, so it never blocks the list). */}
        <div
          className={cn(
            'lg:static lg:z-auto lg:flex',
            selectedId ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex',
          )}
        >
          <RewardInspector
            reward={rewards.find((r) => r.id === selectedId) ?? null}
            draft={draft}
            setDraft={(fn) => setDraft((d) => (d ? fn(d) : d))}
            mode={inspMode}
            setMode={setInspMode}
            dirty={!!dirty}
            publishing={publishing}
            onPublish={handlePublish}
            onDiscard={() => {
              const original = rewards.find((r) => r.id === selectedId);
              if (original) setDraft({ ...original });
            }}
            onClose={handleCloseInspector}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {showForge && (
        <RewardForgeModal
          onClose={() => setShowForge(false)}
          onCreated={(id) => {
            setShowForge(false);
            handleSelect(id);
          }}
        />
      )}

      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0_0_0_/_0.6)] p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDeletingId(null)}
        >
          <div className="w-full max-w-[360px] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-md)] shadow-[0_16px_48px_oklch(0_0_0_/_0.4)] p-5">
            <div className="font-[var(--font-title)] text-[13px] font-bold text-[var(--text-hi)] tracking-[0.06em] mb-1.5">
              <span className="text-[var(--rose)] mr-1.5">⚠</span>Delete Reward
            </div>
            <p className="text-[11px] text-[var(--text-mid)] leading-[1.5] mb-5">
              This reward will be removed from the catalog. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-[var(--r-sm)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.08em] cursor-pointer transition-all hover:border-[var(--border-hi)] hover:text-[var(--text-hi)]"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-[2] py-2 rounded-[var(--r-sm)] text-[11px] font-bold font-[var(--font-title)] tracking-[0.08em] cursor-pointer transition-all text-white bg-[linear-gradient(135deg,oklch(0.45_0.18_5),var(--rose,oklch(0.72_0.18_5)))] shadow-[0_0_12px_oklch(0.72_0.18_5_/_0.4)] hover:shadow-[0_0_20px_oklch(0.72_0.18_5_/_0.55)]"
                onClick={handleDeleteConfirm}
              >
                ✕ Destroy Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 left-4 right-4 z-50 flex items-center gap-2.5 rounded-[var(--r-md)] border px-4 py-2.5 text-[12px] font-semibold font-[var(--font-title)] tracking-[0.06em] shadow-[0_8px_32px_oklch(0_0_0_/_0.4)] transition-all sm:bottom-6 sm:left-auto sm:right-6',
            toast.kind === 'ok'
              ? 'bg-[oklch(0.76_0.14_162_/_0.1)] border-[oklch(0.76_0.14_162_/_0.4)] text-[var(--mint)]'
              : 'bg-[oklch(0.72_0.18_5_/_0.1)] border-[oklch(0.72_0.18_5_/_0.4)] text-[var(--rose)]',
          )}
        >
          {toast.kind === 'ok' ? '✦' : '⚠'} {toast.text}
        </div>
      )}
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KPIStrip({ rewards }: { rewards: Reward[] }) {
  const active = rewards.filter((r) => r.status === 'active').length;
  const legendary = rewards.filter((r) => r.rarity === 'legendary').length;
  const limited = rewards.filter((r) => r.status === 'limited').length;
  const totalCoinCost = rewards.reduce((s, r) => s + (r.coinCost ?? 0), 0);

  const kpis = [
    {
      label: 'Active Rewards',
      value: `${active}`,
      unit: `/ ${rewards.length}`,
      accent: 'var(--gold)',
    },
    {
      label: 'Legendary Tier',
      value: `${legendary}`,
      unit: 'items',
      accent: 'oklch(0.82 0.17 82)',
    },
    { label: 'Limited Edition', value: `${limited}`, unit: 'items', accent: 'var(--rose)' },
    {
      label: 'Total Coin Pool',
      value: `${(totalCoinCost / 1000).toFixed(1)}`,
      unit: 'k coins',
      accent: 'var(--cyan)',
    },
  ] as const;

  return (
    <div className={kpiRow}>
      {kpis.map((k) => (
        <div key={k.label} className={kpiCard} style={{ ['--accent' as string]: k.accent }}>
          <div className={kpiLabel}>{k.label}</div>
          <div className={kpiValue}>
            {k.value}
            <span className={kpiUnit}>{k.unit}</span>
          </div>
          <div className={kpiBar} />
        </div>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shellOuter =
  'flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-0,#06060d)]' +
  ' [background-image:radial-gradient(ellipse_70%_50%_at_78%_0%,oklch(0.35_0.18_295_/_0.15)_0%,transparent_60%),radial-gradient(ellipse_55%_45%_at_0%_70%,oklch(0.40_0.18_205_/_0.08)_0%,transparent_60%)]';

const pageHeader =
  'mx-3 mt-3 flex shrink-0 flex-col gap-2 rounded-[var(--r)] p-3 sm:mx-4 sm:mt-4 sm:p-4';
const pageTitle =
  'truncate font-[var(--font-title)] text-[16px] font-black tracking-[0.06em] bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] bg-clip-text text-transparent leading-none sm:text-[20px]';
const pageSubtitle =
  'mt-1 truncate text-[10px] font-[var(--font-title)] tracking-[0.08em] text-[var(--text-lo)]';

const topSearch =
  'flex items-center gap-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-md)] px-3 py-1.5 w-full focus-within:border-[var(--gold)]';

const envPill =
  'flex shrink-0 items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] text-[var(--mint)] font-[var(--font-title)] bg-[oklch(0.76_0.14_162_/_0.08)] border border-[oklch(0.76_0.14_162_/_0.3)] rounded-[20px] px-2.5 py-1';

const forgeBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-sm)] text-[11px] font-bold font-[var(--font-title)] tracking-[0.08em] text-[#0a0400] bg-[linear-gradient(135deg,oklch(0.68_0.14_82),oklch(0.78_0.16_82))] shadow-[0_0_12px_oklch(0.74_0.17_85_/_0.35)] cursor-pointer transition-all hover:shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.5)] sm:w-auto sm:px-3.5 sm:py-1.5';

const shellBody = 'flex flex-1 min-h-0 overflow-hidden relative';

const toolbar =
  'flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]';

const filtersToggleBtn =
  'flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-lo)] transition-all hover:border-[var(--border-hi)] hover:text-[var(--text-hi)] lg:hidden';

const select =
  'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1 text-[10px] text-[var(--text-mid)] outline-none cursor-pointer font-[var(--font-title)] tracking-[0.06em]';
const tbBtn =
  'w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-[10px] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:border-[var(--border-hi)] transition-all cursor-pointer bg-[var(--panel2)]';
const tbDivider = 'w-px h-4 bg-[var(--border)] mx-0.5';
const viewToggle =
  'flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5';
const viewBtn =
  'px-2.5 py-[3px] rounded-[4px] text-[9px] font-bold tracking-[0.08em] font-[var(--font-title)] text-[var(--text-lo)] transition-all cursor-pointer';
const viewBtnActive = '!bg-[var(--panel)] !text-[var(--text-hi)] shadow-sm';

const grid = 'grid gap-3' + ' [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]';

// KPI strip
const kpiRow =
  'hidden sm:grid sm:grid-cols-2 gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:grid-cols-4 shrink-0 border-b border-[var(--border)]';
const kpiCard =
  'relative flex flex-col gap-0.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2.5 overflow-hidden hover:border-[var(--accent)] transition-colors';
const kpiLabel =
  'text-[9px] font-bold tracking-[0.14em] uppercase text-[var(--text-lo)] font-[var(--font-title)]';
const kpiValue =
  'font-[var(--font-title)] text-[20px] font-black text-[var(--accent)] leading-none mt-0.5';
const kpiUnit =
  'text-[10px] font-normal text-[var(--text-lo)] ml-1.5 font-[var(--font-body,inherit)]';
const kpiBar = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] opacity-40';
