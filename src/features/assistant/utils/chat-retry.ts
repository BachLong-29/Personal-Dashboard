import axios from 'axios';

/** Tries after the first one, and how long to wait before each. */
export const RETRY_DELAYS_MS = [2_000, 4_000, 8_000];
/** The provider is busy or did not answer — worth another go. 503 is "not configured": not. */
const RETRY_STATUSES = new Set([429, 502, 504]);

/** True when the user stopped the request, as opposed to it failing. */
export function isChatCancelled(error: unknown): boolean {
  return axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError');
}

/**
 * A failure that may well pass. The server saves a turn only after the model answered, so
 * sending the same message again can never double it. A client-side timeout is left out: the
 * server may still be working on that request and would store it as well.
 */
export function isTransient(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.response) return RETRY_STATUSES.has(error.response.status);
  return error.code !== 'ECONNABORTED' && error.code !== 'ETIMEDOUT';
}

/** Waits `ms`, or rejects the moment `signal` aborts. */
export function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Stopped', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Runs `send`, and again after a transient failure, up to `delays.length` more times.
 * `onRetry(attempt, max)` fires before each wait. Throws the last error, or an abort the moment
 * `signal` fires — during a request or during the wait between two.
 */
export async function sendWithRetry<T>(
  send: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  onRetry: (attempt: number, max: number) => void,
  delays: readonly number[] = RETRY_DELAYS_MS,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await send(signal);
    } catch (error) {
      const delay = delays[attempt];
      if (delay === undefined || !isTransient(error) || signal.aborted) throw error;
      onRetry(attempt + 1, delays.length);
      await pause(delay, signal);
    }
  }
}
