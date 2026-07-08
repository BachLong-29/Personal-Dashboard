import type { CSSProperties, ReactNode } from 'react';

import mainBackground from '@/assets/images/main_background.png';
import { cn } from '@/libs/utils';

interface GoldPanelProps {
  children: ReactNode;
  /** Extra classes merged onto the panel wrapper. */
  className?: string;
  /** Render the main-background art + dimming scrim. Default: true. */
  background?: boolean;
  /** Render the four gold corner accents. Default: true. */
  corners?: boolean;
  /** Extra inline styles (merged after the panel's own background/border). */
  style?: CSSProperties;
}

const BACKGROUND_STYLE: CSSProperties = {
  // Scrim (top layer) dims the art without dimming the content.
  backgroundImage: `linear-gradient(rgba(8,6,16,0.55), rgba(8,6,16,0.55)), url(${mainBackground.src})`,
  backgroundSize: 'cover, auto 250%',
  backgroundPosition: 'center, center',
  backgroundRepeat: 'no-repeat, no-repeat',
};

/**
 * Framed panel with the gold border, textured background art, dimming scrim,
 * and corner accents used across the dashboard. Wrap any content in it.
 */
export function GoldPanel({
  children,
  className,
  background = true,
  corners = true,
  style,
}: GoldPanelProps) {
  return (
    <div
      className={cn(panelBase, panelGold, className)}
      style={{
        ...(background ? BACKGROUND_STYLE : {}),
        border: '1.5px solid var(--gold-border)',
        ...style,
      }}
    >
      {corners && (
        <>
          <div className={cornerTL} />
          <div className={cornerTR} />
          <div className={cornerBL} />
          <div className={cornerBR} />
        </>
      )}
      {children}
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";

const panelGold =
  'shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.18),inset_0_0_20px_oklch(0.74_0.17_85_/_0.05)]';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)] z-[1]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]');
