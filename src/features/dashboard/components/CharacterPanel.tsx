'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import Image from 'next/image';

import subBg from '@/assets/images/Sub_BG.png';
import { GoldPanel } from '@/components/common/GoldPanel';
import { Icon } from '@/components/common/Icon';
import type { Character, DashboardSettings } from '../types';
import { cn } from '@/libs/utils';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { findClass, findCompanion } from '@/constants/hero-data';
import type { HeroStats } from '@/types/profile';

interface CharacterPanelProps {
  char: Character;
  settings: DashboardSettings;
}

const STAT_CONFIG: { key: string; field: keyof HeroStats; color: string }[] = [
  { key: 'DIS', field: 'discipline', color: 'var(--gold)' },
  { key: 'WIS', field: 'wisdom', color: 'var(--violet)' },
  { key: 'END', field: 'endurance', color: 'var(--mint)' },
  { key: 'COM', field: 'composition', color: 'var(--cyan)' },
  { key: 'SER', field: 'serenity', color: 'var(--rose)' },
];

export function CharacterPanel({ char, settings }: CharacterPanelProps) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tDash = useTranslations('dashboard');
  const { data: profileData } = useProfile();

  const profile = profileData?.profile;
  const avatar = useAuthStore((s) => s.user?.avatar);
  const logout = useLogout();

  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  const handleToggleLocale = () => {
    const currentIndex = locales.indexOf(locale);
    const nextLocale = locales[(currentIndex + 1) % locales.length] ?? locales[0];
    router.replace(pathname, { locale: nextLocale });
  };

  const xpPct = (char.xp / char.xpNext) * 100;
  const displayName = profile?.heroName || settings.characterName || char.name;
  const displayTitle = profile?.title || char.title;
  const heroClass = profile ? findClass(profile.classId) : null;
  const companion = profile ? findCompanion(profile.companionId) : null;

  const statPool = profile?.statPool ?? 30;
  const heroStats = STAT_CONFIG.map((s) => ({
    key: s.key,
    value: profile?.stats[s.field] ?? 0,
    color: s.color,
    barPct: profile ? Math.min(Math.round((profile.stats[s.field] / statPool) * 100), 100) : 0,
  }));

  return (
    <GoldPanel className="shrink-0">
      <div className={panelHeader}>
        <span className={profileLabel}>{tNav('profile')}</span>
        <span className="flex-1" />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            className={cn(levelLabel, levelTrigger)}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon
              icon="CardChevron"
              useMappedColor={false}
              className="text-[14px] -scale-y-100 transition-transform duration-200"
            />
          </button>
          {menuOpen && (
            <div className={menuDropdown} role="menu">
              <Link
                href="/profile"
                className={menuItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-[var(--gold)]">✦</span>
                <span>
                  {tCommon('edit')} {tNav('profile')}
                </span>
              </Link>
              <Link
                href="/tasks"
                className={menuItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Icon icon="📋" />
                <span>{tDash('questLog')}</span>
              </Link>
              <Link
                href="/projects"
                className={menuItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Icon icon="🚀" />
                <span>{tNav('projects')}</span>
              </Link>
              <Link
                href="/marketplace"
                className={cn(menuItem, 'text-[var(--violet)]')}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Icon icon="🛍" />
                <span>{tNav('marketplace')}</span>
              </Link>
              <div className="h-px bg-[var(--border)] my-1" />
              <button
                type="button"
                className={cn(menuItem, 'w-full text-left')}
                role="menuitem"
                onClick={() => {
                  handleToggleLocale();
                  setMenuOpen(false);
                }}
              >
                <Icon icon="🌐" />
                <span>{localeLabels[locale]}</span>
                <span className="ml-auto text-[9px] opacity-50">↺</span>
              </button>
              <div className="h-px bg-[var(--border)] my-1" />
              <button
                type="button"
                className={cn(menuItem, 'w-full text-left text-[var(--rose)]')}
                role="menuitem"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
              >
                <span>⏻</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={avatarWrap}>
        <div className={halo} />
        <div className={avatarRing}>
          <div className={avatarInner}>
            {avatar ? (
              <Image src={avatar} alt="Avatar" fill sizes="156px" className="object-cover" />
            ) : (
              <Icon useMappedColor icon={companion?.glyph ?? '🧝‍♀️'} />
            )}
          </div>
        </div>
        <Image src={subBg} alt="" aria-hidden width={50} height={29} className={avatarBase} />
      </div>
      <div className={charName}>{displayName}</div>
      <div className={charTitleLine}>◆ {displayTitle} ◆</div>
      <div className={metaWrap}>
        <div className={metaItem}>
          <div className={metaVal}>{char.level}</div>
          <div className={metaKey}>{tCommon('level')}</div>
        </div>
        <div className={metaDivider} />
        <div className={metaItem}>
          <div className={metaVal} style={{ color: 'var(--rose)' }}>
            {char.streak}
          </div>
          <div className={metaKey}>{tCommon('streak')}</div>
        </div>
        <div className={metaDivider} />
        <div className={metaItem}>
          <div className={metaVal} style={{ color: 'var(--mint)' }}>
            {heroClass?.glyph ?? char.class}
          </div>
          <div className={metaKey}>{tCommon('class')}</div>
        </div>
      </div>
      <div className={xpWrap}>
        <div className={xpLabel}>
          <span>{tCommon('exp')}</span>
          <span className={xpValue}>
            {char.xp.toLocaleString()} / {char.xpNext.toLocaleString()}
          </span>
        </div>
        <div className={xpTrack}>
          <div className={xpFill} style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      <div className={statsWrap}>
        {heroStats.map((s) => (
          <div className={statRow} key={s.key}>
            <span className={statKey}>{s.key}</span>
            <div className={statTrack}>
              <div className={statFill} style={{ width: `${s.barPct}%`, background: s.color }} />
            </div>
            <span className={statVal}>{s.value}</span>
          </div>
        ))}
      </div>
    </GoldPanel>
  );
}

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';

const profileLabel =
  'text-[9px] text-[var(--gold)] font-[var(--font-title)] font-bold tracking-[0.15em]';
const levelLabel = 'text-[10px] text-[var(--text-mid)]';
const levelTrigger =
  'flex items-center gap-1 cursor-pointer hover:text-[var(--gold)] transition-[color,filter] duration-200 focus:outline-none hover:[filter:drop-shadow(0_0_5px_var(--gold-border))_drop-shadow(0_0_12px_var(--gold-glow))]';
const menuDropdown =
  'absolute top-[calc(100%+6px)] right-0 z-50 min-w-[168px] bg-[var(--panel)] border border-[oklch(0.74_0.17_85_/_0.35)] rounded-[var(--r-sm)] shadow-[0_8px_24px_oklch(0_0_0_/_0.45)] overflow-hidden py-1';
const menuItem =
  'flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.04em] no-underline transition-colors duration-150 hover:bg-[var(--panel2)] cursor-pointer';

const avatarWrap = 'relative flex justify-center px-4 pt-4 pb-2';
const avatarBase =
  'absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 w-[50px] h-auto pointer-events-none select-none';
const halo =
  'absolute w-[184px] h-[184px] rounded-full bg-[radial-gradient(circle,var(--violet-glow)_0%,transparent_70%)] top-2 left-1/2 -translate-x-1/2 pointer-events-none';
const avatarRing =
  'relative w-[156px] h-[156px] rounded-[40%] bg-[linear-gradient(135deg,var(--gold),var(--violet),var(--gold))] p-0.5 shadow-[0_0_24px_var(--gold-glow),0_0_48px_var(--violet-glow)]';
const avatarInner =
  'relative w-full h-full rounded-[40%] bg-[var(--panel2)] flex items-center justify-center overflow-hidden text-[64px]';

const charName =
  'font-[family-name:var(--font-bento)] text-[22px] tracking-[0.06em] bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] bg-clip-text text-transparent text-center px-3 pb-0.5 truncate';
const charTitleLine =
  'font-[family-name:var(--font-fell)] text-[13px] text-[var(--violet)] text-center tracking-[0.08em] pb-2 font-medium';

const metaWrap = 'flex justify-center gap-3 px-3 pb-2.5';
const metaItem = 'text-center';
const metaVal = 'font-[var(--font-title)] text-[14px] font-bold text-[var(--gold)]';
const metaKey = 'text-[9px] text-[var(--text-mid)] tracking-[0.1em] uppercase';
const metaDivider = 'w-px bg-[var(--border)] self-stretch';

const xpWrap = 'px-[14px] pb-3';
const xpLabel =
  'flex justify-between text-[9px] text-[var(--text-mid)] tracking-[0.08em] uppercase mb-1';
const xpValue = 'text-[var(--violet)] font-semibold';
const xpTrack =
  'h-[6px] bg-[var(--panel3)] rounded-[3px] overflow-hidden border border-[var(--border)]';
const xpFill =
  "h-full rounded-[3px] bg-[linear-gradient(90deg,var(--violet-dim),var(--violet))] shadow-[0_0_8px_var(--violet-glow)] transition-[width] duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-[60%] after:h-full after:bg-[linear-gradient(90deg,transparent,oklch(1_0_0_/_0.4),transparent)] after:animate-[shimmer_2.5s_infinite]";

const statsWrap = 'px-[14px] pb-3 flex flex-col gap-1.5';
const statRow = 'flex items-center gap-1.5';
const statKey =
  'text-[9px] font-[var(--font-title)] tracking-[0.1em] text-[var(--text-mid)] w-7 shrink-0';
const statTrack =
  'flex-1 h-[5px] bg-[var(--panel3)] rounded-[3px] overflow-hidden border border-[var(--border)]';
const statFill =
  'h-full rounded-[3px] transition-[width] duration-[600ms] ease-[ease] shadow-[0_0_6px_currentColor]';
const statVal = 'text-[9px] font-bold text-[var(--text-mid)] w-[22px] text-right shrink-0';
