'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

import { CharacterCard } from '@/components/common/CharacterCard';
import { CoinIcon } from '@/components/common/CoinIcon';
import { Icon } from '@/components/common/Icon';
import { findClass, findCompanion, findRank } from '@/constants/hero-data';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { locales, type Locale } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { useUIStore } from '@/stores/ui.store';
import type { Character } from '../../types';
import { NotificationBell } from '../notifications/NotificationBell';

interface DashboardTopbarProps {
  char: Character;
  dateStr: string;
}

const DashboardTopbar = (props: DashboardTopbarProps) => {
  const { char, dateStr } = props;

  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const openSearch = useUIStore((s) => s.openSearch);

  const { data: profileData } = useProfile();
  const profile = profileData?.profile;
  const avatar = useAuthStore((s) => s.user?.avatar);
  const companion = profile ? findCompanion(profile.companionId) : null;
  const heroClass = profile ? findClass(profile.classId) : null;
  const rank = findRank(char.level);

  const displayName = profile?.heroName || char.name;

  // Mobile: bottom sheet — 2-phase mount/animate pattern for smooth enter + exit
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = () => {
    setSheetMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)));
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSheetMounted(false), 380);
  };

  const handleUserTriggerClick = () => {
    router.push('/dashboard');
  };

  const handleToggleLocale = () => {
    const currentIndex = locales.indexOf(locale);
    const nextLocale = locales[(currentIndex + 1) % locales.length] ?? locales[0];
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <div className={topBar}>
        {/* ── Mobile: Dashboard shortcut + Search + Bell (left) ───────────── */}
        <div className="flex min-[1025px]:hidden items-center gap-2">
          <Link href="/dashboard" className={tabletMenuBtn} aria-label={tNav('dashboard')}>
            <span className="text-[15px] leading-none text-[var(--gold)]">⌂</span>
          </Link>
          <button type="button" className={tabletMenuBtn} onClick={openSearch} aria-label="Search">
            <span className="text-[15px] leading-none text-[var(--gold)]">⌕</span>
          </button>
          <NotificationBell />
        </div>

        {/* ── User identity trigger — desktop, returns to dashboard ────────── */}
        <div className="hidden min-[1025px]:block">
          <button
            type="button"
            className={cn(userTrigger, 'hidden min-[1025px]:flex')}
            onClick={handleUserTriggerClick}
          >
            <span className={avatarBadge}>
              {avatar ? (
                <Image src={avatar} alt="Avatar" fill sizes="28px" className="object-cover" />
              ) : (
                (companion?.glyph ?? '🧝‍♀️')
              )}
            </span>
          </button>
        </div>

        {/* ── ◆ separator ─────────────────────────────────────────────────── */}
        <span className="hidden md:inline text-[var(--gold)] text-[8px] opacity-50">◆</span>

        {/* ── Gems + Coins (single unified bar) ──────────────────────────── */}
        <div className={cn(currencyBar, 'hidden sm:flex')}>
          <span className="flex items-center gap-1">
            <Icon icon="diamond" className={cn(currencyIcon, 'text-[var(--cyan)]')} />
            <span className="text-[var(--cyan)]">{char.gems.toLocaleString()}</span>
          </span>
          <span className="w-px h-3 bg-[var(--border)] opacity-60" />
          <span className="flex items-center gap-1">
            <CoinIcon className={currencyIcon} />
            <span className="text-[var(--gold)]">{char.coins.toLocaleString()}</span>
          </span>
        </div>

        {/* Mobile spacer — desktop swaps this for the centered search bar below */}
        <div className="flex-1 min-[1025px]:hidden" />

        {/* ── Desktop: centered search bar ───────────────────────────────── */}
        <div className="hidden min-[1025px]:flex flex-1 justify-center px-4">
          <button
            type="button"
            onClick={openSearch}
            className={cn(searchTrigger, 'w-full max-w-[480px] justify-between')}
            aria-label="Search"
          >
            <span className="flex items-center gap-2">
              <span className="text-[13px] leading-none text-[var(--gold)]">⌕</span>
              <span className="text-[var(--text-lo)]">{tNav('search')}…</span>
            </span>
            <span className="font-[var(--f-mono)] text-[9px] tracking-[0.1em] text-[var(--text-md)] bg-[var(--bg-3)] border border-b-2 border-[var(--border)] rounded-[3px] px-1.5 py-0.5">
              ⌘K
            </span>
          </button>
        </div>

        {/* ── Mobile: character card on the right — tapping opens the sheet ── */}
        <div className="block min-[1025px]:hidden">
          <CharacterCard
            name={displayName}
            rank={rank.name}
            avatarUrl={avatar}
            fallbackGlyph={companion?.glyph ?? '🧝‍♀️'}
            onClick={openSheet}
          />
        </div>

        {/* ── Desktop nav (1025px+): Streak | Bell | Logout ──────────────── */}
        <div className="hidden min-[1025px]:flex items-center gap-2">
          <div className={streakPill}>{tDash('streakDays', { count: char.streak })}</div>
          <NotificationBell />
        </div>
      </div>

      {/* ── Mobile bottom sheet ─────────────────────────────────────────────── */}
      {sheetMounted && (
        <>
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/60 min-[1025px]:hidden',
              'transition-opacity duration-300',
              sheetVisible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeSheet}
          />

          <div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 min-[1025px]:hidden',
              'bg-[var(--panel)] rounded-t-[24px] overflow-hidden',
              'border-t border-[oklch(0.74_0.17_85_/_0.2)]',
              'shadow-[0_-8px_40px_oklch(0_0_0_/_0.5)]',
              'transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
              sheetVisible ? 'translate-y-0' : 'translate-y-full',
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-[3px] rounded-full bg-[var(--border)]" />
            </div>

            {/* User profile section */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
              <div className="relative w-[52px] h-[52px] shrink-0 rounded-full bg-[linear-gradient(135deg,var(--gold),var(--violet),var(--gold))] p-0.5 shadow-[0_0_16px_var(--gold-glow)]">
                <div className="w-full h-full rounded-full bg-[var(--panel2)] flex items-center justify-center text-[24px] overflow-hidden">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt="Avatar"
                      fill
                      sizes="48px"
                      className="object-cover rounded-full"
                    />
                  ) : (
                    (companion?.glyph ?? '🧝‍♀️')
                  )}
                </div>
                <div className="absolute -bottom-[1px] -right-[1px] w-5 h-5 bg-[linear-gradient(135deg,var(--gold),#b45309)] rounded-[5px] flex items-center justify-center font-[var(--font-title)] text-[10px] font-black text-[#0a0400] border border-[var(--panel)] shadow-[0_0_8px_var(--gold-glow)]">
                  {rank.name[0]?.toUpperCase() ?? char.rank}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-[var(--font-title)] text-[16px] font-bold text-[var(--text-hi)] tracking-[0.04em] truncate">
                  {displayName}
                </div>
                {profile?.title && (
                  <div className="text-[10px] text-[var(--violet)] tracking-[0.06em] truncate mt-[1px]">
                    ◆ {profile.title} ◆
                  </div>
                )}
                <div className="flex items-center gap-1 text-[9px] text-[var(--text-mid)] tracking-[0.06em] mt-[3px]">
                  <span>
                    {heroClass?.glyph} {heroClass?.name ?? char.class}
                  </span>
                  <span className="opacity-40">·</span>
                  <span>{rank.name}</span>
                  <span className="opacity-40">·</span>
                  <span>Lv.{char.level}</span>
                </div>
              </div>
            </div>

            {/* Streak + date row */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
              <div className={streakPill}>{tDash('streakDays', { count: char.streak })}</div>
              <div className="flex-1" />
              <span className={dateLabel}>{dateStr}</span>
            </div>

            {/* Nav links */}
            <div className="px-4 pt-3 pb-2 flex flex-col gap-0.5">
              <Link href="/profile" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>✦</span>
                <span>
                  {tCommon('edit')} {tNav('profile')}
                </span>
              </Link>
              <Link href="/marketplace" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>
                  <Icon icon="🛍" />
                </span>
                <span>{tNav('marketplace')}</span>
              </Link>
              <Link href="/tasks" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>
                  <Icon icon="📋" />
                </span>
                <span>{tDash('questLog')}</span>
              </Link>
              <Link href="/projects" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>
                  <Icon icon="🚀" />
                </span>
                <span>{tNav('projects')}</span>
              </Link>
              <Link href="/finance" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>
                  <Icon icon="💰" />
                </span>
                <span>{tNav('finance')}</span>
              </Link>
            </div>

            <div className="h-px bg-[var(--border)] mx-4 my-1" />

            {/* Secondary actions */}
            <div className="px-4 pb-3 pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={sheetSecondaryBtn}
                onClick={() => {
                  handleToggleLocale();
                  closeSheet();
                }}
              >
                <Icon icon="🌐" />
                <span>{locale.toUpperCase()}</span>
              </button>
              <button
                type="button"
                className={cn(
                  sheetSecondaryBtn,
                  'text-[var(--rose)] border-[oklch(0.74_0.18_5_/_0.3)] hover:bg-[oklch(0.74_0.18_5_/_0.08)]',
                )}
                onClick={() => {
                  logout();
                  closeSheet();
                }}
              >
                <span>⏻</span>
                <span>Logout</span>
              </button>
            </div>

            <div className="pb-6" />
          </div>
        </>
      )}
    </>
  );
};

