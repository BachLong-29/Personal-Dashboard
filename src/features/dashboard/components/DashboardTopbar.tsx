'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { findClass, findCompanion, findRank } from '@/constants/hero-data';
import type { Character } from '../types';
import { cn } from '@/libs/utils';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface DashboardTopbarProps {
  char: Character;
  dateStr: string;
  onEndDay: () => void;
}

const DashboardTopbar = (props: DashboardTopbarProps) => {
  const { char, dateStr, onEndDay } = props;

  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();

  const { data: profileData } = useProfile();
  const profile = profileData?.profile;
  const companion = profile ? findCompanion(profile.companionId) : null;
  const heroClass = profile ? findClass(profile.classId) : null;
  const rank = findRank(char.level);

  const displayName = profile?.heroName || char.name;

  // Desktop: user identity dropdown
  const [showUserModal, setShowUserModal] = useState(false);
  const userModalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(userModalRef, () => setShowUserModal(false));

  // Mobile: bottom sheet — 2-phase mount/animate pattern for smooth enter + exit
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = () => {
    setSheetMounted(true);
    // Double rAF: let the browser paint the hidden element before triggering transition
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetVisible(true)));
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSheetMounted(false), 380);
  };

  const handleToggleLocale = () => {
    const currentIndex = locales.indexOf(locale);
    const nextLocale = locales[(currentIndex + 1) % locales.length] ?? locales[0];
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <>
      <div className={topBar}>
        {/* ── User identity trigger → dropdown (all sizes) ────────────────── */}
        <div ref={userModalRef} className="relative block">
          <button type="button" className={userTrigger} onClick={() => setShowUserModal((v) => !v)}>
            <span className={avatarBadge}>{companion?.glyph ?? '🧝‍♀️'}</span>
            <span className={cn(topBarLogo, 'max-w-[80px] truncate md:max-w-none')}>
              {displayName}
            </span>
            <span className={cn(triggerCaret, 'hidden md:inline')}>
              {showUserModal ? '▲' : '▼'}
            </span>
          </button>

          {showUserModal && (
            <div className={userModal}>
              <div className={userModalCornerTL} />
              <div className={userModalCornerTR} />
              <div className={userModalCornerBL} />
              <div className={userModalCornerBR} />

              <div className={modalAvatarRow}>
                <div className={modalAvatarRing}>
                  <div className={modalAvatarInner}>{companion?.glyph ?? '🧝‍♀️'}</div>
                  <div className={modalRankBadge}>{rank.name[0]?.toUpperCase() ?? char.rank}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={modalName}>{displayName}</div>
                  {profile?.title && <div className={modalTitle}>◆ {profile.title} ◆</div>}
                  <div className={modalMeta}>
                    <span>
                      {heroClass?.glyph} {heroClass?.name ?? char.class}
                    </span>
                    <span className={modalMetaDot}>·</span>
                    <span>{rank.name}</span>
                    <span className={modalMetaDot}>·</span>
                    <span>Lv.{char.level}</span>
                  </div>
                </div>
              </div>

              <div className={modalDivider} />

              <div className={modalCurrencyRow}>
                <div className={modalCurrencyItem}>
                  <span className={modalCurrencyIcon}>💠</span>
                  <div>
                    <div className={modalCurrencyVal}>{char.gems.toLocaleString()}</div>
                    <div className={modalCurrencyKey}>Gems</div>
                  </div>
                </div>
                <div className={modalCurrencyDivider} />
                <div className={modalCurrencyItem}>
                  <span className={modalCurrencyIcon}>🪙</span>
                  <div>
                    <div className={cn(modalCurrencyVal, 'text-[var(--gold)]')}>
                      {char.coins.toLocaleString()}
                    </div>
                    <div className={modalCurrencyKey}>Gold</div>
                  </div>
                </div>
              </div>

              <div className={modalDivider} />

              <div className={modalActions}>
                <Link
                  href="/profile"
                  className={modalActionBtn}
                  onClick={() => setShowUserModal(false)}
                >
                  ✦ {tCommon('edit')} {tNav('profile')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── ◆ separator ─────────────────────────────────────────────────── */}
        <span className="hidden md:inline text-[var(--gold)] text-[8px] opacity-50">◆</span>

        {/* ── Gems + Coins: 2 rows on mobile, side-by-side on desktop ──────── */}
        <div className="flex flex-row gap-1 sm:gap-2 sm:items-center">
          <div className={cn(currencyPill, gems)}>
            <span className={currencyIcon}>💠</span>
            <span>{char.gems}</span>
          </div>
          <div className={cn(currencyPill, coins)}>
            <span className={currencyIcon}>🪙</span>
            <span>{char.coins}</span>
          </div>
        </div>

        {/* Back to dashboard — shown when on a sub-page */}
        {!pathname.startsWith('/dashboard') && (
          <Link href="/dashboard" className={backBtn} title="Return to Dashboard">
            ◂ Dashboard
          </Link>
        )}

        <div className="flex-1" />

        {/* ── Menu button — all sizes ≤ 1024px (mobile + tablet) ──────────── */}
        <button
          type="button"
          className={cn(tabletMenuBtn, 'flex min-[1025px]:hidden')}
          onClick={openSheet}
          aria-label="Open menu"
        >
          <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
            <rect y="0" width="14" height="1.5" rx="0.75" />
            <rect y="4.75" width="14" height="1.5" rx="0.75" />
            <rect y="9.5" width="10" height="1.5" rx="0.75" />
          </svg>
        </button>

        {/* ── Desktop nav (1025px+) ───────────────────────────────────────── */}
        <div className="hidden min-[1025px]:flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className={penaltyTrigger}
            onClick={onEndDay}
            title={tDash('buttons.endDayTitle')}
          >
            ⚠ {tDash('endDay')}
          </Button>
          <div className={dateLabel}>{dateStr}</div>
          <Link href="/marketplace" className={cn(navPill, marketplacePill)}>
            🛍 {tNav('marketplace')}
          </Link>
          <Link href="/tasks" className={cn(streakPill, 'no-underline cursor-pointer')}>
            ✦ Quest Log
          </Link>
          <Button
            type="button"
            variant="ghost"
            className={cn(navPill, languagePill)}
            onClick={handleToggleLocale}
            aria-label={tDash('buttons.toggleLanguage')}
            title={localeLabels[locale]}
          >
            🌐 {locale.toUpperCase()}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              navPill,
              'text-[var(--text-lo)] hover:text-[var(--rose)] hover:!border-[oklch(0.74_0.18_5_/_0.4)]',
            )}
            onClick={logout}
            aria-label="Logout"
          >
            ⏻
          </Button>
          <div className={streakPill}>{tDash('streakDays', { count: char.streak })}</div>
        </div>
      </div>

      {/* ── Mobile bottom sheet ─────────────────────────────────────────────── */}
      {sheetMounted && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/60 min-[1025px]:hidden',
              'transition-opacity duration-300',
              sheetVisible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeSheet}
          />

          {/* Sheet */}
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
                <div className="w-full h-full rounded-full bg-[var(--panel2)] flex items-center justify-center text-[24px]">
                  {companion?.glyph ?? '🧝‍♀️'}
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

            {/* Primary actions */}
            <div className="px-4 pt-3 pb-2 flex flex-col gap-0.5">
              <button
                type="button"
                className={cn(sheetItem, 'text-[oklch(0.85_0.18_22)]')}
                onClick={() => {
                  onEndDay();
                  closeSheet();
                }}
              >
                <span className={sheetItemIcon}>⚠</span>
                <span>{tDash('endDay')}</span>
              </button>

              <Link href="/profile" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>✦</span>
                <span>
                  {tCommon('edit')} {tNav('profile')}
                </span>
              </Link>

              <Link href="/marketplace" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>🛍</span>
                <span>{tNav('marketplace')}</span>
              </Link>

              <Link href="/tasks" className={sheetItem} onClick={closeSheet}>
                <span className={sheetItemIcon}>✦</span>
                <span>Quest Log</span>
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
                <span>🌐</span>
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

            {/* Safe area for iOS home indicator */}
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

const topBarLogo =
  'font-[var(--font-title)] text-[18px] font-black tracking-[0.12em] bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] bg-clip-text text-transparent';

// ── Currency ──────────────────────────────────────────────────────────────────

const currencyPill =
  'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] py-1 pr-3 pl-2 text-[12px] font-semibold text-[var(--text-hi)] cursor-default';
const currencyIcon = 'text-[14px]';
const gems = '!border-[oklch(0.66_0.22_295_/_0.4)]';
const coins = '!border-[oklch(0.74_0.17_85_/_0.4)]';

// ── Misc pills ────────────────────────────────────────────────────────────────

const dateLabel = 'text-[11px] text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)]';

const streakPill =
  'flex items-center gap-[5px] bg-[oklch(0.74_0.17_85_/_0.1)] border border-[oklch(0.74_0.17_85_/_0.3)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)] tracking-[0.05em]';

const navPill =
  'flex items-center gap-[6px] bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] px-[10px] py-1 text-[11px] font-bold font-[var(--font-title)] tracking-[0.05em] transition-colors duration-200 no-underline cursor-pointer hover:border-[oklch(0.74_0.17_85_/_0.35)]';
const marketplacePill =
  'text-[var(--violet)] border-[oklch(0.66_0.22_295_/_0.35)] hover:border-[oklch(0.66_0.22_295_/_0.55)]';
const languagePill =
  'text-[var(--text-mid)] hover:text-[var(--text-hi)] focus:outline-none focus:ring-2 focus:ring-[var(--border)]';

const backBtn =
  'flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.74_0.17_85_/_0.08)] border border-[oklch(0.74_0.17_85_/_0.3)] rounded-[var(--r-sm)] text-[9px] font-bold text-[var(--gold)] font-[var(--font-title)] tracking-[0.08em] no-underline transition-all hover:bg-[oklch(0.74_0.17_85_/_0.15)] hover:border-[oklch(0.74_0.17_85_/_0.55)] cursor-pointer shrink-0';

const penaltyTrigger =
  'inline-flex items-center gap-[6px] bg-[oklch(0.62_0.24_22_/_0.1)] border border-[oklch(0.62_0.24_22_/_0.4)] text-[oklch(0.85_0.18_22)] px-[11px] py-[5px] rounded-[var(--r-sm)] text-[10px] font-[var(--font-title)] tracking-[0.12em] font-bold cursor-pointer transition-all duration-200 ml-1 hover:bg-[oklch(0.62_0.24_22_/_0.2)] hover:shadow-[0_0_12px_var(--danger-glow)]';

// ── User trigger & modal ──────────────────────────────────────────────────────

const userTrigger =
  'flex items-center gap-2 rounded-[var(--r-sm)] px-2 py-1 transition-colors duration-200 cursor-pointer hover:bg-[oklch(0.74_0.17_85_/_0.06)] focus:outline-none';
const avatarBadge =
  'w-7 h-7 rounded-full bg-[var(--panel2)] border border-[oklch(0.74_0.17_85_/_0.3)] flex items-center justify-center text-[16px] shrink-0';
const triggerCaret = 'text-[8px] text-[var(--text-lo)] ml-[-2px] transition-transform duration-200';

const userModal =
  'absolute top-[calc(100%+8px)] left-0 z-50 w-[280px] bg-[var(--panel)] border border-[oklch(0.74_0.17_85_/_0.35)] rounded-[var(--r)] shadow-[0_8px_32px_oklch(0_0_0_/_0.4),0_0_20px_oklch(0.74_0.17_85_/_0.08)] overflow-hidden';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)]';
const userModalCornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const userModalCornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const userModalCornerBL = cn(
  cornerBase,
  'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]',
);
const userModalCornerBR = cn(
  cornerBase,
  'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]',
);

const modalAvatarRow = 'flex items-center gap-3 px-4 pt-4 pb-3';
const modalAvatarRing =
  'relative w-[52px] h-[52px] rounded-full bg-[linear-gradient(135deg,var(--gold),var(--violet),var(--gold))] p-0.5 shadow-[0_0_16px_var(--gold-glow)] shrink-0';
const modalAvatarInner =
  'w-full h-full rounded-full bg-[var(--panel2)] flex items-center justify-center text-[24px]';
const modalRankBadge =
  'absolute -bottom-[1px] -right-[1px] w-5 h-5 bg-[linear-gradient(135deg,var(--gold),#b45309)] rounded-[5px] flex items-center justify-center font-[var(--font-title)] text-[10px] font-black text-[#0a0400] border border-[var(--panel)] shadow-[0_0_8px_var(--gold-glow)]';
const modalName =
  'font-[var(--font-title)] text-[14px] font-bold text-[var(--text-hi)] tracking-[0.05em] truncate';
const modalTitle =
  'text-[10px] text-[var(--violet)] tracking-[0.08em] font-medium truncate mt-[1px]';
