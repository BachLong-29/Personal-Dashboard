import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

interface PenaltyFailureModalProps {
  tier: number;
  onContinue: () => void;
}

function FailureGlitchTitle({ text }: { text: string }) {
  return (
    <div className={failureGlitchWrap} aria-label={text}>
      <span>{text}</span>
      <span className={cn(failureGlitchLayer, failureGlitchLayerTop)} aria-hidden="true">
        {text}
      </span>
      <span className={cn(failureGlitchLayer, failureGlitchLayerBottom)} aria-hidden="true">
        {text}
      </span>
    </div>
  );
}

export function PenaltyFailureModal({ tier, onContinue }: PenaltyFailureModalProps) {
  const t = useTranslations('dashboard');

  return (
    <div className={penaltyBackdrop}>
      <div className={penaltyBgFlashDanger} />
      <div className={penaltyFailureModal}>
        <FailureGlitchTitle text="PENALTY FAILED" />
        <div className={penaltyFailureSub}>
          {tier < 4 ? `// ESCALATING TO TIER ${tier + 1} //` : '// MAXIMUM PENALTY ACTIVE //'}
        </div>
        <div className={penaltyFailureIcon}>☠</div>
        <div className={penaltyFailureMsg}>
          You failed to complete the corrective task within the allotted time. The System will now
          apply consequences and issue a more severe penalty.
        </div>
        <Button
          type="button"
          variant="ghost"
          className={cn(penaltyBtnBase, penaltyBtnPrimary)}
          onClick={onContinue}
        >
          {t('penalty.buttons.acceptConsequences')}
        </Button>
      </div>
    </div>
  );
}

const penaltyBackdrop =
  'fixed inset-0 bg-[oklch(0.05_0.04_22_/_0.92)] backdrop-blur-[6px] z-[2000] flex items-center justify-center p-5 animate-[penalty-fade-in_0.3s_ease] overflow-y-auto';
const penaltyBgFlashDanger =
  'absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--danger-glow)_0%,transparent_65%)] animate-[penalty-pulse_0.8s_ease-in-out_infinite] pointer-events-none';

const penaltyFailureModal =
  'relative z-[2] bg-[linear-gradient(180deg,#200004,#0a0001)] border-2 border-[oklch(0.7_0.25_22)] rounded-[4px] px-[30px] py-9 w-[420px] max-w-full text-center shadow-[0_0_60px_var(--danger-glow),0_0_120px_var(--danger-glow)] animate-[penalty-shake-hard_0.3s_ease-in-out_4,penalty-slam_0.5s_cubic-bezier(0.16,1.2,0.4,1)]';
const failureGlitchWrap =
  'font-[var(--font-title)] text-[30px] font-black tracking-[0.18em] text-[oklch(0.95_0.05_22)] relative [text-shadow:0_0_24px_var(--danger),0_0_48px_var(--danger-glow)] mb-1.5 animate-[penalty-glitch_1s_steps(1)_infinite]';
const failureGlitchLayer = 'absolute inset-0';
const failureGlitchLayerTop =
  'text-[oklch(0.65_0.25_22)] animate-[penalty-glitch-1_1.5s_infinite_linear_alternate-reverse] [clip-path:polygon(0_0,100%_0,100%_35%,0_35%)]';
const failureGlitchLayerBottom =
  'text-[oklch(0.7_0.2_200)] animate-[penalty-glitch-2_1s_infinite_linear_alternate-reverse] [clip-path:polygon(0_60%,100%_60%,100%_100%,0_100%)]';
const penaltyFailureSub =
  'font-[var(--font-title)] text-[10px] tracking-[0.3em] text-[oklch(0.75_0.18_22)] mb-[18px]';
const penaltyFailureIcon =
  'text-[60px] my-3 [filter:drop-shadow(0_0_20px_var(--danger))] animate-[penalty-pulse_1.5s_ease-in-out_infinite]';
const penaltyFailureMsg = 'text-[12px] text-[oklch(0.78_0.03_22)] leading-[1.6] my-4 mb-[22px]';

const penaltyBtnBase =
  'w-full p-[14px] font-[var(--font-title)] text-[12px] font-bold tracking-[0.25em] text-[oklch(0.98_0.02_22)] cursor-pointer rounded-[4px] border uppercase transition-all duration-200 relative overflow-hidden';
const penaltyBtnPrimary =
  "bg-[linear-gradient(135deg,var(--danger-deep),var(--danger))] border-[oklch(0.85_0.2_22)] shadow-[0_0_20px_var(--danger-glow),inset_0_0_12px_oklch(0_0_0_/_0.5)] hover:-translate-y-px hover:shadow-[0_0_30px_var(--danger-glow),0_0_60px_var(--danger-glow),inset_0_0_12px_oklch(0_0_0_/_0.5)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-[60%] before:h-full before:bg-[linear-gradient(90deg,transparent,oklch(1_0_0_/_0.3),transparent)] before:animate-[penalty-sweep_2.5s_linear_infinite]";
