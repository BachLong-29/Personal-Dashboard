// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Goal Bingo · app
// HUD, board state, bingo detection, the reward/bingo/achievement
// sequence, persistence, tweaks, mount.
// ═══════════════════════════════════════════════════════════════════
const { useState: aState, useEffect: aEffect, useMemo: aMemo, useRef: aRef } = React;

const LS_KEY = "aetheria-bingo-v3";
const glowOf = (c) => String(c).replace(/\)\s*$/, " / 0.35)");

const ACCENT_OPTIONS = [
  "oklch(0.78 0.16 82)",   // gold
  "oklch(0.68 0.22 295)",  // violet
  "oklch(0.78 0.16 205)",  // cyan
  "oklch(0.76 0.14 162)",  // mint
];
const DAUB_OPTIONS = [
  "oklch(0.78 0.16 82)",   // gold
  "oklch(0.76 0.14 162)",  // mint
  "oklch(0.68 0.22 295)",  // violet
  "oklch(0.74 0.18 5)",    // rose
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.78 0.16 82)",
  "daub": "oklch(0.78 0.16 82)",
  "boardGlow": 0.6,
  "confetti": true
}/*EDITMODE-END*/;

// ── persistence helpers ─────────────────────────────────────
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch (e) { return null; }
}
function freshCells() {
  return BINGO_CELLS.map((c) => ({
    ...c,
    milestones: c.milestones.map((m) => ({ ...m })),
    notes: c.notes.map((n) => ({ ...n })),
  }));
}
function buildInitial() {
  const base = freshCells();
  const saved = loadSaved();
  if (!saved) return { cells: base, wonLines: [], streakBonus: 0 };
  const byId = Object.fromEntries((saved.cells || []).map((s) => [s.id, s]));
  const cells = base.map((c) => {
    const s = byId[c.id];
    if (!s) return c;
    return {
      ...c,
      status: s.status, progress: s.progress, completedDate: s.completedDate,
      milestones: c.milestones.map((m, i) => ({ ...m, done: s.milestones ? !!s.milestones[i] : m.done })),
      notes: Array.isArray(s.notes) ? s.notes : c.notes,
    };
  });
  return { cells, wonLines: saved.wonLines || [], streakBonus: saved.streakBonus || 0 };
}

const lineDone = (cells, line) => line.cells.every((i) => cells[i].status === "completed");

