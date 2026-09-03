'use client';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { CAT_MAP, RANK_DESC, RANK_STYLE } from '@/features/achievements/constants';
import { ProgressRing } from '@/features/achievements/components/ProgressRing';
import type { GoalDTO } from '@/types';

interface AchievementDetailModalProps {
  goal: GoalDTO;
  onClose: () => void;
}

const catRingText: Record<string, string> = {
  career: 'text-[var(--gold)]',
  health: 'text-[var(--mint)]',
  learning: 'text-[var(--cyan)]',
  finance: 'text-[var(--violet)]',
  personal: 'text-[var(--rose)]',
};

const STATUS_LABEL: Record<GoalDTO['status'], string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

export function AchievementDetailModal({ goal, onClose }: AchievementDetailModalProps) {
  const router = useRouter();
  const cat = CAT_MAP[goal.cat];
  const done = goal.status === 'completed';
  const ringText = catRingText[goal.cat] ?? 'text-[var(--gold)]';
  const msDone = goal.milestones.filter((m) => m.done).length;
  const msTotal = goal.milestones.length;

  return (
    <Modal open onClose={onClose} maxWidth="440px" closeButton>
      <ModalHead
        tag={`◆ ${done ? 'ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENT IN PROGRESS'} ◆`}
        title={goal.title}
      />

      <ModalBody className="flex flex-col gap-4">
        {/* Ring + meta */}
        <div className="flex items-start gap-3.5">
          <div className={cn('relative shrink-0', ringText)}>
            <ProgressRing value={goal.progress} size={56} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  'font-[var(--font-title)] text-[12px] font-black',
                  done && 'text-[var(--mint)]',
                )}
              >
                {done ? '✓' : Math.round(goal.progress * 100)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span
                className={cn(
                  'text-[9px] font-black font-[var(--font-title)] px-1.5 py-0.5 rounded-[3px] border tracking-[0.08em]',
                  RANK_STYLE[goal.rank],
                )}
              >
                {goal.rank}
              </span>
              <span
                className={cn(
                  'text-[9px] font-semibold tracking-[0.06em] font-[var(--font-title)]',
                  ringText,
                )}
              >
                {cat.ci} {cat.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-mid)] leading-[1.55]">{goal.desc}</p>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 border-t border-[var(--border)] pt-3.5">
          {[
            ['Status', STATUS_LABEL[goal.status]],
            ['Rank', `${goal.rank} · ${RANK_DESC[goal.rank]}`],
            ['Priority', goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)],
            done ? ['Completed', goal.completedDate ?? '—'] : ['Target', goal.targetLabel],
            ['Reward', `${goal.xp} XP · ${goal.coins} ◉`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[8px] text-[var(--text-lo)] uppercase tracking-[0.1em] font-[var(--font-title)] mb-0.5">
                {k}
              </div>
              <div className="text-[10px] font-semibold text-[var(--text-hi)]">{v}</div>
            </div>
          ))}
        </div>

        {/* Milestones */}
        {msTotal > 0 && (
          <div className="border-t border-[var(--border)] pt-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold tracking-[0.08em] text-[var(--text-mid)] uppercase font-[var(--font-title)]">
                Milestones
              </span>
              <div className="flex-1 h-[3px] bg-[var(--panel2)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-500 ease-out"
                  style={{ width: `${msTotal ? (msDone / msTotal) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-lo)]">
                {msDone}/{msTotal}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {goal.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-1">
                  <span
                    className={cn(
                      'w-4 h-4 rounded-[3px] border flex items-center justify-center text-[9px] shrink-0',
                      m.done
                        ? 'bg-[var(--gold)] border-[var(--gold)] text-[var(--panel)]'
                        : 'bg-transparent border-[var(--border)] text-transparent',
                    )}
                  >
                    ✓
                  </span>
                  <span
                    className={cn(
                      'text-[11px] leading-tight',
                      m.done ? 'text-[var(--text-lo)] line-through' : 'text-[var(--text-hi)]',
                    )}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy note */}
        {goal.note && (
          <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-3">
            <div className="text-[8px] tracking-[0.1em] uppercase mb-1.5 text-[var(--gold)] font-[var(--font-title)]">
              ◆ STRATEGY
            </div>
            <p className="text-[10px] text-[var(--text-mid)] leading-[1.6] italic">{goal.note}</p>
          </div>
        )}

        {/* Linked trophy */}
        {goal.linkedTrophy && (
          <p className="text-[9px] text-[var(--text-lo)]">
            ✧ {done ? 'Unlocked the' : 'Completing this unlocks the'}{' '}
            <span className="text-[var(--gold)] font-semibold">{goal.linkedTrophy}</span> trophy
          </p>
        )}
      </ModalBody>

      <ModalFoot>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button type="button" variant="default" onClick={() => router.push('/achievements')}>
          ✦ View All Ambitions
        </Button>
      </ModalFoot>
    </Modal>
  );
}
