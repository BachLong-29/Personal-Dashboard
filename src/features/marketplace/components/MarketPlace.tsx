'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

import { REWARD_DATA } from '../data/mock';

type RewardCategory = 'real' | 'cosmetic' | 'game' | 'booster' | 'quest';
type RewardCategoryKey = 'all' | RewardCategory;
type RewardCurrency = 'coins' | 'gems' | 'achievement';
type RewardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface PlayerState {
  name: string;
  level: number;
  rank: string;
  xp: number;
  xpNext: number;
  coins: number;
  gems: number;
  achievement: number;
  streak: number;
  passLevel: number;
  passMaxLevel: number;
}

interface Reward {
  id: string;
  cat: RewardCategory;
  title: string;
  icon: string;
  rarity: RewardRarity;
  price: number;
  currency: RewardCurrency;
  reqLevel: number;
  locked: boolean;
  desc: string;
  stock: number | null;
  lockReason?: string;
}

interface FeaturedReward {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  price: number;
  currency: RewardCurrency;
  requireLevel: number;
  rarity: RewardRarity;
  lore: string;
  icon: string;
  expiresIn: string;
  discount?: number;
  originalPrice?: number;
}

interface BattlePassNodeData {
  lv: number;
  reward: string;
  rarity: RewardRarity;
  icon: string;
  claimed: boolean;
  current?: boolean;
}

interface RewardDetailCondition {
  label: string;
  met: boolean;
  val: string;
}

function formatPrice(reward: Reward): string {
  if (reward.currency === 'achievement' || reward.price === 0) return 'ACHIEVEMENT';
  return reward.price.toLocaleString();
}

