'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Input, Modal, ModalHead, Tabs } from '@/components/ui';
import { ICON_UPLOAD_TYPES } from '@/constants/upload';
import { useEmojiData } from '@/hooks/useEmojiData';
import {
  useAddToIconLibrary,
  useIconLibrary,
  useRemoveFromIconLibrary,
} from '@/hooks/useIconLibrary';
import { type IconUploadError, useIconUpload } from '@/hooks/useIconUpload';
import { cn } from '@/libs/utils';

import { Icon } from './Icon';
import { QUEST_ICONS, isUploadedIcon } from './icon-registry';

type Tab = 'quest' | 'emoji';

/** Past this many hits the grid stops helping; the query needs narrowing instead. */
const MAX_EMOJI_RESULTS = 120;

const QUEST_SET = new Set<string>(QUEST_ICONS);

const sectionTitle = 'text-[12px] font-medium text-[var(--text-md)]';
const questGrid = 'grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2.5';

export interface IconPickerSheetProps {
  onClose: () => void;
  title: string;
  value: string;
  /** A bundled icon name, an emoji, or an uploaded image URL. Choosing closes the sheet. */
  onChange: (value: string) => void;
  /** Offer the bundled quest artwork. Off where the icon is only ever drawn as text. */
  allowQuest?: boolean;
  /** Offer an image upload. Off where an uploaded image could not be drawn. */
  allowUpload?: boolean;
}

/**
 * The web twin of the mobile app's icon sheet: the bundled quest artwork, every Unicode emoji
 * by category, one search across both, and an image upload. Uploads are kept in the user's icon
 * library and offered again above the quest artwork. A bottom sheet on phones, a centred panel
 * from `sm` up.
 *
 * Always open: mount it only while it should show, so every opening starts on a fresh search and
 * on the tab that holds the current icon.
 */
