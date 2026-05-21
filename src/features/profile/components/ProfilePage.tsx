'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/libs/utils';
import { Button } from '@/components/ui';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { ProfileSectionNav, PROFILE_SECTIONS } from './ProfileSectionNav';
import { HeroCard } from './HeroCard';
import { RevealModal, SuccessToast } from './RevealModal';
import { IdentitySection }  from './sections/IdentitySection';
import { ClassSection }     from './sections/ClassSection';
import { CompanionSection } from './sections/CompanionSection';
import { ThemeSection }     from './sections/ThemeSection';
import { StatsSection }     from './sections/StatsSection';
import { FocusSection }     from './sections/FocusSection';
import { BadgesSection }    from './sections/BadgesSection';
import { PrefsSection }     from './sections/PrefsSection';
import { findAccent }       from '@/constants/hero-data';
import { DEFAULT_PROFILE_FORM, mergeProfileToForm } from '@/types/profile';
import type { ProfileFormData } from '@/types/profile';

// ─── Section wrapper ──────────────────────────────────────────────────────────
function FormSection({
  id,
  num,
  label,
  subtitle,
  children,
}: {
  id: string;
  num: string;
  label: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-section={id} className="relative scroll-mt-8">
      <div className="flex gap-[18px] items-baseline mb-6 pb-4 border-b border-border-lo relative">
        <div
          className="absolute left-0 bottom-[-1px] w-20 h-px"
          style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }}
        />
        <div className="[font-family:var(--f-title)] italic font-medium text-[32px] text-gold w-14 flex-shrink-0">
          {num}
        </div>
        <div>
          <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.28em] uppercase text-text-lo">SECTION {num}</div>
          <h3 className="[font-family:var(--f-title)] italic font-medium text-[26px] leading-[1.1] my-1">{label}</h3>
          <div className="[font-family:var(--f-title)] italic text-[13px] text-text-lo">{subtitle}</div>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

