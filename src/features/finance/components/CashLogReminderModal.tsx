'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { useNotifications } from '@/features/dashboard/hooks/useNotifications';
import { cn } from '@/libs/utils';
import { useUIStore } from '@/stores/ui.store';

/** Remembers which reminder has already been waved away, so it pops once. */
const SEEN_KEY = 'cash-log-reminder-seen';

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Private windows and blocked site data both throw here. Losing the marker
    // only costs one extra prompt, so it is not worth guarding further.
    return null;
  }
}

function writeSeen(id: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, id);
  } catch {
    /* ignore — see readSeen */
  }
}

/**
 * The cash reminder, said once out loud.
 *
 * The bell alone is easy to walk past, which is the habit this is fighting.
 * But unlike the penalty it is not an accusation — nothing was broken, a note
 * is simply missing — so it borrows the ordinary Modal shell instead of the
 * red slam, and offers to open the form rather than demanding anything.
 */
export function CashLogReminderModal({ suppressed }: { suppressed?: boolean }) {
  const { data: notifications = [] } = useNotifications();
  const openQuickAddTransaction = useUIStore((s) => s.openQuickAddTransaction);

  const reminder = notifications.find((n) => n.type === 'cash-log');
  const [dismissed, setDismissed] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : readSeen(),
  );

  const open = !suppressed && !!reminder && dismissed !== reminder._id;

  const close = () => {
    if (reminder) {
      writeSeen(reminder._id);
      setDismissed(reminder._id);
    }
  };

  // The server writes "Nothing recorded yet for: A · B · C". Split it back
  // into chips when it still looks like that, and fall back to the sentence
  // if the wording ever changes — a missing chip is nicer than a crash.
  const [lead, list] = (reminder?.message ?? '').split(': ');
  const names = list ? list.split(' · ') : [];

  return (
    <Modal open={open} onClose={close} maxWidth="400px">
      <ModalHead title={reminder?.title ?? ''} />
      <ModalBody>
        <div className="flex flex-col gap-3">
          <p className="text-[12px] leading-relaxed text-[var(--text-mid)]">
            {names.length > 0 ? lead : reminder?.message}
          </p>

          {names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {names.map((name) => (
                <span key={name} className={chip}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFoot>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} className="w-full justify-center sm:w-auto">
            Later
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              close();
              openQuickAddTransaction();
            }}
            className="w-full justify-center sm:w-auto"
          >
            Log it now
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}

const chip = cn(
  'rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-1',
  'text-[11px] font-medium text-[var(--text-hi)]',
);
