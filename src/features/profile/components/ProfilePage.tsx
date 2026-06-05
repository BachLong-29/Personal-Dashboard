'use client';

import { useState, useEffect, useCallback, startTransition, type ReactNode } from 'react';
import { cn } from '@/libs/utils';
import { Button } from '@/components/ui';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { ProfileSectionNav } from './ProfileSectionNav';
import { HeroCard } from './HeroCard';
import { RevealModal, SuccessToast } from './RevealModal';
import { IdentitySection } from './sections/IdentitySection';
import { ClassSection } from './sections/ClassSection';
import { CompanionSection } from './sections/CompanionSection';
import { ThemeSection } from './sections/ThemeSection';
import { StatsSection } from './sections/StatsSection';
import { FocusSection } from './sections/FocusSection';
import { BadgesSection } from './sections/BadgesSection';
import { PrefsSection } from './sections/PrefsSection';
import { findAccent } from '@/constants/hero-data';
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
          <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.28em] uppercase text-text-lo">
            SECTION {num}
          </div>
          <h3 className="[font-family:var(--f-title)] italic font-medium text-[26px] leading-[1.1] my-1">
            {label}
          </h3>
          <div className="[font-family:var(--f-title)] italic text-[13px] text-text-lo">
            {subtitle}
          </div>
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
          filter: 'blur(80px)',
          mixBlendMode: 'screen',
          opacity: 0.3,
          background: 'radial-gradient(circle, oklch(60% 0.12 290/0.6), transparent 70%)',
          left: -200,
          top: 100,
          animation: 'drift-a 70s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute w-[900px] h-[500px] rounded-full"
        style={{
          filter: 'blur(80px)',
          mixBlendMode: 'screen',
          opacity: 0.25,
          background: 'radial-gradient(circle, oklch(60% 0.14 60/0.5), transparent 70%)',
          right: -200,
          top: 600,
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

// ─── Hamburger icon ───────────────────────────────────────────────────────────
function HamburgerIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor">
      <rect y="0" width="20" height="1.5" rx="1" />
      <rect y="6" width="20" height="1.5" rx="1" />
      <rect y="12" width="14" height="1.5" rx="1" />
    </svg>
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
  const [navOpen, setNavOpen] = useState(false);

  // Populate form once data loads
  useEffect(() => {
    if (data) {
      startTransition(() => {
        setForm(mergeProfileToForm(data.profile, data.settings));
      });
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

  // Close mobile nav on ESC
  useEffect(() => {
    if (!navOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navOpen]);

  const handleSectionPick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // For mobile: close drawer first, then scroll
  const handleSectionPickMobile = useCallback((id: string) => {
    setNavOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
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
          <div className="[font-family:var(--f-mono)] text-[10px] tracking-[0.3em] uppercase text-text-lo">
            Loading hero data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-0)' }}>
      <AmbientBg />

      {/* ── Mobile nav drawer overlay ─────────────────────────── */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[280px] flex-shrink-0 h-full overflow-y-auto">
            <ProfileSectionNav
              active={activeSection}
              onPick={handleSectionPickMobile}
              lastSaved={lastSaved}
            />
          </div>
          {/* backdrop */}
          <div
            className="flex-1"
            style={{ background: 'oklch(8% 0.02 270/0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
        </div>
      )}

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <div
        className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border-lo"
        style={{
          background: 'oklch(13% 0.03 270/0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <div className="[font-family:var(--f-mono)] text-[8px] tracking-[0.28em] uppercase text-text-lo">
            EDITING CHAMBER
          </div>
          <h1 className="[font-family:var(--f-title)] italic font-medium text-[18px] leading-tight">
            Hero Identity
          </h1>
        </div>
        <button
          onClick={() => setNavOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-text-hi hover:text-gold transition-colors"
          aria-label="Open section navigation"
        >
          <HamburgerIcon />
        </button>
      </div>

      {/* ── Main 3-column grid ────────────────────────────────── */}
      {/*
        mobile  (<768px) : 1 col  — nav hidden, right rail hidden
        md (768-1023px)  : 2 cols [220px + 1fr] — right rail hidden
        lg (1024-1279px) : 3 cols [220px + 1fr + 300px]
        xl (1280px+)     : 3 cols [260px + 1fr + 400px]
      */}
      <div
        className={cn(
          'relative z-[2] mx-auto min-h-screen',
          'grid grid-cols-1',
          'md:grid-cols-[220px_1fr]',
          'lg:grid-cols-[220px_1fr_300px]',
          'xl:grid-cols-[260px_1fr_400px]',
        )}
        style={{ maxWidth: 1640 }}
      >
        {/* Left nav — hidden on mobile, sidebar from md+ */}
        <div className="hidden md:block sticky top-0 h-screen">
          <ProfileSectionNav
            active={activeSection}
            onPick={handleSectionPick}
            lastSaved={lastSaved}
          />
        </div>

        {/* Middle form */}
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-8 pb-40 flex flex-col gap-10 md:gap-14">
          <FormSection id="identity" num="I" label="Identity" subtitle="Name · title · monogram">
            <IdentitySection form={form} onChange={set} />
          </FormSection>

          <FormSection id="class" num="II" label="Class & Path" subtitle="Choose how you progress">
            <ClassSection value={form.classId} onChange={(v) => set('classId', v)} />
          </FormSection>

          <FormSection
            id="companion"
            num="III"
            label="Companion"
            subtitle="Pick your travelling spirit"
          >
            <CompanionSection value={form.companionId} onChange={(v) => set('companionId', v)} />
          </FormSection>

          <FormSection id="theme" num="IV" label="Theme & Sigil" subtitle="Colour of your light">
            <ThemeSection value={form.accent} onChange={(v) => set('accent', v)} />
          </FormSection>

          <FormSection id="stats" num="V" label="Attributes" subtitle="Allocate your points">
            <StatsSection
              stats={form.stats}
              pool={form.statPool}
              onChange={(v) => set('stats', v)}
            />
          </FormSection>

          <FormSection
            id="focus"
            num="VI"
            label="Focus Categories"
            subtitle="What quests you draw, in order of priority"
          >
            <FocusSection value={form.primaryFocus} onChange={(v) => set('primaryFocus', v)} />
          </FormSection>

          <FormSection id="badges" num="VII" label="Showcase" subtitle="Up to four worn badges">
            <BadgesSection value={form.badges} onChange={(v) => set('badges', v)} />
          </FormSection>

          <FormSection
            id="prefs"
            num="VIII"
            label="Quest Behaviour"
            subtitle="Cadence and difficulty"
          >
            <PrefsSection form={form} onChange={set} />
          </FormSection>
        </div>

        {/* Right rail (HeroCard) — hidden until lg */}
        <div className="hidden lg:flex sticky top-0 h-screen p-7 pl-4 flex-col overflow-hidden">
          <HeroCard form={form} />
        </div>
      </div>

      {/* ── Fixed action bar ──────────────────────────────────── */}
      {/*
        mobile : spans full width (left-4 right-4)
        md     : starts after 220px nav, full right (md:left-[220px] md:right-0 md:mx-4)
        lg     : between 220px nav and 300px right rail
        xl     : between 260px nav and 400px right rail
      */}
      <div
        className={cn(
          'fixed bottom-5 z-10 flex justify-between items-center gap-3 px-4 sm:px-[22px] py-4',
          'border border-border rounded-md',
          'left-4 right-4',
          'md:left-[220px] md:right-0 md:mx-4',
          'lg:left-[220px] lg:right-[300px] lg:mx-8',
          'xl:left-[260px] xl:right-[400px] xl:mx-10',
        )}
        style={{
          background: 'linear-gradient(180deg, oklch(16% 0.04 270/0.9), oklch(12% 0.03 270/0.95))',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 60px oklch(5% 0.02 270/0.7)',
        }}
      >
        <div className="flex gap-3 sm:gap-[22px] items-center min-w-0">
          <div className="hidden sm:block min-w-0">
            <div className="[font-family:var(--f-mono)] text-[9px] tracking-[0.26em] uppercase text-text-lo">
              YOUR EDITS
            </div>
            <div className="[font-family:var(--f-title)] italic text-[14px] text-text-md truncate">
              A draft self, waiting to be sealed.
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {[{ label: 'AUTOSAVED' }, { label: 'VALIDATED' }].map(({ label }) => (
              <div
                key={label}
                className="flex gap-[5px] items-center [font-family:var(--f-mono)] text-[9px] tracking-[0.14em] text-text-lo"
              >
                <span
                  className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background: 'var(--gold)', boxShadow: '0 0 8px var(--gold)' }}
                />
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-[10px] flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleRevert}>
            Revert
          </Button>
          <Button variant="primary" size="sm" onClick={() => setRevealing(true)}>
            <span className="[font-family:var(--f-title)] italic text-[14px]">✦</span>
            <span className="hidden sm:inline">Reveal hero</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      {/* Reveal modal */}
      {revealing && (
        <RevealModal form={form} onClose={() => setRevealing(false)} onConfirm={handleConfirm} />
      )}

      {/* Success toast */}
      {toast && <SuccessToast accentGlow={accent.glow} onDismiss={() => setToast(false)} />}
    </div>
  );
}
