'use client';

import { useEffect, useState } from 'react';

interface Particle {
  dx: string;
  dy: string;
  color: string;
  size: number;
}

interface BurstParticlesProps {
  x: number;
  y: number;
  onDone: () => void;
}

const COLORS = ['#fbbf24', '#c4b5fd', '#7dd3fc', '#6ee7b7', '#f87171', '#f9a8d4'];

export function BurstParticles({ x, y, onDone }: BurstParticlesProps) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 60 + Math.random() * 60;
      return {
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist}px`,
        color: COLORS[i % COLORS.length] ?? '#fbbf24',
        size: 4 + Math.random() * 5,
      };
    }),
  );

  useEffect(() => {
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="burst-overlay">
      {particles.map((p, i) => (
        <div
          key={i}
          className="burst-particle"
          style={
            {
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              background: p.color,
              '--dx': p.dx,
              '--dy': p.dy,
              animationDelay: `${i * 20}ms`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