export default DashboardTopbar;

// ── Top bar ───────────────────────────────────────────────────────────────────

const topBar =
  'flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2.5 bg-[var(--panel)] border-b border-[var(--border)] shrink-0 z-10';

// ── Currency ──────────────────────────────────────────────────────────────────

const currencyBar =
  'flex items-center gap-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] px-3 py-[5px] text-[11px] font-bold font-[var(--font-title)] cursor-default shrink-0';

// ── Misc pills / labels ───────────────────────────────────────────────────────

const dateLabel = 'text-[11px] text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)]';

const streakPill =
  'flex items-center gap-[5px] bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.3)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)] tracking-[0.05em]';

const searchTrigger =
  'flex items-center gap-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] pl-[10px] pr-[6px] py-[5px] text-[11px] font-[var(--font-title)] tracking-[0.04em] transition-colors duration-200 cursor-pointer hover:border-[oklch(0.74_0.17_85_/_0.35)]';

// ── User trigger ──────────────────────────────────────────────────────────────

const userTrigger =
  'flex items-center gap-2 rounded-[var(--r-sm)] px-2 py-1 transition-colors duration-200 cursor-pointer hover:bg-[oklch(0.74_0.17_85_/_0.06)] focus:outline-none';
const avatarBadge =
  'relative w-7 h-7 rounded-[40%] bg-[var(--panel2)] border border-[oklch(0.74_0.17_85_/_0.3)] flex items-center justify-center text-[16px] shrink-0 overflow-hidden';

const currencyIcon = 'w-[20px] h-[20px] shrink-0';

// ── Bottom sheet items ────────────────────────────────────────────────────────

const sheetItem =
  'flex items-center gap-3 w-full px-3 py-[11px] rounded-[var(--r-sm)] text-[13px] font-semibold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.03em] cursor-pointer transition-colors duration-150 hover:bg-[var(--panel2)] no-underline';

const sheetItemIcon = 'w-[22px] text-center text-[16px] leading-none shrink-0';

const sheetSecondaryBtn =
  'flex items-center justify-center gap-2 py-[10px] px-3 rounded-[var(--r-sm)] border border-[var(--border)] text-[12px] font-bold font-[var(--font-title)] tracking-[0.06em] text-[var(--text-mid)] cursor-pointer transition-colors duration-150 hover:bg-[var(--panel2)] hover:text-[var(--text-hi)]';

const tabletMenuBtn =
  'w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors shrink-0';
