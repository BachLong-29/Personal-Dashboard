'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface QuickRepliesProps {
  choices: string[];
  /** Accessible name of the group. */
  label: string;
  onPick: (choice: string) => void;
}

/** Tappable answers to a question the assistant asked. Picking one sends it as a message. */
export function QuickReplies({ choices, label, onPick }: QuickRepliesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="group"
      aria-label={label}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: reduceMotion ? 0 : 0.08 }}
      className="flex max-w-[88%] flex-wrap gap-2 sm:max-w-[80%]"
    >
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => onPick(choice)}
          className="rounded-full border border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_10%,transparent)] px-3.5 py-2 text-left text-[13px] text-[var(--text-hi)] transition-colors hover:bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
        >
          {choice}
        </button>
      ))}
    </motion.div>
  );
}
