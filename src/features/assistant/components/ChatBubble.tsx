'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/libs/utils';

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'error';
  text: string;
}

/** One message. The user's sit right in gold, the assistant's left on a surface. */
export function ChatBubble({ role, text }: ChatBubbleProps) {
  const reduceMotion = useReducedMotion();
  const mine = role === 'user';
  const failed = role === 'error';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[88%] whitespace-pre-wrap break-words rounded-[var(--r-lg,14px)] border px-3.5 py-2.5 text-[14px] leading-relaxed sm:max-w-[80%]',
          failed
            ? 'border-[var(--rose)] bg-[color-mix(in_oklab,var(--rose)_12%,transparent)] text-[var(--rose)]'
            : mine
              ? 'border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_14%,transparent)] text-[var(--text-hi)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-hi)]',
        )}
      >
        {text}
      </div>
    </motion.div>
  );
}