// ── animated count-up ───────────────────────────────────────
function AnimatedNumber({ value, dur = 750 }) {
  const [disp, setDisp] = aState(value);
  const fromRef = aRef(value);
  const rafRef = aRef(0);
  aEffect(() => {
    const from = fromRef.current, to = value;
    if (from === to) { setDisp(to); return; }
    let start;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <>{disp}</>;
}

// ── HUD tile ────────────────────────────────────────────────
function HudTile({ label, ico, color, value, suffix, of, sub }) {
  const [bump, setBump] = aState(false);
  const prev = aRef(value);
  aEffect(() => {
    if (prev.current !== value) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div className={cls("hud-tile", color, bump && "hud-bumped")}>
      <div className="hud-label"><span className="hud-ico">{ico}</span>{label}</div>
      <div className="hud-value">
        <AnimatedNumber value={value} />{suffix && <small>{suffix}</small>}
        {of != null && <span className="of">/{of}</span>}
      </div>
      <div className="hud-sub">{sub}</div>
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [boot] = aState(buildInitial);

  const [cells, setCells] = aState(boot.cells);
  const [wonLines, setWonLines] = aState(boot.wonLines);
  const [streakBonus, setStreakBonus] = aState(boot.streakBonus);
  const [query, setQuery] = aState("");
  const [selectedId, setSelectedId] = aState(null);

  // entrance
  const [dealt, setDealt] = aState(false);
  const [ready, setReady] = aState(false);

  // celebration channels
  const [justDoneId, setJustDoneId] = aState(null);
  const [lineWinCells, setLineWinCells] = aState([]);
  const [reward, setReward] = aState(null);
  const [bingo, setBingo] = aState(null);
  const [ach, setAch] = aState(null);
  const [shaking, setShaking] = aState(false);

  const cellsRef = aRef(cells);
  aEffect(() => { cellsRef.current = cells; }, [cells]);

  // ── tweaks → CSS vars ──
  aEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--accent", t.accent);
    root.setProperty("--accent-glow", glowOf(t.accent));
    root.setProperty("--daub", t.daub);
    root.setProperty("--daub-glow", glowOf(t.daub));
    root.setProperty("--board-glow", String(t.boardGlow));
  }, [t.accent, t.daub, t.boardGlow]);

  // ── persist ──
  aEffect(() => {
    const payload = {
      wonLines, streakBonus,
      cells: cells.map((c) => ({
        id: c.id, status: c.status, progress: c.progress, completedDate: c.completedDate,
        milestones: c.milestones.map((m) => m.done), notes: c.notes,
      })),
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch (e) {}
  }, [cells, wonLines, streakBonus]);

  // ── entrance sequence ──
  const runEntrance = () => {
    setDealt(false); setReady(false);
    const t1 = setTimeout(() => setDealt(true), 240);
    const t2 = setTimeout(() => {
      setReady(true);
      if (t.confetti && window.BingoFX) window.BingoFX.confetti({ count: 46 });
    }, 1280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  };
  aEffect(() => runEntrance(), []); // eslint-disable-line

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 650); };

  // ── derived stats ──
  const stats = aMemo(() => {
    const total = cells.length;
    const completed = cells.filter((c) => c.status === "completed").length;
    const xpEarned = cells.filter((c) => c.status === "completed").reduce((a, c) => a + c.xp, 0);
    const avg = Math.round((cells.reduce((a, c) => a + c.progress, 0) / total) * 100);
    return { total, completed, xpEarned, avg, lines: wonLines.length, achievements: completed, streak: HERO.streak + streakBonus };
  }, [cells, wonLines, streakBonus]);

  // ── conquer a goal (full celebration) ──
  const conquer = (cell) => {
    const cur = cellsRef.current;
    const idx = cur.findIndex((c) => c.id === cell.id);
    if (idx < 0 || cur[idx].status === "completed") return;

    const next = cur.map((c) => c.id === cell.id
      ? { ...c, status: "completed", progress: 1, completedDate: "Today", milestones: c.milestones.map((m) => ({ ...m, done: true })) }
      : c);

    setCells(next);
    setSelectedId(null);
    setStreakBonus((b) => b + 1);
    setJustDoneId(cell.id);
    setTimeout(() => setJustDoneId(null), 950);

    if (t.confetti && window.BingoFX) window.BingoFX.confetti();
    setReward({ title: cell.title, cat: CAT[cell.cat].label, rank: cell.rank, xp: cell.xp, coins: cell.coins, icon: CAT[cell.cat].ci });

    if (cell.linkedTrophy) {
      setTimeout(() => setAch({ name: cell.linkedTrophy, reward: `+${cell.xp} XP · +${cell.coins} ◉`, icon: "♛" }), 650);
    }

    // bingo detection
    const newLines = BINGO_LINES.filter((l) => !lineDone(cur, l) && lineDone(next, l));
    if (newLines.length) {
      setWonLines((prev) => {
        const s = new Set(prev);
        newLines.forEach((l) => s.add(l.id));
        return [...s];
      });
      const flash = [...new Set(newLines.flatMap((l) => l.cells))];
      setTimeout(() => {
        setLineWinCells(flash);
        setTimeout(() => setLineWinCells([]), 1300);
        if (t.confetti && window.BingoFX) window.BingoFX.fireworks(6);
        shake();
        const line = newLines[0];
        setBingo({ line: line.label, cheer: BINGO_CHEERS[(Math.random() * BINGO_CHEERS.length) | 0] });
      }, 950);
    }
  };

  // ── milestone toggle (may auto-complete) ──
  const onToggleMilestone = (goalId, msId) => {
    const cur = cellsRef.current;
    const cell = cur.find((c) => c.id === goalId);
    if (!cell) return;
    const milestones = cell.milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m));
    const doneCount = milestones.filter((m) => m.done).length;
    const progress = milestones.length ? doneCount / milestones.length : cell.progress;
    if (progress >= 1 && cell.status !== "completed") { conquer(cell); return; }
    let status = cell.status;
    if (status === "completed" && progress < 1) status = "in-progress";
    else if (status === "not-started" && doneCount > 0) status = "in-progress";
    else if (status === "in-progress" && doneCount === 0) status = "not-started";
    setCells(cur.map((c) => (c.id === goalId ? { ...c, milestones, progress, status } : c)));
  };

  // ── notes ──
  const onAddNote = (id, note) => setCells((prev) => prev.map((c) => (c.id === id ? { ...c, notes: [note, ...c.notes] } : c)));
  const onEditNote = (id, nid, text) => setCells((prev) => prev.map((c) => (c.id === id
    ? { ...c, notes: c.notes.map((n) => (n.id === nid ? { ...n, text, edited: true } : n)) } : c)));
  const onDeleteNote = (id, nid) => setCells((prev) => prev.map((c) => (c.id === id
    ? { ...c, notes: c.notes.filter((n) => n.id !== nid) } : c)));

  // ── reset ──
  const reset = () => {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    setCells(freshCells());
    setWonLines([]); setStreakBonus(0); setSelectedId(null);
    setReward(null); setBingo(null); setAch(null); setLineWinCells([]);
    runEntrance();
  };

  const selected = selectedId != null ? cells.find((c) => c.cell === selectedId) : null;

  // line panel data
  const lineData = BINGO_LINES.map((l) => {
    const done = l.cells.filter((i) => cells[i].status === "completed").length;
    return { ...l, done, won: done === l.cells.length };
  });

  const dealtNow = stats.completed;

  return (
    <div className={cls("app", shaking && "shake")}>
      <FXCanvas />
      <TopBar query={query} setQuery={setQuery} />
      <div className="shell">
        <NavRail />
        <main className="main bingo-main">

          {/* HEADER */}
          <div className="page-header">
            <div className="ph-left">
              <div className="ph-tag">⊞ &nbsp; THE GLORY BOARD · 2026 &nbsp; ⊞</div>
              <h1 className="ph-title">Goal Bingo</h1>
              <p className="ph-desc">
                Sixteen ambitions, one board. Conquer goals to daub their cells — complete a full
                <span className="combo"> row, column, or diagonal</span> to land a BINGO and claim the glory.
              </p>
            </div>
            <div className="ph-right">
              <button className="btn-secondary" onClick={reset} title="Reset the board">↺ Reset Board</button>
            </div>
          </div>

          {/* HUD */}
          <div className="hud">
            <HudTile label="Ambitions" ico="◈" color="hud-c-violet" value={stats.total} sub="on the board" />
            <HudTile label="Conquered" ico="✓" color="hud-c-mint" value={stats.completed} of={stats.total} sub="cells daubed" />
            <HudTile label="Progress" ico="◐" color="hud-c-cyan" value={stats.avg} suffix="%" sub="board average" />
            <HudTile label="Streak" ico="✦" color="hud-c-rose" value={stats.streak} suffix="d" sub="unbroken" />
            <HudTile label="XP Earned" ico="◆" color="hud-c-violet" value={stats.xpEarned} sub="from conquests" />
            <HudTile label="Bingo Lines" ico="⊞" color="hud-c-gold" value={stats.lines} of={10} sub="lines lit" />
            <HudTile label="Trophies" ico="♛" color="hud-c-gold" value={stats.achievements} sub="achievements" />
          </div>

          {/* BOARD + ASIDE */}
          <div className="board-stage">
            <BingoBoard
              cells={cells} dealt={dealt} ready={ready} query={query}
              onOpen={(i) => setSelectedId(i)}
              justDoneId={justDoneId} lineWinCells={lineWinCells}
            />

            <div className="board-aside">
              <div className="lines-panel">
                <div className="lp-head">⊞ Bingo Lines <span className="n">{stats.lines}/10</span></div>
                {lineData.map((l) => (
                  <div key={l.id} className={cls("line-row", l.won && "won")}>
                    <div className="line-pips">
                      {l.cells.map((ci, k) => (
                        <span key={k} className={cls("line-pip", cells[ci].status === "completed" && "on")} />
                      ))}
                    </div>
                    <span className="line-name">{l.label}</span>
                    {!l.won && <span className="line-frac">{l.done}/4</span>}
                  </div>
                ))}
              </div>

              <div className="legend-panel">
                <div className="lp-head">◇ Cell States</div>
                <div className="legend-row">
                  <span className="legend-chip lg-locked">🔒</span>
                  <div className="legend-meta"><div className="legend-name">Locked</div><div className="legend-desc">Not yet begun — tap to open</div></div>
                </div>
                <div className="legend-row">
                  <span className="legend-chip lg-active">◐</span>
                  <div className="legend-meta"><div className="legend-name">In Progress</div><div className="legend-desc">Underway, pulsing with intent</div></div>
                </div>
                <div className="legend-row">
                  <span className="legend-chip lg-done">✓</span>
                  <div className="legend-meta"><div className="legend-name">Conquered</div><div className="legend-desc">Daubed — counts toward a line</div></div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* DETAIL PANEL */}
      {selected && (
        <DetailPanel
          cell={selected}
          onClose={() => setSelectedId(null)}
          onToggleMilestone={onToggleMilestone}
          onComplete={conquer}
          onAddNote={onAddNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      )}

      {/* FX OVERLAYS */}
      {reward && <RewardPopup data={reward} onDone={() => setReward(null)} />}
      {bingo && <BingoBanner data={bingo} onDone={() => setBingo(null)} />}
      {ach && <AchievementToast data={ach} onDone={() => setAch(null)} />}

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTIONS} onChange={(v) => setTweak("accent", v)} />
        <TweakColor label="Daub color" value={t.daub} options={DAUB_OPTIONS} onChange={(v) => setTweak("daub", v)} />
        <TweakSection label="Board" />
        <TweakSlider label="Ambient glow" value={t.boardGlow} min={0} max={1} step={0.1} onChange={(v) => setTweak("boardGlow", v)} />
        <TweakToggle label="Confetti & fireworks" value={t.confetti} onChange={(v) => setTweak("confetti", v)} />
        <TweakSection label="Board" />
        <TweakButton label="↺ Reset board progress" secondary onClick={reset} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
