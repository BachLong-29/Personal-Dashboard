import { memo } from 'react';

import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';

import type { CenterTab } from '../../types';

type MobilePanel = 'center' | 'character' | 'timer';

interface Props {
  centerTab: CenterTab;
  mobilePanel: MobilePanel;
  onTabChange: (tab: CenterTab) => void;
  onPanelChange: (panel: MobilePanel) => void;
}

export const MobileNav = memo(function MobileNav({
  centerTab,
  mobilePanel,
  onTabChange,
  onPanelChange,
}: Props) {
  const t = useTranslations('dashboard');

  const items = [
    {
      id: 'habits',
      icon: 'fire',
      label: t('tabs.habits'),
      isActive: mobilePanel === 'center' && centerTab === 'habits',
      onClick: () => onTabChange('habits'),
    },
    {
      id: 'schedule',
      icon: 'calendar',
      label: t('tabs.schedule'),
      isActive: mobilePanel === 'center' && centerTab === 'schedule',
      onClick: () => onTabChange('schedule'),
    },
    {
      id: 'stats',
      icon: '📊',
      label: t('tabs.stats'),
      isActive: mobilePanel === 'center' && centerTab === 'stats',
      onClick: () => onTabChange('stats'),
    },
    {
      id: 'character',
      icon: '🧝',
      label: 'Hero',
      isActive: mobilePanel === 'character',
      onClick: () => onPanelChange('character'),
    },
    {
      id: 'timer',
      icon: '⏱',
      label: 'Timer',
      isActive: mobilePanel === 'timer',
      onClick: () => onPanelChange('timer'),
    },
  ];

  return (
    <nav aria-label="Main navigation" className={nav}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.isActive ? 'page' : undefined}
          onClick={item.onClick}
          className={cn(navBtn, item.isActive && navBtnActive)}
        >
          <Icon icon={item.icon} className="text-[16px] leading-none" />
          <span className="leading-none">{item.label}</span>
        </button>
      ))}
    </nav>
  );
});

const nav =
  'min-[1025px]:hidden fixed bottom-0 left-0 right-0 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur-xl z-20';
const navBtn =
  'flex flex-col items-center justify-center gap-[3px] py-2 px-1 text-[var(--text-lo)] cursor-pointer transition-colors duration-200 select-none text-[8px] font-[var(--font-title)] tracking-[0.05em] uppercase';
const navBtnActive =
  'text-[var(--gold)] [&>span:first-child]:drop-shadow-[0_0_8px_var(--gold-glow)]';
