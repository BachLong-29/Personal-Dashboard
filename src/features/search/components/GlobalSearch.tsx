'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CommandPalette, type CommandGroup } from '@/components/ui/CommandPalette';
import { useRouter } from '@/i18n/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/stores/ui.store';
import type { GlobalSearchResult, SearchHit } from '@/types';

import { useGlobalSearch } from '../hooks/useGlobalSearch';

const GROUP_KEYS: (keyof GlobalSearchResult)[] = ['tasks', 'habits', 'quests', 'projects'];

export function GlobalSearch() {
  const open = useUIStore((s) => s.searchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const router = useRouter();
  const t = useTranslations('search');

  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const { result, isLoading } = useGlobalSearch(open ? debounced : '');

  // Ctrl/Cmd + K toggles the palette anywhere in the protected app.
  // Read the latest store state at fire time so the listener can stay deps-free,
  // and reset the query on every close path (incl. keyboard) for a fresh reopen.
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const store = useUIStore.getState();
        if (store.searchOpen) {
          setQuery('');
          store.closeSearch();
        } else {
          store.openSearch();
        }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  const handleClose = () => {
    setQuery('');
    closeSearch();
  };

  const select = (hit: SearchHit) => {
    handleClose();
    router.push(hit.href);
  };

  const groups: CommandGroup[] = useMemo(() => {
    return GROUP_KEYS.map((key) => ({
      label: t(key),
      items: result[key].map((hit) => ({
        key: `${hit.type}:${hit.id}`,
        icon: hit.icon,
        label: hit.label,
        onSelect: () => select(hit),
      })),
    })).filter((g) => g.items.length > 0);
    // select/router are stable enough; recompute only when results change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, t]);

  const emptyLabel = debounced.trim() ? t('empty', { query: debounced.trim() }) : t('hint');

  return (
    <CommandPalette
      open={open}
      onClose={handleClose}
      groups={groups}
      query={query}
      onQueryChange={setQuery}
      disableFilter
      loading={isLoading}
      emptyLabel={emptyLabel}
      placeholder={t('placeholder')}
    />
  );
}
