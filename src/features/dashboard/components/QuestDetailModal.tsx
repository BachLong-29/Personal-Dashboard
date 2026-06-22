'use client';

import type { ReactNode } from 'react';

import { ProjectBadge } from '@/components/common/ProjectBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';

import { HABIT_COLORS, QUEST_ICONS } from '../constants';
import type { HabitColor, Quest } from '../types';

interface QuestDetailModalProps {
  quest: Quest;
  onClose: () => void;
}

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i;

function isImageUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    return IMAGE_EXTS.test(path);
  } catch {
    return IMAGE_EXTS.test(url);
  }
}

function fileName(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? url);
  } catch {
    return url;
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--border-lo)] last:border-b-0">
      <span className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-[var(--text-lo)] shrink-0 w-[72px]">
        {label}
      </span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

export function QuestDetailModal({ quest, onClose }: QuestDetailModalProps) {
  const icon = quest.habitIcon ?? QUEST_ICONS[quest.type] ?? '📌';
  const habitColorVal = quest.habitColor
    ? HABIT_COLORS[quest.habitColor as HabitColor]?.value
    : undefined;

  const isTask = Boolean(quest.taskId);
  const isHabit = Boolean(quest.habitId);
  const sourceLabel = isTask ? 'Task' : isHabit ? 'Habit' : 'Quest';

  const attachments = quest.attachments ?? [];
  const hasAttachments = attachments.length > 0;

  return (
    <Modal open onClose={onClose} maxWidth="460px" closeButton scrollable bottomSheet>
      {/* Bottom-sheet drag handle — visible on mobile only */}
      <div className="flex justify-center pt-2.5 pb-0 sm:hidden" aria-hidden>
        <div className="w-9 h-[3px] rounded-full bg-[var(--border-hi)] opacity-50" />
      </div>

      <ModalHead
        tag="◆ QUEST DETAIL"
        title={
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-[26px] leading-none shrink-0"
              style={
                habitColorVal ? { filter: `drop-shadow(0 0 6px ${habitColorVal})` } : undefined
              }
            >
              {icon}
            </span>
            <span className="text-[18px] leading-snug break-words min-w-0">{quest.title}</span>
          </div>
        }
      />

      <ModalBody scrollable>
        <div className="flex flex-col gap-4">
          {/* Description — skip if it looks like a bare ObjectId (no spaces, 24 hex chars) */}
          {quest.desc && !/^[a-f0-9]{24}$/i.test(quest.desc.trim()) && (
            <div className="bg-[var(--panel3)] border border-[var(--border-lo)] rounded-[var(--r-sm)] px-3 py-2.5 text-[12px] text-[var(--text-md)] leading-relaxed italic">
              {quest.desc}
            </div>
          )}

          <div className="flex flex-col">
            {/* Status */}
            <DetailRow label="Status">
              {quest.done ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--mint)] bg-[oklch(0.76_0.14_162_/_0.12)] border border-[oklch(0.76_0.14_162_/_0.3)] rounded-[6px] px-2.5 py-[3px]">
                  ✓ Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.25)] rounded-[6px] px-2.5 py-[3px]">
                  ◎ Active
                </span>
              )}
            </DetailRow>

            {/* Type */}
            <DetailRow label="Type">
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-hi)] capitalize [font-family:var(--f-body)]">
                <span>{icon}</span>
                {quest.type}
              </span>
            </DetailRow>

            {/* Source + Difficulty */}
            <DetailRow label="Source">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-2 py-[3px] rounded-[5px] border"
                  style={
                    habitColorVal
                      ? {
                          background: `${habitColorVal}20`,
                          color: habitColorVal,
                          borderColor: `${habitColorVal}50`,
                        }
                      : {
                          background: 'var(--panel3)',
                          color: 'var(--cyan)',
                          borderColor: 'oklch(0.76 0.16 205 / 0.3)',
                        }
                  }
                >
                  {sourceLabel}
                </span>
                {!isTask && !isHabit && (
                  <div className={cn('diff-badge', `diff-${quest.difficulty}`)}>
                    {quest.difficulty}
                  </div>
                )}
              </div>
            </DetailRow>

            {/* Rewards */}
            <DetailRow label="Rewards">
              <div className="flex items-center gap-2">
                <div className="reward-pill xp">⚡ {quest.xp} XP</div>
                <div className="reward-pill coin">🪙 {quest.coins}</div>
              </div>
            </DetailRow>

            {/* Due Date */}
            {quest.dueDate && (
              <DetailRow label="Due Date">
                <span className="text-[12px] text-[var(--text-hi)] [font-family:var(--f-mono)] tracking-[0.04em]">
                  {quest.dueDate}
                </span>
              </DetailRow>
            )}

            {/* Tags */}
            {quest.tags.length > 0 && (
              <DetailRow label="Tags">
                <div className="flex flex-wrap gap-1 justify-end">
                  {quest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] uppercase tracking-[0.1em] px-2 py-[2px] rounded-[4px] bg-[var(--panel3)] border border-[var(--border-lo)] text-[var(--text-lo)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </DetailRow>
            )}

            {/* Project */}
            {quest.projectName && (
              <DetailRow label="Project">
                <ProjectBadge
                  name={quest.projectName}
                  icon={quest.projectIcon}
                  color={quest.projectColor}
                />
              </DetailRow>
            )}
          </div>

          {/* Attachments */}
          {hasAttachments && (
            <div className="flex flex-col gap-2">
              <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.14em] uppercase text-[var(--text-lo)]">
                Attachments · {attachments.length}
              </div>

              {/* Image previews */}
              {attachments.some(isImageUrl) && (
                <div className="grid grid-cols-3 gap-1.5">
                  {attachments.filter(isImageUrl).map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square rounded-[var(--r-sm)] overflow-hidden border border-[var(--border-lo)] hover:border-[var(--gold-dim)] transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={fileName(url)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Non-image files */}
              {attachments
                .filter((u) => !isImageUrl(u))
                .map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--r-sm)] bg-[var(--panel3)] border border-[var(--border-lo)] hover:border-[var(--gold-dim)] transition-colors group"
                  >
                    <span className="text-[16px] shrink-0">📎</span>
                    <span className="[font-family:var(--f-mono)] text-[10px] text-[var(--text-md)] group-hover:text-[var(--text-hi)] truncate transition-colors flex-1">
                      {fileName(url)}
                    </span>
                    <span className="text-[10px] text-[var(--text-lo)] shrink-0">↗</span>
                  </a>
                ))}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFoot>
        <Button
          type="button"
          variant="ghost"
          className="modal-btn cancel w-full sm:w-auto"
          onClick={onClose}
        >
          Close
        </Button>
      </ModalFoot>
    </Modal>
  );
}
