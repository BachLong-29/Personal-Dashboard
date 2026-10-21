'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { useUIStore } from '@/stores/ui.store';
import type { AgentPendingAction, AgentTarget } from '@/types';

import { toTargetLinks } from '../utils/target-links';

export type ProposalState = 'open' | 'confirming' | 'done' | 'dismissed';

interface ProposalCardProps {
  actions: AgentPendingAction[];
  state: ProposalState;
  /** What the confirmed changes touched; each kind gets a link once the card is done. */
  targets?: AgentTarget[];
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * What the assistant wants to change, waiting for a yes. Nothing is written until the
 * user confirms; once decided the buttons give way to a plain status.
 */
export function ProposalCard({
  actions,
  state,
  targets = [],
  onConfirm,
  onDismiss,
}: ProposalCardProps) {
  const t = useTranslations('assistant');
  const tCommon = useTranslations('common');
  const reduceMotion = useReducedMotion();
  const openNotes = useUIStore((s) => s.openNotes);
  const decided = state === 'done' || state === 'dismissed';
  const links = state === 'done' ? toTargetLinks(targets) : [];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: state === 'dismissed' ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'flex w-full max-w-[88%] flex-col gap-3 rounded-[var(--r-lg,14px)] border bg-[var(--surface)] p-3.5 sm:max-w-[80%]',
        state === 'done' ? 'border-[var(--mint)]' : 'border-[var(--gold)]',
      )}
    >
      <div className="text-[10px] tracking-[0.16em] text-[var(--gold)] uppercase [font-family:var(--f-title)]">
        {t('proposal')}
      </div>

      <ul className="flex flex-col gap-1.5">
        {actions.map((action, index) => (
          <li
            key={`${action.tool}-${index}`}
            className="flex gap-2 text-[14px] font-medium text-[var(--text-hi)]"
          >
            <span aria-hidden className="text-[var(--gold)]">
              •
            </span>
            <span className="min-w-0 break-words">{action.summary}</span>
          </li>
        ))}
      </ul>

      {decided ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={state === 'done' ? 'mint' : 'violet'}>
            {t(state === 'done' ? 'confirmed' : 'dismissed')}
          </Badge>
          {links.map((link) => {
            const label = `${t(`open.${link.kind}${link.many ? 's' : ''}`)} →`;
            const className = cn(
              'inline-flex min-h-8 items-center rounded-full border border-[var(--border)] px-3 text-[12px] font-medium text-[var(--text-hi)]',
              'transition-all duration-150 hover:border-[var(--gold)] hover:text-[var(--gold)] active:scale-95',
            );
            return link.href ? (
              <Link key={link.kind} href={link.href} className={className}>
                {label}
              </Link>
            ) : (
              <button key={link.kind} type="button" onClick={openNotes} className={className}>
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 justify-center"
            disabled={state === 'confirming'}
            onClick={onDismiss}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1 justify-center"
            isLoading={state === 'confirming'}
            onClick={onConfirm}
          >
            {t('confirm')}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