const modalMeta =
  'flex items-center gap-1 text-[9px] text-[var(--text-mid)] tracking-[0.06em] mt-[3px]';
const modalMetaDot = 'opacity-40';

const modalDivider = 'h-px bg-[var(--border)] mx-4';
const modalCurrencyRow = 'flex items-center px-4 py-3 gap-4';
const modalCurrencyItem = 'flex items-center gap-2 flex-1';
const modalCurrencyIcon = 'text-[22px] leading-none';
const modalCurrencyVal =
  'font-[var(--font-title)] text-[16px] font-bold text-[var(--text-hi)] leading-none';
const modalCurrencyKey = 'text-[9px] text-[var(--text-mid)] tracking-[0.1em] uppercase mt-[2px]';
const modalCurrencyDivider = 'w-px h-[36px] bg-[var(--border)]';

const modalActions = 'px-4 pb-4 pt-1';
const modalActionBtn =
  'flex items-center justify-center gap-1.5 w-full py-[7px] rounded-[var(--r-sm)] border border-[oklch(0.74_0.17_85_/_0.35)] text-[var(--gold)] font-[var(--font-title)] text-[10px] tracking-[0.12em] font-bold no-underline transition-all duration-200 hover:bg-[oklch(0.74_0.17_85_/_0.08)] hover:border-[oklch(0.74_0.17_85_/_0.6)]';

// ── Bottom sheet items ────────────────────────────────────────────────────────

const sheetItem =
  'flex items-center gap-3 w-full px-3 py-[11px] rounded-[var(--r-sm)] text-[13px] font-semibold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.03em] cursor-pointer transition-colors duration-150 hover:bg-[var(--panel2)] no-underline';

const sheetItemIcon = 'w-[22px] text-center text-[16px] leading-none shrink-0';

const sheetSecondaryBtn =
  'flex items-center justify-center gap-2 py-[10px] px-3 rounded-[var(--r-sm)] border border-[var(--border)] text-[12px] font-bold font-[var(--font-title)] tracking-[0.06em] text-[var(--text-mid)] cursor-pointer transition-colors duration-150 hover:bg-[var(--panel2)] hover:text-[var(--text-hi)]';

const tabletMenuBtn =
  'w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors shrink-0';
