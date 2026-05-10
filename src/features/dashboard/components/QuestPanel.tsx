'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';

import type { BurstPos, Quest } from '../types';
import { AddQuestModal } from './AddQuestModal';
import { QuestCard } from './QuestCard';

interface QuestPanelProps {
  quests: Quest[];
  onToggle: (id: number, burstPos: BurstPos | null) => void;
  onAddQuest: (quest: Quest) => void;
  animationsEnabled: boolean;
}

export function QuestPanel({ quests, onToggle, onAddQuest, animationsEnabled }: QuestPanelProps) {
  const [showModal, setShowModal] = useState(false);

  const done = quests.filter((q) => q.done).length;
  const pct = quests.length ? Math.round((done / quests.length) * 100) : 0;

  return (
    <div className={cn(panelBase, panelGold, questPanel)}>
      <div className={cornerTL} />
      <div className={cornerTR} />
      <div className={cornerBL} />
      <div className={cornerBR} />
      <div className={questSubheader}>
        <div className={questTitleGroup}>
          <span className={questSparkle}>✦</span>
          <span className={questMainTitle}>{`Today\'s Quests`}</span>
        </div>
        <button className={questAddButton} onClick={() => setShowModal(true)}>
          <span>+</span> New Quest
        </button>
      </div>
      <div className={progressMini}>
        <div className={progBarWrap}>
          <div className={progLabel}>
            <span>Daily Progress</span>
            <span className={progLabelValue}>
              {done}/{quests.length} Complete
            </span>
          </div>
          <div className={progTrack}>
            <div className={progFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={progPctWrap}>
          <div className={progPct}>{pct}%</div>
          <div className={progDone}>DONE</div>
        </div>
      </div>
      <div className={questList}>
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onToggle={onToggle}
            animationsEnabled={animationsEnabled}
          />
        ))}
        {quests.length === 0 && <div className={emptyState}>◆ No quests yet. Add one above! ◆</div>}
      </div>
      {showModal && <AddQuestModal onAdd={onAddQuest} onClose={() => setShowModal(false)} />}
    </div>
  );
}

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

const questSubheader =
  'flex items-center justify-between px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)] shrink-0';
const questTitleGroup = 'flex items-center gap-2';
const questSparkle = 'text-[16px] animate-[spin_4s_linear_infinite]';
const questMainTitle =
  'font-[var(--font-title)] text-[14px] font-bold tracking-[0.08em] text-[var(--text-hi)]';
const questAddButton =
  'flex items-center gap-[5px] text-[11px] font-semibold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.08)] border border-[oklch(0.74_0.17_85_/_0.35)] rounded-[var(--r-sm)] px-[10px] py-[5px] cursor-pointer transition-all duration-200 hover:bg-[oklch(0.74_0.17_85_/_0.15)] hover:shadow-[0_0_12px_var(--gold-glow)]';

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

const questList = 'flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2';
const emptyState = 'text-[var(--text-lo)] text-center py-[30px] text-[12px]';
