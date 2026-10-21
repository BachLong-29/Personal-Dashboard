'use client';

import { useEffect, useState } from 'react';

import type { EmojiMartData } from '@emoji-mart/data';

export interface EmojiEntry {
  emoji: string;
  name: string;
  /** Id, name and keywords, lower-cased, for a substring search. */
  search: string;
}

export interface EmojiCategory {
  /** emoji-mart's category id: `people`, `nature`, `foods`, … */
  id: string;
  emojis: EmojiEntry[];
}

let pending: Promise<EmojiCategory[]> | null = null;

/** The data is a few hundred KB, so it is fetched the first time a picker opens, once. */
function loadEmojiData(): Promise<EmojiCategory[]> {
  pending ??= import('@emoji-mart/data')
    .then(({ default: data }) => toCategories(data as EmojiMartData))
    .catch((error: unknown) => {
      // Let the next opening try again rather than caching the failure.
      pending = null;
      throw error;
    });
  return pending;
}

function toCategories(data: EmojiMartData): EmojiCategory[] {
  return data.categories.map((category) => ({
    id: category.id,
    emojis: category.emojis.flatMap((id) => {
      const entry = data.emojis[id];
      const native = entry?.skins[0]?.native;
      if (!entry || !native) return [];
      return [
        {
          emoji: native,
          name: entry.name,
          search: [entry.id, entry.name, ...entry.keywords].join(' ').toLowerCase(),
        },
      ];
    }),
  }));
}

/** Every emoji by category, or `null` while loading. A failed load settles on no categories. */
export function useEmojiData(): EmojiCategory[] | null {
  const [categories, setCategories] = useState<EmojiCategory[] | null>(null);

  useEffect(() => {
    let active = true;
    loadEmojiData()
      .then((loaded) => active && setCategories(loaded))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
