'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

import type { BurstPos, Quest } from '../types';
import { AddQuestModal } from './AddQuestModal';
import { QuestCard } from './QuestCard';
import { QuestDetailModal } from './QuestDetailModal';

interface QuestPanelProps {
  quests: Quest[];
  onToggle: (id: string, burstPos: BurstPos | null) => void;
  onAddQuest: (quest: Quest) => void;
  animationsEnabled: boolean;
  isLoading?: boolean;
}

interface SectionState {
  tasks: boolean;
  habits: boolean;
  quests: boolean;
}

export function QuestPanel({
  quests,
  onToggle,
  onAddQuest,
  animationsEnabled,
  isLoading,
}: QuestPanelProps) {
  const t = useTranslations('dashboard');

  const [showModal, setShowModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [open, setOpen] = useState<SectionState>({ tasks: true, habits: true, quests: true });

  const toggle = (key: keyof SectionState) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  const tasks = quests.filter((q) => q.taskId);
  const habits = quests.filter((q) => q.habitId);
  const pure = quests.filter((q) => !q.taskId && !q.habitId);

  const done = quests.filter((q) => q.done).length;
  const pct = quests.length ? Math.round((done / quests.length) * 100) : 0;

  return (
    <div className={cn(panelBase, panelGold, questPanel)}>
      <div className={cornerTL} />
      <div className={cornerTR} />
      <div className={cornerBL} />
      <div className={cornerBR} />

      {/* Header */}
      <div className={questSubheader}>
        <div className={questTitleGroup}>
          <span className={questSparkle}>✦</span>
          <span className={questMainTitle}>{t('quests.title')}</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <span>+</span> {t('quests.new')}
        </Button>
      </div>

      {/* Overall progress */}
      <div className={progressMini}>
        <div className={progBarWrap}>
          <div className={progLabel}>
            <span>{t('quests.dailyProgress')}</span>
            <span className={progLabelValue}>
              {t('quests.completed', { done, total: quests.length })}
            </span>
          </div>
          <div className={progTrack}>
            <div className={progFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={progPctWrap}>
          <div className={progPct}>{pct}%</div>
          <div className={progDone}>{t('quests.done')}</div>
        </div>
      </div>

      {/* Scrollable list with sections */}
      <div className={questList}>
        {isLoading ? (
          <div className={emptyState}>◆ Loading... ◆</div>
        ) : (
          <>
            {/* ── Tasks ── */}
            {tasks.length > 0 && (
              <div className={sectionWrap}>
                <button
                  type="button"
                  className={cn(sectionHeader, sectionHeaderTask)}
                  onClick={() => toggle('tasks')}
                >
                  <span className={sectionIcon}>📋</span>
                  <span className={sectionLabel} style={{ color: 'var(--cyan)' }}>
                    {t('quests.sections.tasks')}
                  </span>
                  <span className={cn(sectionCount, sectionCountTask)}>
                    {tasks.filter((q) => q.done).length}/{tasks.length}
                  </span>
                  <span className="flex-1" />
                  <span className={sectionCaret}>{open.tasks ? '▾' : '▸'}</span>
                </button>
                {open.tasks && (
                  <div className={sectionItems}>
                    {tasks.map((q) => (
                      <QuestCard
                        key={q.id}
                        quest={q}
                        onToggle={onToggle}
                        animationsEnabled={animationsEnabled}
                        onViewDetail={setSelectedQuest}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Habits ── */}
            {habits.length > 0 && (
              <div className={sectionWrap}>
                <button
                  type="button"
                  className={cn(sectionHeader, sectionHeaderHabit)}
                  onClick={() => toggle('habits')}
                >
                  <span className={sectionIcon}>⚡</span>
                  <span className={sectionLabel} style={{ color: 'var(--violet)' }}>
                    {t('quests.sections.habits')}
                  </span>
                  <span className={cn(sectionCount, sectionCountHabit)}>
                    {habits.filter((q) => q.done).length}/{habits.length}
                  </span>
                  <span className="flex-1" />
                  <span className={sectionCaret}>{open.habits ? '▾' : '▸'}</span>
                </button>
                {open.habits && (
                  <div className={sectionItems}>
                    {habits.map((q) => (
                      <QuestCard
                        key={q.id}
                        quest={q}
                        onToggle={onToggle}
                        animationsEnabled={animationsEnabled}
                        onViewDetail={setSelectedQuest}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Quests ── */}
            {pure.length > 0 && (
              <div className={sectionWrap}>
                <button
                  type="button"
                  className={cn(sectionHeader, sectionHeaderQuest)}
                  onClick={() => toggle('quests')}
                >
                  <span className={sectionIcon}>✦</span>
                  <span className={sectionLabel} style={{ color: 'var(--gold)' }}>
                    {t('quests.sections.quests')}
                  </span>
                  <span className={cn(sectionCount, sectionCountQuest)}>
                    {pure.filter((q) => q.done).length}/{pure.length}
                  </span>
                  <span className="flex-1" />
                  <span className={sectionCaret}>{open.quests ? '▾' : '▸'}</span>
                </button>
                {open.quests && (
                  <div className={sectionItems}>
                    {pure.map((q) => (
                      <QuestCard
                        key={q.id}
                        quest={q}
                        onToggle={onToggle}
                        animationsEnabled={animationsEnabled}
                        onViewDetail={setSelectedQuest}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {quests.length === 0 && <div className={emptyState}>◆ {t('quests.empty')} ◆</div>}
          </>
        )}
      </div>

      {showModal && <AddQuestModal onAdd={onAddQuest} onClose={() => setShowModal(false)} />}
      {selectedQuest && (
        <QuestDetailModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}
    </div>
  );
}

// ── Panel shell ────────────────────────────────────────────────────────────

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelGold =
  'border-[oklch(0.74_0.17_85_/_0.35)] shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.06),inset_0_0_20px_oklch(0.74_0.17_85_/_0.03)]';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]');

const questPanel = 'flex-1 overflow-hidden min-h-0 flex flex-col';

// ── Header ─────────────────────────────────────────────────────────────────

const questSubheader =
  'flex items-center justify-between px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)] shrink-0';
const questTitleGroup = 'flex items-center gap-2';
const questSparkle = 'text-[16px] animate-[spin_4s_linear_infinite]';
const questMainTitle =
  '[font-family:var(--f-title)] text-[14px] font-bold tracking-[0.08em] text-[var(--text-hi)]';

// ── Progress bar ───────────────────────────────────────────────────────────

const progressMini =
  'flex items-center gap-2.5 px-[14px] pt-[6px] pb-[10px] border-b border-[var(--border)] shrink-0';
const progBarWrap = 'flex-1 flex flex-col gap-[3px]';
const progLabel = 'flex justify-between text-[9px] text-[var(--text-mid)] tracking-[0.06em]';
const progLabelValue = 'text-[var(--mint)] font-bold';
const progTrack =
  'h-2 bg-[var(--panel3)] rounded-[4px] overflow-hidden border border-[var(--border)]';
const progFill =
  'h-full rounded-[4px] bg-[linear-gradient(90deg,var(--mint),var(--cyan))] shadow-[0_0_8px_oklch(0.76_0.14_162_/_0.5)] transition-[width] duration-[600ms] ease-[ease]';
const progPctWrap = 'text-center min-w-[38px]';
const progPct = 'font-[var(--font-title)] text-[16px] font-bold text-[var(--mint)]';
const progDone = 'text-[8px] text-[var(--text-mid)] tracking-[0.08em]';

// ── Scrollable list ────────────────────────────────────────────────────────

const questList = 'flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-1';
const emptyState = 'text-[var(--text-lo)] text-center py-[30px] text-[12px]';

// ── Section ────────────────────────────────────────────────────────────────

const sectionWrap = 'flex flex-col';
const sectionHeader =
  'flex items-center gap-[6px] px-1 py-[6px] rounded-[var(--r-sm)] cursor-pointer select-none transition-colors duration-150 w-full text-left';
const sectionHeaderTask = 'hover:bg-[oklch(0.76_0.16_205_/_0.07)]';
const sectionHeaderHabit = 'hover:bg-[oklch(0.66_0.22_295_/_0.07)]';
const sectionHeaderQuest = 'hover:bg-[oklch(0.74_0.17_85_/_0.07)]';
const sectionIcon = 'text-[13px] leading-none shrink-0';
const sectionLabel = 'font-[var(--font-title)] text-[10px] font-bold tracking-[0.14em] uppercase';
const sectionCount =
  'font-[var(--font-title)] text-[9px] font-bold px-[6px] py-[2px] rounded-[8px] border';
const sectionCountTask =
  'text-[var(--cyan)]   bg-[oklch(0.76_0.16_205_/_0.12)] border-[oklch(0.76_0.16_205_/_0.3)]';
const sectionCountHabit =
  'text-[var(--violet)] bg-[oklch(0.66_0.22_295_/_0.12)] border-[oklch(0.66_0.22_295_/_0.3)]';
const sectionCountQuest =
  'text-[var(--gold)]   bg-[oklch(0.74_0.17_85_/_0.12)]  border-[oklch(0.74_0.17_85_/_0.3)]';
const sectionCaret = 'text-[10px] text-[var(--text-lo)]';
const sectionItems = 'flex flex-col gap-2 pt-1 pb-2';