// ─── Ambient background ───────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute w-[900px] h-[500px] rounded-full"
        style={{
          filter: 'blur(80px)', mixBlendMode: 'screen', opacity: 0.3,
          background: 'radial-gradient(circle, oklch(60% 0.12 290/0.6), transparent 70%)',
          left: -200, top: 100,
          animation: 'drift-a 70s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute w-[900px] h-[500px] rounded-full"
        style={{
          filter: 'blur(80px)', mixBlendMode: 'screen', opacity: 0.25,
          background: 'radial-gradient(circle, oklch(60% 0.14 60/0.5), transparent 70%)',
          right: -200, top: 600,
          animation: 'drift-b 90s ease-in-out infinite alternate',
        }}
      />
      <style>{`
        @keyframes drift-a { to { transform: translate(160px, 80px); } }
        @keyframes drift-b { to { transform: translate(-120px, 140px); } }
      `}</style>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { data, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const [form, setForm] = useState<ProfileFormData>(DEFAULT_PROFILE_FORM);
  const [activeSection, setActiveSection] = useState('identity');
  const [revealing, setRevealing] = useState(false);
  const [toast, setToast] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Populate form once data loads
  useEffect(() => {
    if (data) {
      setForm(mergeProfileToForm(data.profile, data.settings));
    }
  }, [data]);

  // Scroll spy — update active section as user scrolls
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]');
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection((visible[0].target as HTMLElement).dataset.section ?? '');
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.2, 0.5, 1] },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [isLoading]);

  const handleSectionPick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const set = useCallback(<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRevert = () => {
    if (data) setForm(mergeProfileToForm(data.profile, data.settings));
  };

  const handleConfirm = async () => {
    await updateMutation.mutateAsync(form);
    setRevealing(false);
    setToast(true);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const accent = findAccent(form.accent);

  if (isLoading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-bg-0">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-gold border-border animate-spin" />
          <div className="[font-family:var(--f-mono)] text-[10px] tracking-[0.3em] uppercase text-text-lo">Loading hero data</div>
        </div>
      </div>
    );
  }

  const actionBarCls = cn(
    'fixed bottom-5 z-10 flex justify-between items-center gap-4 px-[22px] py-4',
    'border border-border rounded-md',
  );

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--bg-0)' }}
    >
      <AmbientBg />

      <div
        className="relative z-[2] mx-auto min-h-screen"
        style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr) 400px', maxWidth: 1640 }}
      >
        {/* Left nav */}
        <div className="sticky top-0 h-screen">
          <ProfileSectionNav
            active={activeSection}
            onPick={handleSectionPick}
            lastSaved={lastSaved}
          />
        </div>

        {/* Middle form */}
        <div className="px-10 py-8 pb-40 flex flex-col gap-14">
          <FormSection id="identity" num="I" label="Identity" subtitle="Name · title · monogram">
            <IdentitySection form={form} onChange={set} />
          </FormSection>

          <FormSection id="class" num="II" label="Class & Path" subtitle="Choose how you progress">
            <ClassSection value={form.classId} onChange={(v) => set('classId', v)} />
          </FormSection>

          <FormSection id="companion" num="III" label="Companion" subtitle="Pick your travelling spirit">
            <CompanionSection value={form.companionId} onChange={(v) => set('companionId', v)} />
          </FormSection>

          <FormSection id="theme" num="IV" label="Theme & Sigil" subtitle="Colour of your light">
            <ThemeSection value={form.accent} onChange={(v) => set('accent', v)} />
          </FormSection>

          <FormSection id="stats" num="V" label="Attributes" subtitle="Allocate your points">
            <StatsSection stats={form.stats} pool={form.statPool} onChange={(v) => set('stats', v)} />
          </FormSection>

          <FormSection id="focus" num="VI" label="Focus Categories" subtitle="What quests you draw, in order of priority">
            <FocusSection value={form.primaryFocus} onChange={(v) => set('primaryFocus', v)} />
          </FormSection>

          <FormSection id="badges" num="VII" label="Showcase" subtitle="Up to four worn badges">
            <BadgesSection value={form.badges} onChange={(v) => set('badges', v)} />
          </FormSection>

          <FormSection id="prefs" num="VIII" label="Quest Behaviour" subtitle="Cadence and difficulty">
            <PrefsSection form={form} onChange={set} />
          </FormSection>
        </div>

        {/* Right rail */}
        <div className="sticky top-0 h-screen p-7 pl-4 flex flex-col overflow-hidden">
          <HeroCard form={form} />
        </div>
      </div>

      {/* Fixed action bar */}
      <div
        className={actionBarCls}
        style={{
          left: 260,
          width: 'calc(min(1640px, 100vw) - 260px - 400px - 80px)',
          marginLeft: 40,
          background: 'linear-gradient(180deg, oklch(16% 0.04 270/0.9), oklch(12% 0.03 270/0.95))',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 60px oklch(5% 0.02 270/0.7)',
        }}
      >
        <div className="flex gap-[22px] items-center">
          <div>
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.26em] uppercase text-text-lo">YOUR EDITS</div>
            <div className="[font-family:var(--f-title)] italic text-[14px] text-text-md">A draft self, waiting to be sealed.</div>
          </div>
          <div className="flex gap-3">
            {[
              { dot: true, label: 'AUTOSAVED' },
              { dot: true, label: 'VALIDATED' },
            ].map(({ label }) => (
              <div key={label} className="flex gap-[5px] items-center [font-family:var(--f-mono)] text-[9px] tracking-[0.14em] text-text-lo">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-[10px]">
          <Button variant="ghost" size="sm" onClick={handleRevert}>
            Revert
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRevealing(true)}
          >
            <span className="[font-family:var(--f-title)] italic text-[14px]">✦</span>
            Reveal hero
          </Button>
        </div>
      </div>

      {/* Reveal modal */}
      {revealing && (
        <RevealModal
          form={form}
          onClose={() => setRevealing(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Success toast */}
      {toast && (
        <SuccessToast
          accentGlow={accent.glow}
          onDismiss={() => setToast(false)}
        />
      )}
    </div>
  );
}
