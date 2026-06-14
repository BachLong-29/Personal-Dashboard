'use client';

interface ProgressRingProps {
  value: number; // 0–1
  size?: number;
  stroke?: number;
}

export function ProgressRing({ value, size = 52, stroke = 5 }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{
          transition: 'stroke-dashoffset 0.8s ease-out',
          filter: 'drop-shadow(0 0 4px currentColor)',
        }}
      />
    </svg>
  );
}
