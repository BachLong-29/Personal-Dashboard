'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { CoinIcon } from '@/components/common/CoinIcon';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

import { REWARD_DATA } from '../data/mock';
import { MARKET_CATEGORIES, RARITY_COLOR } from '../constants';
import type {
  MarketPlayerState,
  MarketReward,
  MarketRewardCategoryKey,
  MarketBattlePassNode as MarketBattlePassNodeData,
  MarketFeaturedReward,
} from '../types';
import { MarketRewardCard } from './MarketRewardCard';
import { MarketRewardDetailModal } from './MarketRewardDetailModal';
import { MarketBattlePassNode } from './MarketBattlePassNode';
import { MarketFeaturedBanner } from './MarketFeaturedBanner';

export function MarketPlace() {
  const tMarket = useTranslations('marketplace');
  const [activeCat, setActiveCat] = useState<MarketRewardCategoryKey>('all');
  const [selected, setSelected] = useState<MarketReward | null>(null);
  const [player, setPlayer] = useState<MarketPlayerState>(() => ({
    ...(REWARD_DATA.player as Omit<MarketPlayerState, 'achievement'>),
    achievement: 0,
  }));
  const [rewards, setRewards] = useState<MarketReward[]>(
    () => REWARD_DATA.rewards as MarketReward[],
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCat === 'all') return rewards;
    return rewards.filter((r) => r.cat === activeCat);
  }, [activeCat, rewards]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rewards.length };
    rewards.forEach((r) => {
      c[r.cat] = (c[r.cat] || 0) + 1;
    });
    return c;
  }, [rewards]);

  const handleRedeem = (reward: MarketReward) => {
    const hasStock = reward.stock == null || reward.stock > 0;
    if (reward.locked) return;
    if (player.level < reward.reqLevel) return;
    if (reward.currency !== 'achievement' && player[reward.currency] < reward.price) return;
    if (!hasStock) return;

    if (reward.currency !== 'achievement' && reward.price > 0) {
      setPlayer((p) => ({ ...p, [reward.currency]: p[reward.currency] - reward.price }));
    }

    setFlashColor(RARITY_COLOR[reward.rarity]);
    window.setTimeout(() => setFlashColor(null), 800);

    setSuccessMsg(`✦ ${reward.title.toUpperCase()} ACQUIRED ✦`);
    window.setTimeout(() => setSuccessMsg(null), 3000);

    if (reward.stock != null) {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === reward.id ? { ...r, stock: Math.max(0, (r.stock ?? 0) - 1) } : r,
        ),
      );
    }

    setSelected(null);
  };

  return (
    <>
      {flashColor && <div className={redeemFlash} style={{ color: flashColor }} />}
      {successMsg && (
        <div className={successToast}>
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className={topbar}>
        <Link className={topbarBack} href="/dashboard">
          ← Dashboard
        </Link>
        <Image src="/logo.png" alt="Aetheria logo" width={36} height={36} className={topbarLogo} />
        <span className={topbarDiamond}>◆</span>
        <span className={topbarSection}>REWARD VAULT</span>
        <div className="flex-1" />
        <div className={cn(currencyPill, currencyPillXp)}>
          <span className={currencyPillIcon}>⚡</span>
          <span>LV.{player.level}</span>
        </div>
        <div className={cn(currencyPill, currencyPillGems)}>
          <span className={currencyPillIcon}>💠</span>
          <span>{player.gems.toLocaleString()}</span>
        </div>
        <div className={cn(currencyPill, currencyPillCoins)}>
          <span className={currencyPillIcon}>
            <CoinIcon />
          </span>
          <span>{player.coins.toLocaleString()}</span>
        </div>
        <Link className={manageBtn} href="/manage/rewards">
          ◈ Manage Rewards
        </Link>
      </div>

      <div className={hero}>
        <div className={heroTitleRow}>
          <h1 className={heroTitle}>Reward Vault</h1>
          <div className={heroSub}>◆ The Spoils of Discipline ◆</div>
        </div>

        <MarketFeaturedBanner
          featured={REWARD_DATA.featured as MarketFeaturedReward}
          onClaim={(r) => setSelected(r)}
        />

        <div className={battlePass}>
          <div className={bpHeader}>
            <span className={bpTitle}>◆ Aetheric Path</span>
            <span className="flex-1" />
            <span className={bpProgress}>
              <strong className={bpProgressStrong}>Lv.{player.passLevel}</strong> /{' '}
              {player.passMaxLevel} milestones
            </span>
          </div>
          <div className={bpTrack}>
            {(REWARD_DATA.battlePass as MarketBattlePassNodeData[]).map((node) => (
              <MarketBattlePassNode key={node.lv} node={node} />
            ))}
          </div>

          <div className={bpProgressTrack}>
            <div
              className={bpProgressFill}
              style={{ width: `${(player.passLevel / player.passMaxLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className={marketWrap}>
        <div className={catTabs}>
          {MARKET_CATEGORIES.map((cat) => (
            <Button
              key={cat.key}
              type="button"
              variant="ghost"
              className={cn(catTab, activeCat === cat.key && catTabActive)}
              onClick={() => setActiveCat(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{tMarket(`categories.${cat.key}`)}</span>
              <span className={cn(catTabCount, activeCat === cat.key && catTabCountActive)}>
                {counts[cat.key] || 0}
              </span>
            </Button>
          ))}
        </div>

        <div className={rewardsGrid}>
          {filtered.map((r) => (
            <MarketRewardCard key={r.id} reward={r} player={player} onClick={setSelected} />
          ))}
        </div>
      </div>

      {selected && (
        <MarketRewardDetailModal
          reward={selected}
          player={player}
          onClose={() => setSelected(null)}
          onRedeem={handleRedeem}
        />
      )}

      <style jsx global>{`
        @keyframes marketplace-aurora-drift {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-30px, 20px);
          }
        }
        @keyframes marketplace-featured-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes marketplace-spin-rev {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes marketplace-holo-shift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 300% 50%;
          }
        }
        @keyframes marketplace-legend-sweep {
          to {
            left: 200%;
          }
        }
        @keyframes marketplace-detail-in {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes marketplace-redeem-flash {
          0% {
            opacity: 0;
          }
          30% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes marketplace-toast-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes marketplace-toast-out {
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
        }
      `}</style>
    </>
  );
}

const topbar =
  'flex items-center gap-3 px-6 py-3 bg-[linear-gradient(180deg,var(--panel),oklch(0.06_0.02_260_/_0.95))] border-b border-[var(--border)] backdrop-blur-[10px] sticky top-0 z-50';
const topbarBack =
  'flex items-center gap-1.5 text-[11px] text-[var(--text-mid)] no-underline px-3 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--panel2)] font-[var(--font-title)] tracking-[0.1em] transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]';
const topbarLogo = 'h-9 w-9 object-contain drop-shadow-[0_0_12px_var(--violet-glow)]';
const topbarDiamond = 'text-[var(--gold)] text-[8px] opacity-50';
const topbarSection =
  'font-[var(--font-title)] text-[12px] tracking-[0.2em] text-[var(--text-mid)]';
const manageBtn =
  'flex items-center gap-1.5 text-[10px] font-bold text-[var(--violet)] no-underline px-3 py-1.5 rounded-[6px] border border-[oklch(0.66_0.22_295_/_0.4)] bg-[oklch(0.66_0.22_295_/_0.06)] font-[var(--font-title)] tracking-[0.1em] transition-all duration-200 hover:border-[oklch(0.66_0.22_295_/_0.7)] hover:bg-[oklch(0.66_0.22_295_/_0.12)] hover:shadow-[0_0_10px_oklch(0.66_0.22_295_/_0.25)] shrink-0';

const currencyPill =
  'flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] px-[14px] py-[5px] pl-[10px] text-[13px] font-bold font-[var(--font-title)] tracking-[0.05em]';
const currencyPillIcon = 'text-[14px]';
const currencyPillGems =
  'border-[oklch(0.66_0.22_295_/_0.4)] text-[var(--violet)] shadow-[0_0_12px_oklch(0.66_0.22_295_/_0.15)]';
const currencyPillCoins =
  'border-[oklch(0.74_0.17_85_/_0.4)] text-[var(--gold)] shadow-[0_0_12px_var(--gold-glow)]';
const currencyPillXp = 'border-[oklch(0.76_0.16_205_/_0.4)] text-[var(--cyan)]';

const hero = 'px-8 pt-8 max-w-[1400px] mx-auto';
const heroTitleRow = 'flex items-end gap-4 mb-6';
const heroTitle =
  'font-[var(--font-title)] text-[44px] font-black tracking-[0.08em] leading-none bg-[linear-gradient(135deg,var(--gold)_0%,oklch(0.85_0.15_60)_30%,var(--violet)_70%,oklch(0.78_0.18_320)_100%)] bg-clip-text text-transparent [text-shadow:0_0_60px_var(--gold-glow)]';
const heroSub =
  'text-[12px] text-[var(--text-mid)] tracking-[0.2em] font-[var(--font-title)] uppercase pb-1.5';

const battlePass =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-8 relative overflow-hidden before:content-[\"\"] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,var(--gold-glow),transparent_60%)] before:opacity-30 before:pointer-events-none';
const bpHeader = 'flex items-center gap-3 mb-4 relative';
const bpTitle =
  'font-[var(--font-title)] text-[16px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase';
const bpProgress = 'text-[11px] text-[var(--text-mid)] font-[var(--font-title)] tracking-[0.1em]';
const bpProgressStrong = 'text-[var(--text-hi)] text-[14px]';
const bpTrack = 'flex gap-1 overflow-x-auto py-1 pb-2 relative [&::-webkit-scrollbar]:h-1';
const bpProgressTrack =
  'mt-3 h-1.5 bg-[var(--panel3)] border border-[var(--border)] rounded-[3px] overflow-hidden relative';
const bpProgressFill =
  'h-full bg-[linear-gradient(90deg,var(--gold-dim),var(--gold),var(--violet))] shadow-[0_0_12px_var(--gold-glow)]';

const marketWrap = 'px-8 pb-[60px] max-w-[1400px] mx-auto';
const catTabs = 'flex gap-1.5 mb-5 flex-wrap';
const catTab =
  'font-[var(--font-title)] text-[11px] tracking-[0.15em] font-bold text-[var(--text-mid)] bg-[var(--panel)] border border-[var(--border)] rounded-lg px-[18px] py-[9px] cursor-pointer transition-all duration-200 uppercase flex items-center gap-1.5 hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.4)]';
const catTabActive =
  'text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] border-[var(--gold)] shadow-[0_0_16px_var(--gold-glow)]';
const catTabCount =
  'text-[9px] bg-[var(--panel3)] rounded-lg px-1.5 py-[1px] text-[var(--text-mid)]';
const catTabCountActive = 'bg-[var(--gold)] text-[#0a0400]';

const rewardsGrid = 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4';

const successToast =
  'fixed top-6 left-1/2 -translate-x-1/2 bg-[linear-gradient(135deg,oklch(0.4_0.18_145),oklch(0.55_0.2_145))] border border-[oklch(0.7_0.18_145)] px-7 py-3.5 rounded-[30px] font-[var(--font-title)] font-bold tracking-[0.15em] text-white z-[1000] flex items-center gap-2.5 shadow-[0_0_40px_oklch(0.6_0.18_145_/_0.5)] animate-[marketplace-toast-in_0.4s_cubic-bezier(0.34,1.56,0.64,1),marketplace-toast-out_0.4s_ease_2.5s_forwards]';
const redeemFlash =
  'fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,currentColor,transparent_50%)] opacity-0 z-[999] animate-[marketplace-redeem-flash_0.8s_ease]';