function RewardCard({
  reward,
  player,
  onClick,
}: {
  reward: Reward;
  player: PlayerState;
  onClick: (reward: Reward) => void;
}) {
  const tMarket = useTranslations('marketplace');
  const hasStock = reward.stock == null || reward.stock > 0;
  const hasCurrency =
    reward.currency === 'achievement' ? true : player[reward.currency] >= reward.price;
  const canRedeem = hasCurrency && player.level >= reward.reqLevel && hasStock;

  return (
    <div
      className={cn(
        rewardCard,
        rewardCardByRarity[reward.rarity],
        reward.locked && rewardCardLocked,
        reward.rarity === 'mythic' && rewardCardMythic,
      )}
      style={{ color: RARITY_COLOR[reward.rarity] }}
      onClick={() => onClick(reward)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(reward);
      }}
      role="button"
      tabIndex={0}
    >
      <div className={cn(rewardArt, reward.rarity === 'legendary' && rewardArtLegendary)}>
        <div className={rewardArtGlow} />
        <div className={rewardArtRays} />
        <span className={rewardRarityTag}>{RARITY_LABEL[reward.rarity]}</span>
        {reward.stock != null && reward.stock <= 5 && !reward.locked && (
          <span className={rewardStock}>⚠ {reward.stock} LEFT</span>
        )}
        <span className={cn(rewardIcon, reward.locked && rewardIconLocked)}>{reward.icon}</span>

        {reward.locked && (
          <div className={rewardSeal}>
            <div className={sealEmblem}>
              <span className={sealEmblemIcon}>🔒</span>
            </div>
            <div className={sealText}>◆ Sealed ◆</div>
            <div className={sealCond}>{reward.lockReason}</div>
          </div>
        )}
      </div>

      <div className={cn(rewardInfo, reward.locked && rewardInfoLocked)}>
        <div className={rewardTitle}>{reward.title}</div>
        <div className={rewardDesc}>{reward.desc}</div>
        <div className={rewardBottom}>
          <div className={cn(rewardPrice, rewardPriceByCurrency[reward.currency])}>
            <span>{CURRENCY_ICON[reward.currency]}</span>
            <span>{formatPrice(reward)}</span>
          </div>
          {!reward.locked && (
            <Button
              type="button"
              variant="ghost"
              className={cn(rewardRedeem, !canRedeem && rewardRedeemCant)}
              onClick={(e) => {
                e.stopPropagation();
                onClick(reward);
              }}
            >
              {canRedeem ? tMarket('buttons.redeem') : tMarket('buttons.view')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function RewardDetailModal({
  reward,
  player,
  onClose,
  onRedeem,
}: {
  reward: Reward;
  player: PlayerState;
  onClose: () => void;
  onRedeem: (reward: Reward) => void;
}) {
  const tMarket = useTranslations('marketplace');
  const hasCurrency =
    reward.currency === 'achievement' ? true : player[reward.currency] >= reward.price;
  const hasLevel = player.level >= reward.reqLevel;
  const hasStock = reward.stock == null || reward.stock > 0;
  const canRedeem = !reward.locked && hasCurrency && hasLevel && hasStock;

  const conditions: RewardDetailCondition[] = [
    {
      label: `Reach Level ${reward.reqLevel}`,
      met: hasLevel,
      val: `Lv.${player.level} / ${reward.reqLevel}`,
    },
  ];

  if (reward.currency !== 'achievement' && reward.price > 0) {
    conditions.push({
      label: `${reward.price.toLocaleString()} ${CURRENCY_ICON[reward.currency]} ${reward.currency}`,
      met: hasCurrency,
      val: `${player[reward.currency].toLocaleString()} owned`,
    });
  }

  if (reward.locked && reward.lockReason) {
    conditions.push({ label: reward.lockReason, met: false, val: 'Sealed' });
  }

  if (reward.stock != null) {
    conditions.push({
      label: 'Stock available',
      met: reward.stock > 0,
      val: `${reward.stock} remaining`,
    });
  }

  const lore = reward.locked
    ? 'The seal is unbroken. Whispers from the realm say its power awakens only for the dedicated.'
    : `Forged in the ${reward.rarity === 'mythic' ? 'Eclipse Forge' : reward.rarity === 'legendary' ? 'Sun Temple' : 'Aetheric Vault'}. Carries the resonance of countless completed quests.`;

  return (
    <div className={detailBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={detailModal} style={{ color: RARITY_COLOR[reward.rarity] }}>
        <Button
          type="button"
          variant="ghost"
          className={detailClose}
          aria-label={tMarket('buttons.close')}
          title={tMarket('buttons.close')}
          onClick={onClose}
        >
          ✕
        </Button>

        <div className={detailArt}>
          <div className={detailArtRune} />
          <div className={cn(detailArtRune, detailArtRune2)} />
          <span className={detailRarityBanner}>◆ {RARITY_LABEL[reward.rarity]} ◆</span>
          <span className={detailArtIcon}>{reward.icon}</span>
        </div>

        <div className={detailBody}>
          <div className={detailCat}>
            {CATEGORIES.find((c) => c.key === reward.cat)?.label || reward.cat}
          </div>
          <div className={detailTitle}>{reward.title}</div>
          <div className={detailDesc}>{reward.desc}</div>
          <div className={detailLore}>&quot;{lore}&quot;</div>

          <div className={detailConditions}>
            {conditions.map((c, i) => (
              <div
                key={i}
                className={cn(detailCondRow, c.met ? detailCondRowMet : detailCondRowUnmet)}
              >
                <span
                  className={cn(detailCondIcon, c.met ? detailCondIconMet : detailCondIconUnmet)}
                >
                  {c.met ? '✓' : '!'}
                </span>
                <span className={detailCondLabel}>{c.label}</span>
                <span className={detailCondVal}>{c.val}</span>
              </div>
            ))}
          </div>

          <div className={detailActions}>
            <Button
              type="button"
              variant="ghost"
              className={cn(detailBtn, detailBtnSecondary)}
              onClick={onClose}
            >
              {tMarket('buttons.cancel')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(detailBtn, detailBtnPrimary)}
              disabled={!canRedeem}
              onClick={() => onRedeem(reward)}
            >
              {reward.locked
                ? `🔒 ${tMarket('buttons.sealed')}`
                : !hasLevel
                  ? tMarket('buttons.needHigherLevel')
                  : !hasCurrency
                    ? tMarket('buttons.insufficientFunds')
                    : !hasStock
                      ? tMarket('buttons.outOfStock')
                      : `✦ ${tMarket('buttons.redeemNow')} ✦`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BattlePassNode({ node }: { node: BattlePassNodeData }) {
  return (
    <div
      className={cn(bpNode, node.claimed && bpNodeClaimed, node.current && bpNodeCurrent)}
      style={{ color: RARITY_COLOR[node.rarity] }}
      role="button"
      tabIndex={0}
    >
      <div className={cn(bpNodeLv, node.current && bpNodeLvCurrent)}>LV {node.lv}</div>
      <div className={bpNodeIcon}>{node.icon}</div>
      <div className={bpNodeName}>{node.reward}</div>
    </div>
  );
}

function FeaturedBanner({
  featured,
  onClaim,
}: {
  featured: FeaturedReward;
  onClaim: (reward: Reward) => void;
}) {
  const tMarket = useTranslations('marketplace');
  const reward: Reward = {
    id: featured.id,
    cat: 'real',
    title: featured.title,
    icon: featured.icon,
    rarity: featured.rarity,
    price: featured.price,
    currency: featured.currency,
    reqLevel: featured.requireLevel,
    locked: false,
    desc: featured.desc,
    stock: null,
    lockReason: undefined,
  };

  return (
    <div className={featuredWrap}>
      <div className={featuredContent}>
        <div className={featuredTag}>
          <span className={featuredTagDiamond}>◆</span>
          <span className={featuredTagText}>{featured.subtitle}</span>
        </div>
        <div className={featuredTitle}>{featured.title}</div>
        <div className={featuredDesc}>{featured.desc}</div>
        <div className={featuredLore}>{featured.lore}</div>
        <div className={featuredMeta}>
          <div className={featuredPrice}>
            <span className={featuredPriceCurrent}>🪙 {featured.price.toLocaleString()}</span>
            {featured.originalPrice != null && (
              <span className={featuredPriceOriginal}>
                🪙 {featured.originalPrice.toLocaleString()}
              </span>
            )}
            {featured.discount != null && (
              <span className={featuredDiscount}>−{featured.discount}%</span>
            )}
          </div>
          <div className={featuredCountdown}>ENDS IN {featured.expiresIn}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className={featuredBtn}
          onClick={() => onClaim(reward)}
        >
          ✦ {tMarket('buttons.claimMythicReward')} ✦
        </Button>
      </div>

      <div className={featuredArtWrap}>
        <span className={featuredRarityBadge}>◆ Mythic ◆</span>
        <div className={featuredArt}>
          <span
            className={featuredArtIcon}
            style={{ filter: 'drop-shadow(0 8px 24px oklch(0.65 0.22 320))' }}
          >
            {featured.icon}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MarketPlace() {
  const tMarket = useTranslations('marketplace');
  const [activeCat, setActiveCat] = useState<RewardCategoryKey>('all');
  const [selected, setSelected] = useState<Reward | null>(null);
  const [player, setPlayer] = useState<PlayerState>(() => ({
    ...(REWARD_DATA.player as Omit<PlayerState, 'achievement'>),
    achievement: 0,
  }));
  const [rewards, setRewards] = useState<Reward[]>(() => REWARD_DATA.rewards as Reward[]);
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

  const handleRedeem = (reward: Reward) => {
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
          <span className={currencyPillIcon}>🪙</span>
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

        <FeaturedBanner
          featured={REWARD_DATA.featured as FeaturedReward}
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
            {(REWARD_DATA.battlePass as BattlePassNodeData[]).map((node) => (
              <BattlePassNode key={node.lv} node={node} />
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
          {CATEGORIES.map((cat) => (
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
            <RewardCard key={r.id} reward={r} player={player} onClick={setSelected} />
          ))}
        </div>
      </div>

      {selected && (
        <RewardDetailModal
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

const CATEGORIES: { key: RewardCategoryKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All Rewards', icon: '✦' },
  { key: 'real', label: 'Real-World', icon: '📦' },
  { key: 'cosmetic', label: 'Cosmetics', icon: '🎨' },
  { key: 'game', label: 'Artifacts', icon: '⚔️' },
  { key: 'booster', label: 'Boosters', icon: '⚡' },
  { key: 'quest', label: 'New Modes', icon: '🗺️' },
];

const RARITY_LABEL: Record<RewardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

const CURRENCY_ICON: Record<RewardCurrency, string> = {
  coins: '🪙',
  gems: '💠',
  achievement: '🏆',
};

const RARITY_COLOR: Record<RewardRarity, string> = {
  common: '#6b7280',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
  mythic: '#f472b6',
};

const topbar =
  'flex items-center gap-3 px-6 py-3 bg-[linear-gradient(180deg,var(--panel),oklch(0.06_0.02_260_/_0.95))] border-b border-[var(--border)] backdrop-blur-[10px] sticky top-0 z-50';
const topbarBack =
  'flex items-center gap-1.5 text-[11px] text-[var(--text-mid)] no-underline px-3 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--panel2)] font-[var(--font-title)] tracking-[0.1em] transition-all duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]';
const topbarLogo =
  'h-9 w-9 object-contain drop-shadow-[0_0_12px_var(--violet-glow)]';
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

const featuredWrap =
  'relative grid grid-cols-[1fr_320px] gap-6 bg-[radial-gradient(circle_at_80%_50%,oklch(0.55_0.22_320_/_0.3),transparent_60%),radial-gradient(circle_at_20%_50%,oklch(0.55_0.22_280_/_0.25),transparent_60%),linear-gradient(135deg,oklch(0.18_0.15_295)_0%,oklch(0.12_0.08_280)_100%)] border border-transparent [border-image:linear-gradient(135deg,var(--gold),var(--violet),var(--rose),var(--gold))_1] rounded-[14px] px-8 py-7 overflow-hidden mb-8 before:content-[\"\"] before:absolute before:inset-0 before:pointer-events-none before:bg-[repeating-linear-gradient(45deg,transparent_0,transparent_60px,oklch(1_0_0_/_0.015)_60px,oklch(1_0_0_/_0.015)_62px)] after:content-[\"\"] after:absolute after:top-[-50%] after:right-[-20%] after:w-[60%] after:h-[200%] after:bg-[radial-gradient(ellipse,oklch(0.85_0.15_320_/_0.15),transparent_60%)] after:blur-[40px] after:animate-[marketplace-aurora-drift_8s_ease-in-out_infinite] after:pointer-events-none';
const featuredContent = 'relative z-[2]';
const featuredTag =
  'inline-flex items-center gap-1.5 font-[var(--font-title)] text-[10px] tracking-[0.3em] font-bold mb-2';
const featuredTagDiamond = 'text-[oklch(0.7_0.2_320)]';
const featuredTagText =
  'bg-[linear-gradient(90deg,oklch(0.65_0.22_320),oklch(0.7_0.2_280))] bg-clip-text text-transparent';
const featuredTitle =
  'font-[var(--font-title)] text-[32px] font-bold tracking-[0.04em] mb-2 [text-shadow:0_0_40px_oklch(0.65_0.22_320_/_0.4)]';
const featuredDesc = 'text-[13px] text-[var(--text-mid)] leading-[1.6] mb-3';
const featuredLore = 'text-[11px] italic text-[oklch(0.85_0.1_60)] leading-[1.5] mb-4';
const featuredMeta = 'flex items-center justify-between gap-4 mb-4';
const featuredPrice = 'flex items-center gap-2';
const featuredPriceCurrent =
  'font-[var(--font-title)] font-bold text-[var(--gold)] tracking-[0.05em]';
const featuredPriceOriginal =
  'font-[var(--font-title)] font-bold text-[var(--text-lo)] line-through tracking-[0.05em]';
const featuredDiscount =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.12em] text-white bg-[oklch(0.72_0.18_5_/_0.25)] border border-[oklch(0.72_0.18_5_/_0.45)] px-2 py-1 rounded-md';
const featuredCountdown =
  'font-[var(--font-title)] text-[10px] tracking-[0.15em] text-[var(--text-mid)]';
const featuredBtn =
  'font-[var(--font-title)] text-[11px] tracking-[0.18em] font-bold uppercase bg-[linear-gradient(135deg,var(--gold),var(--violet))] text-[#0a0400] px-5 py-3 rounded-[10px] shadow-[0_0_24px_var(--gold-glow)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_var(--gold-glow)]';

const featuredArtWrap = 'relative z-[2] flex items-center justify-center';
const featuredRarityBadge =
  'absolute top-4 right-4 font-[var(--font-title)] text-[11px] font-bold tracking-[0.2em] px-3 py-1 bg-[linear-gradient(90deg,oklch(0.65_0.22_320),oklch(0.7_0.2_280))] text-white rounded-[4px] uppercase shadow-[0_0_16px_oklch(0.65_0.22_320_/_0.5)]';
const featuredArt =
  'relative w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.75_0.22_320_/_0.35),transparent_60%)] flex items-center justify-center animate-[marketplace-featured-float_4s_ease-in-out_infinite] shadow-[0_0_60px_oklch(0.7_0.2_320_/_0.35),inset_0_0_40px_oklch(0.7_0.2_320_/_0.2)] before:content-[\"\"] before:absolute before:inset-[-20px] before:rounded-full before:border before:border-dashed before:border-[oklch(0.7_0.2_320_/_0.4)] before:animate-[spin_20s_linear_infinite] after:content-[\"\"] after:absolute after:inset-[-40px] after:rounded-full after:border after:border-dashed after:border-[oklch(0.7_0.2_320_/_0.2)] after:animate-[marketplace-spin-rev_30s_linear_infinite]';
const featuredArtIcon = 'text-[96px]';

const battlePass =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-8 relative overflow-hidden before:content-[\"\"] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_50%_0%,var(--gold-glow),transparent_60%)] before:opacity-30 before:pointer-events-none';
const bpHeader = 'flex items-center gap-3 mb-4 relative';
const bpTitle =
  'font-[var(--font-title)] text-[16px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase';
const bpProgress = 'text-[11px] text-[var(--text-mid)] font-[var(--font-title)] tracking-[0.1em]';
const bpProgressStrong = 'text-[var(--text-hi)] text-[14px]';
const bpTrack = 'flex gap-1 overflow-x-auto py-1 pb-2 relative [&::-webkit-scrollbar]:h-1';
const bpNode =
  'shrink-0 w-[110px] bg-[var(--panel2)] border-[1.5px] border-[var(--border)] rounded-[10px] px-2 py-3 text-center cursor-pointer transition-all duration-200 relative hover:-translate-y-[3px] hover:border-[var(--gold)]';
const bpNodeClaimed =
  'bg-[linear-gradient(180deg,oklch(0.4_0.15_145_/_0.15),var(--panel2))] border-[oklch(0.6_0.18_145_/_0.4)] after:content-[\"✓\"] after:absolute after:top-[6px] after:right-[6px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-[oklch(0.6_0.18_145)] after:text-white after:text-[10px] after:flex after:items-center after:justify-center after:font-bold';
const bpNodeCurrent =
  'bg-[linear-gradient(180deg,oklch(0.5_0.18_85_/_0.2),var(--panel2))] border-[var(--gold)] shadow-[0_0_24px_var(--gold-glow)] -translate-y-1 scale-[1.05] z-[2] before:content-[\"YOU\"] before:absolute before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:font-[var(--font-title)] before:text-[9px] before:tracking-[0.15em] before:bg-[var(--gold)] before:text-[#0a0400] before:px-2 before:py-0.5 before:rounded-[4px] before:font-bold';
const bpNodeLv =
  'font-[var(--font-title)] text-[10px] tracking-[0.15em] text-[var(--text-mid)] mb-1.5';
const bpNodeLvCurrent = 'text-[var(--gold)]';
const bpNodeIcon =
  'w-[50px] h-[50px] mx-auto mb-1.5 rounded-[12px] flex items-center justify-center text-[26px] bg-[var(--panel3)] border border-[currentColor]';
const bpNodeName =
  'text-[10px] font-semibold text-[var(--text-hi)] whitespace-nowrap overflow-hidden text-ellipsis';
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

const rewardCard =
  "group relative bg-[linear-gradient(180deg,var(--panel2),var(--panel))] border-[1.5px] border-[var(--border)] rounded-[12px] overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col min-h-[280px] hover:-translate-y-1.5 before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_30px,oklch(1_0_0_/_0.015)_30px,oklch(1_0_0_/_0.015)_31px),repeating-linear-gradient(90deg,transparent,transparent_30px,oklch(1_0_0_/_0.015)_30px,oklch(1_0_0_/_0.015)_31px)]";
const rewardCardLocked =
  'before:[background-image:repeating-linear-gradient(45deg,transparent_0,transparent_14px,oklch(0_0_0_/_0.3)_14px,oklch(0_0_0_/_0.3)_16px)]';
const rewardCardMythic =
  "after:content-[''] after:absolute after:inset-[-1.5px] after:rounded-[inherit] after:p-[1.5px] after:bg-[linear-gradient(135deg,oklch(0.78_0.22_340)_0%,oklch(0.78_0.18_80)_20%,oklch(0.78_0.18_240)_40%,oklch(0.78_0.22_295)_60%,oklch(0.78_0.22_340)_80%,oklch(0.78_0.22_340)_100%)] after:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] after:[-webkit-mask-composite:xor] after:[mask-composite:exclude] after:[background-size:300%_300%] after:animate-[marketplace-holo-shift_4s_linear_infinite] after:pointer-events-none after:z-[1]";

const rewardCardByRarity: Record<RewardRarity, string> = {
  common: '',
  uncommon:
    'border-[oklch(0.7_0.18_145_/_0.4)] hover:border-[oklch(0.7_0.18_145)] hover:shadow-[0_12px_40px_oklch(0.7_0.18_145_/_0.25)]',
  rare: 'border-[oklch(0.7_0.18_240_/_0.45)] hover:border-[oklch(0.7_0.18_240)] hover:shadow-[0_12px_40px_oklch(0.7_0.18_240_/_0.3)]',
  epic: 'border-[oklch(0.7_0.22_295_/_0.45)] hover:border-[oklch(0.7_0.22_295)] hover:shadow-[0_12px_40px_oklch(0.7_0.22_295_/_0.35)]',
  legendary:
    'border-[oklch(0.78_0.18_80_/_0.55)] shadow-[0_0_20px_oklch(0.78_0.18_80_/_0.12)] hover:border-[oklch(0.85_0.18_80)] hover:shadow-[0_12px_50px_oklch(0.78_0.18_80_/_0.5)]',
  mythic:
    'border-[oklch(0.78_0.22_340_/_0.55)] shadow-[0_0_24px_oklch(0.78_0.22_340_/_0.18)] hover:border-[oklch(0.85_0.22_340)] hover:shadow-[0_16px_60px_oklch(0.78_0.22_340_/_0.5)]',
};

const rewardArt =
  'relative h-[130px] flex items-center justify-center text-[56px] bg-[linear-gradient(180deg,var(--panel3),var(--panel))] overflow-hidden';
const rewardArtLegendary =
  "after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-1/2 after:h-full after:bg-[linear-gradient(90deg,transparent,oklch(0.85_0.18_80_/_0.3),transparent)] after:animate-[marketplace-legend-sweep_4s_linear_infinite]";
const rewardArtGlow =
  'absolute w-[140%] h-[140%] rounded-full bg-[radial-gradient(circle,currentColor_0%,transparent_60%)] opacity-15 blur-[20px] transition-opacity duration-300 group-hover:opacity-40';
const rewardArtRays =
  'absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,currentColor_5deg,transparent_10deg,transparent_60deg,currentColor_65deg,transparent_70deg,transparent_120deg,currentColor_125deg,transparent_130deg,transparent_180deg,currentColor_185deg,transparent_190deg,transparent_240deg,currentColor_245deg,transparent_250deg,transparent_300deg,currentColor_305deg,transparent_310deg,transparent_360deg)] opacity-0 transition-opacity duration-300 animate-[spin_12s_linear_infinite] blur-[8px] group-hover:opacity-25';
const rewardIcon =
  'relative z-[2] [filter:drop-shadow(0_4px_12px_currentColor)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-[-5deg]';
const rewardIconLocked =
  '[filter:grayscale(0.7)_brightness(0.5)_drop-shadow(0_0_8px_currentColor)]';
const rewardRarityTag =
  'absolute top-[10px] left-[10px] font-[var(--font-title)] text-[9px] font-bold tracking-[0.18em] px-2 py-[3px] rounded-[4px] uppercase bg-black/70 border border-[currentColor] z-[3]';
const rewardStock =
  'absolute top-[10px] right-[10px] font-[var(--font-title)] text-[9px] tracking-[0.1em] text-[oklch(0.85_0.15_22)] bg-[oklch(0.62_0.24_22_/_0.15)] border border-[oklch(0.62_0.24_22_/_0.4)] px-2 py-[3px] rounded-[4px] z-[3]';

const rewardInfo = 'px-[14px] pt-3 pb-[14px] flex flex-col gap-1.5 flex-1';
const rewardInfoLocked = '[&>*]:opacity-60';
const rewardTitle =
  'font-[var(--font-title)] text-[13px] font-semibold tracking-[0.04em] text-[var(--text-hi)]';
const rewardDesc =
  'text-[11px] text-[var(--text-mid)] leading-[1.45] flex-1 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]';
const rewardBottom =
  'flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-[var(--border)]';
const rewardPrice = 'flex items-center gap-1.5 font-[var(--font-title)] text-[14px] font-bold';
const rewardPriceByCurrency: Record<RewardCurrency, string> = {
  coins: 'text-[var(--gold)]',
  gems: 'text-[var(--violet)]',
  achievement: 'text-[var(--cyan)] text-[10px] tracking-[0.15em]',
};
const rewardRedeem =
  'font-[var(--font-title)] text-[10px] tracking-[0.12em] font-bold bg-[linear-gradient(135deg,oklch(0.55_0.12_85),var(--gold))] text-[#0a0400] px-3 py-1.5 rounded-md cursor-pointer uppercase transition-all duration-200 shadow-[0_0_12px_var(--gold-glow)] hover:scale-105 hover:shadow-[0_0_20px_var(--gold-glow)]';
const rewardRedeemCant =
  'bg-[var(--panel3)] text-[var(--text-lo)] shadow-none cursor-not-allowed hover:scale-100 hover:shadow-none';

const rewardSeal =
  'absolute inset-0 z-[4] flex flex-col items-center justify-center bg-[oklch(0.05_0.02_260_/_0.65)] backdrop-blur-[2px] pointer-events-none transition-all duration-300 group-hover:bg-[oklch(0.05_0.02_260_/_0.45)]';
const sealEmblem =
  'w-16 h-16 rounded-full bg-[radial-gradient(circle,oklch(0.2_0.05_50),oklch(0.08_0.02_50))] border-2 border-[var(--gold-dim)] flex items-center justify-center text-[28px] relative mb-3 shadow-[0_0_20px_oklch(0.5_0.12_85_/_0.3),inset_0_0_10px_oklch(0_0_0_/_0.5)] before:content-[\"\"] before:absolute before:inset-[-8px] before:rounded-full before:border before:border-[var(--gold-dim)] before:opacity-40 after:content-[\"\"] after:absolute after:inset-[-16px] after:rounded-full after:border after:border-[var(--gold-dim)] after:opacity-20';
const sealEmblemIcon = '[filter:drop-shadow(0_0_8px_oklch(0.7_0.15_85_/_0.6))] text-[26px]';
const sealText =
  'font-[var(--font-title)] text-[9px] font-bold tracking-[0.3em] text-[var(--gold)] uppercase mb-1';
const sealCond = 'text-[11px] text-[var(--text-hi)] text-center px-4 font-medium leading-[1.4]';

const detailBackdrop =
  'fixed inset-0 bg-[oklch(0.03_0.02_260_/_0.85)] backdrop-blur-[8px] z-[200] flex items-center justify-center p-6 animate-[fade-in_0.25s_ease]';
const detailModal =
  'bg-[linear-gradient(180deg,var(--panel),oklch(0.04_0.02_270))] border-[1.5px] border-[currentColor] rounded-[16px] w-[540px] max-w-full max-h-[92vh] overflow-y-auto relative animate-[marketplace-detail-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_60px_currentColor,0_24px_80px_oklch(0_0_0_/_0.6)]';
const detailClose =
  'absolute top-[14px] right-[14px] w-8 h-8 bg-black/50 border border-[var(--border)] rounded-full text-[var(--text-mid)] cursor-pointer text-[16px] z-[5] flex items-center justify-center transition-all duration-200 hover:text-[var(--text-hi)] hover:border-[var(--text-hi)]';

const detailArt =
  'relative h-[220px] flex items-center justify-center bg-[radial-gradient(circle_at_center,currentColor,transparent_55%),linear-gradient(180deg,var(--panel3),var(--panel))] overflow-hidden border-b border-[currentColor]';
const detailArtIcon =
  'text-[110px] relative z-[2] [filter:drop-shadow(0_8px_24px_currentColor)] animate-[marketplace-featured-float_3.5s_ease-in-out_infinite]';
const detailArtRune =
  'absolute w-[240px] h-[240px] border border-dashed border-[currentColor] rounded-full opacity-30 animate-[spin_16s_linear_infinite]';
const detailArtRune2 =
  'w-[300px] h-[300px] opacity-[0.18] animate-[marketplace-spin-rev_24s_linear_infinite]';
const detailRarityBanner =
  'absolute top-[14px] left-[14px] font-[var(--font-title)] text-[10px] tracking-[0.3em] font-bold px-3 py-1 bg-black/75 border border-[currentColor] rounded-[4px] uppercase';

const detailBody = 'px-[26px] pt-5 pb-[22px]';
const detailCat =
  'font-[var(--font-title)] text-[10px] tracking-[0.25em] text-[var(--text-mid)] uppercase mb-1';
const detailTitle =
  'font-[var(--font-title)] text-[26px] font-bold tracking-[0.04em] text-[var(--text-hi)] mb-2.5';
const detailDesc = 'text-[13px] text-[var(--text-mid)] leading-[1.6] mb-3.5';
const detailLore =
  'text-[11px] italic text-[oklch(0.75_0.08_60)] leading-[1.5] px-[14px] py-3 bg-black/30 border-l-2 border-[currentColor] rounded-r-[4px] mb-[18px]';

const detailConditions = 'flex flex-col gap-2 mb-[18px]';
const detailCondRow =
  'flex items-center gap-2.5 px-3 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-lg';
const detailCondRowMet = 'border-[oklch(0.6_0.18_145_/_0.4)]';
const detailCondRowUnmet = 'border-[oklch(0.62_0.24_22_/_0.4)]';
const detailCondIcon =
  'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0';
const detailCondIconMet = 'bg-[oklch(0.6_0.18_145)] text-white';
const detailCondIconUnmet = 'bg-[oklch(0.62_0.24_22)] text-white';
const detailCondLabel = 'flex-1 text-[12px] text-[var(--text-hi)]';
const detailCondVal =
  'font-[var(--font-title)] text-[11px] font-bold tracking-[0.05em] text-[var(--text-mid)]';

const detailActions = 'flex gap-2.5';
const detailBtn =
  'flex-1 font-[var(--font-title)] text-[12px] tracking-[0.15em] font-bold p-[14px] rounded-lg border cursor-pointer uppercase transition-all duration-200';
const detailBtnPrimary =
  'bg-[linear-gradient(135deg,oklch(0.55_0.12_85),var(--gold))] border-[var(--gold)] text-[#0a0400] shadow-[0_0_20px_var(--gold-glow)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_var(--gold-glow)] disabled:bg-[var(--panel3)] disabled:border-[var(--border)] disabled:text-[var(--text-lo)] disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0';
const detailBtnSecondary =
  'bg-[var(--panel2)] border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[var(--text-hi)]';

const successToast =
  'fixed top-6 left-1/2 -translate-x-1/2 bg-[linear-gradient(135deg,oklch(0.4_0.18_145),oklch(0.55_0.2_145))] border border-[oklch(0.7_0.18_145)] px-7 py-3.5 rounded-[30px] font-[var(--font-title)] font-bold tracking-[0.15em] text-white z-[1000] flex items-center gap-2.5 shadow-[0_0_40px_oklch(0.6_0.18_145_/_0.5)] animate-[marketplace-toast-in_0.4s_cubic-bezier(0.34,1.56,0.64,1),marketplace-toast-out_0.4s_ease_2.5s_forwards]';
const redeemFlash =
  'fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,currentColor,transparent_50%)] opacity-0 z-[999] animate-[marketplace-redeem-flash_0.8s_ease]';