export function IconPickerSheet({
  onClose,
  title,
  value,
  onChange,
  allowQuest = true,
  allowUpload = true,
}: IconPickerSheetProps) {
  const t = useTranslations('common.iconPicker');
  const categories = useEmojiData();
  const { upload, uploading } = useIconUpload();
  const { data: library = [] } = useIconLibrary(allowUpload);
  const addToLibrary = useAddToIconLibrary();
  const removeFromLibrary = useRemoveFromIconLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<Tab>(() =>
    allowQuest && (!value || QUEST_SET.has(value) || isUploadedIcon(value)) ? 'quest' : 'emoji',
  );
  const [categoryId, setCategoryId] = useState('people');
  const [query, setQuery] = useState('');
  const [uploadError, setUploadError] = useState<IconUploadError | null>(null);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return [];
    const quests = allowQuest ? QUEST_ICONS.filter((name) => name.includes(needle)) : [];
    const emojis: string[] = [];
    for (const category of categories ?? []) {
      for (const entry of category.emojis) {
        if (emojis.length >= MAX_EMOJI_RESULTS) break;
        if (entry.search.includes(needle)) emojis.push(entry.emoji);
      }
    }
    return [...quests, ...emojis];
  }, [needle, allowQuest, categories]);

  const category = categories?.find((entry) => entry.id === categoryId) ?? categories?.[0];
  // An image chosen before the library existed is still shown, ahead of the kept ones.
  const images = isUploadedIcon(value) && !library.includes(value) ? [value, ...library] : library;

  function choose(next: string) {
    onChange(next);
    onClose();
  }

  function showCategory(id: string) {
    setCategoryId(id);
    bodyRef.current?.scrollTo({ top: 0 });
  }

  async function handleFile(file: File) {
    setUploadError(null);
    const result = await upload(file);
    if ('url' in result) {
      // Kept for next time; if that fails the icon is still chosen, it just is not offered again.
      addToLibrary.mutate(result.url);
      choose(result.url);
    } else {
      setUploadError(result.error);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      bottomSheet
      scrollable
      maxWidth="520px"
      className="h-[85dvh] sm:h-[620px]"
    >
      <ModalHead title={title} />

      <div className="relative flex flex-col gap-3 border-b border-[var(--border-lo)] px-4 py-3 sm:px-6">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          autoComplete="off"
        />

        {allowUpload && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? t('uploading') : `⬆ ${t('upload')}`}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={ICON_UPLOAD_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset so picking the same file twice still fires a change.
                e.target.value = '';
                if (file) void handleFile(file);
              }}
            />
            {uploadError && (
              <p role="alert" className="text-[11px] text-[var(--rose)]">
                {t(`uploadError.${uploadError}`)}
              </p>
            )}
          </>
        )}

        {!needle && allowQuest && (
          <Tabs
            variant="pill"
            className="self-center"
            activeKey={tab}
            onChange={(key) => setTab(key as Tab)}
            tabs={[
              { key: 'quest', label: t('quest') },
              { key: 'emoji', label: t('emoji') },
            ]}
          />
        )}

        {!needle && tab === 'emoji' && categories && categories.length > 0 && (
          <div
            role="tablist"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none]"
          >
            {categories.map((entry) => {
              const active = entry.id === category?.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={t(`categories.${entry.id}`)}
                  title={t(`categories.${entry.id}`)}
                  onClick={() => showCategory(entry.id)}
                  className={cn(
                    'flex h-10 w-11 shrink-0 items-center justify-center rounded-[var(--r-md)] border text-[20px]',
                    'transition-all duration-150 active:scale-95',
                    active
                      ? 'border-[var(--gold)] bg-[var(--bg-3)]'
                      : 'border-[var(--border)] bg-[var(--bg-2)] hover:border-[var(--border-hi)]',
                  )}
                >
                  {entry.emojis[0]?.emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div ref={bodyRef} className="relative flex-1 overflow-y-auto px-4 pt-3 pb-6 sm:px-6">
        {needle ? (
          results.length === 0 ? (
            <p className="mt-6 text-center text-[13px] text-[var(--text-lo)]">
              {categories ? t('noResults') : t('loading')}
            </p>
          ) : (
            <IconGrid key={needle} items={results} value={value} onPick={choose} />
          )
        ) : tab === 'quest' && allowQuest ? (
          // Kept uploads lead the grid, then the bundled artwork: one set of icons to pick from.
          <div key="quest" className={cn(questGrid, 'animate-[fade-in_0.2s_ease]')}>
            {allowUpload &&
              images.map((url) => (
                <div key={url} className="group relative">
                  <IconCell
                    icon={url}
                    label={t('uploaded')}
                    selected={value === url}
                    large
                    onClick={() => choose(url)}
                  />
                  {library.includes(url) && (
                    <button
                      type="button"
                      aria-label={t('removeFromLibrary')}
                      title={t('removeFromLibrary')}
                      onClick={() => removeFromLibrary.mutate(url)}
                      className={cn(
                        'absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full',
                        'border border-[var(--border)] bg-[var(--bg-1)] text-[11px] text-[var(--text-lo)]',
                        'transition-all duration-150 hover:border-[var(--rose)] hover:text-[var(--rose)] active:scale-90',
                        // Always there on touch; on a mouse it waits for hover or focus.
                        'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100',
                      )}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            {QUEST_ICONS.map((name) => (
              <IconCell
                key={name}
                icon={name}
                label={name}
                selected={value === name}
                large
                onClick={() => choose(name)}
              />
            ))}
          </div>
        ) : !categories ? (
          <p className="mt-6 text-center text-[13px] text-[var(--text-lo)]">{t('loading')}</p>
        ) : category ? (
          <div key={category.id} className="animate-[fade-in_0.2s_ease]">
            <p className={cn(sectionTitle, 'mb-2')}>{t(`categories.${category.id}`)}</p>
            <IconGrid
              items={category.emojis.map((entry) => entry.emoji)}
              value={value}
              onPick={choose}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function IconGrid({
  items,
  value,
  onPick,
}: {
  items: string[];
  value: string;
  onPick: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2 animate-[fade-in_0.2s_ease]">
      {items.map((item) => (
        <IconCell
          key={item}
          icon={item}
          label={item}
          selected={value === item}
          onClick={() => onPick(item)}
        />
      ))}
    </div>
  );
}

function IconCell({
  icon,
  label,
  selected,
  large,
  onClick,
}: {
  icon: string;
  label: string;
  selected: boolean;
  large?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
      className={cn(
        'flex aspect-square w-full items-center justify-center rounded-[var(--r-md)] border bg-[var(--bg-2)]',
        'transition-all duration-150 hover:bg-[var(--bg-3)] active:scale-95',
        large ? 'text-[28px]' : 'text-[24px]',
        selected
          ? 'border-[var(--gold)] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.3)]'
          : 'border-[var(--border)] hover:border-[var(--border-hi)]',
      )}
    >
      <Icon icon={icon} />
    </button>
  );
}
