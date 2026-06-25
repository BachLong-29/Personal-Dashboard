/* Aetheria Analytics — Tweaks island.
   Mounts the shared TweaksPanel and drives accent + motion on the page. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "motion": "full"
}/*EDITMODE-END*/;

function AnalyticsTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const first = React.useRef(true);

  React.useEffect(() => {
    // On mount, sync persisted values to the page (skip redundant work if
    // they already match the markup defaults).
    const b = document.body;
    if (first.current) {
      first.current = false;
      if (t.accent !== b.dataset.accent) window.applyAccent?.(t.accent);
      if (t.motion !== b.dataset.motion) window.applyMotion?.(t.motion);
      return;
    }
    window.applyAccent?.(t.accent);
  }, [t.accent]);

  React.useEffect(() => {
    if (first.current) return;
    window.applyMotion?.(t.motion);
  }, [t.motion]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <div className="twk-row">
          <div className="twk-lbl"><span>Accent</span></div>
          <AccentSwatches value={t.accent} onChange={(v) => setTweak('accent', v)} />
        </div>
      </TweakSection>
      <TweakSection label="Motion">
        <TweakRadio
          label="Animation"
          value={t.motion}
          options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }]}
          onChange={(v) => setTweak('motion', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// Custom accent picker mapped to the page's gold / violet / cyan palette.
function AccentSwatches({ value, onChange }) {
  const opts = [
    { key: 'gold',   col: 'oklch(0.78 0.16 82)',  label: 'Aetheric Gold' },
    { key: 'violet', col: 'oklch(0.68 0.22 295)', label: 'Arcane Violet' },
    { key: 'cyan',   col: 'oklch(0.78 0.16 205)', label: 'Mana Cyan' },
  ];
  return (
    <div className="twk-chips" role="radiogroup">
        {opts.map((o) => {
          const on = value === o.key;
          return (
            <button key={o.key} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    title={o.label} aria-label={o.label}
                    style={{ background: o.col }}
                    onClick={() => onChange(o.key)}>
              {on && (
                <svg viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round" stroke="#0a0400" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<AnalyticsTweaks />);
