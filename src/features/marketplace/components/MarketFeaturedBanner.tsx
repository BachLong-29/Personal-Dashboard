'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';

import type { MarketFeaturedReward, MarketReward } from '../types';

interface MarketFeaturedBannerProps {
  featured: MarketFeaturedReward;
  onClaim: (reward: MarketReward) => void;
}

export function MarketFeaturedBanner({ featured, onClaim }: MarketFeaturedBannerProps) {
  const tMarket = useTranslations('marketplace');
  const reward: MarketReward = {
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
