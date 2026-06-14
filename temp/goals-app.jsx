// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Ambitions & Glory · app
// State, filtering, sorting, actions, tabs, tweaks, mount.
// ═══════════════════════════════════════════════════════════════════
const { useState: uState, useEffect: uEffect, useMemo } = React;

const PRI_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER = { "in-progress": 0, "not-started": 1, "completed": 2, "archived": 3 };

const ACCENT_GOLD = "oklch(0.78 0.16 82)";
const ACCENT_OPTIONS = [
  ACCENT_GOLD,            // gold
  "oklch(0.68 0.22 295)", // violet
  "oklch(0.78 0.16 205)", // cyan
  "oklch(0.76 0.14 162)", // mint
];
const glowOf = (c) => c.replace(/\)\s*$/, " / 0.35)");

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.78 0.16 82)",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [tab, setTab] = uState("goals");           // goals | overview | trophies
  const [query, setQuery] = uState("");
  const [filterCat, setFilterCat] = uState("all");
  const [filterStatus, setFilterStatus] = uState("all");
  const [sortBy, setSortBy] = uState("priority");
  const [expandedId, setExpandedId] = uState(null);
  const [goals, setGoals] = uState(() => GOALS.map((g) => ({ ...g, milestones: g.milestones.map((m) => ({ ...m })) })));
  const [trophies] = uState(TROPHIES);
  const [modal, setModal] = uState(null);          // { mode, goal }
  const [burst, setBurst] = uState(null);          // { main, sub }

  // apply tweaks → CSS vars
  uEffect(() => {
    const a = t.accent || ACCENT_GOLD;
    document.documentElement.style.setProperty("--accent", a);
    document.documentElement.style.setProperty("--accent-glow", glowOf(a));
  }, [t.accent]);

  const fireBurst = (main, sub) => {
    setBurst({ main, sub });
    setTimeout(() => setBurst(null), 2100);
  };

  // ── derived stats (from full list) ──
  const stats = useMemo(() => {
    const total = goals.filter((g) => g.status !== "archived").length;
    const active = goals.filter((g) => g.status === "in-progress").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const notStarted = goals.filter((g) => g.status === "not-started").length;
    const denom = total || 1;
    const completionRate = Math.round((completed / denom) * 100);
    const activeGoals = goals.filter((g) => g.status === "in-progress" || g.status === "not-started");
    const avgProgress = activeGoals.length
      ? Math.round((activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length) * 100) : 0;
    const milestonesTotal = goals.reduce((a, g) => a + g.milestones.length, 0);
    const milestonesDone = goals.reduce((a, g) => a + g.milestones.filter((m) => m.done).length, 0);
    const unlockedT = trophies.filter((tr) => tr.unlocked).length;
    return {
      total, active, completed, notStarted, completionRate, avgProgress,
      completedThisYear: completed, milestonesTotal, milestonesDone,
      trophies: unlockedT, totalTrophies: trophies.length, lockedTrophies: trophies.length - unlockedT,
    };
  }, [goals, trophies]);

  // ── filtered + sorted goals for the Goals tab ──
  const visibleGoals = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = goals.filter((g) => {
      if (filterCat !== "all" && g.cat !== filterCat) return false;
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (filterStatus === "all" && g.status === "archived") return false; // hide archived unless explicitly chosen
      if (q) {
        const hay = (g.title + " " + g.desc + " " + CAT[g.cat].label + " " + g.milestones.map((m) => m.label).join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = list.slice().sort((a, b) => {
      if (sortBy === "priority") return PRI_ORDER[a.priority] - PRI_ORDER[b.priority] || b.progress - a.progress;
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "due") return (a.daysLeft || 999) - (b.daysLeft || 999);
      if (sortBy === "status") return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      return 0;
    });
    return list;
  }, [goals, query, filterCat, filterStatus, sortBy]);

  // ── actions ──
  const onToggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  const onToggleMilestone = (goalId, msId) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map((m) => (m.id === msId ? { ...m, done: !m.done } : m));
      const doneCount = milestones.filter((m) => m.done).length;
      const progress = milestones.length ? doneCount / milestones.length : g.progress;
      let status = g.status;
      if (progress >= 1) status = "completed";
      else if (g.status === "completed") status = "in-progress";
      else if (g.status === "not-started" && doneCount > 0) status = "in-progress";
      const justChecked = milestones.find((m) => m.id === msId).done;
      if (justChecked) fireBurst("✓ MILESTONE CLEARED", progress >= 1 ? "Ambition conquered! Trophy unlocked." : "+1 step toward glory");
      return { ...g, milestones, progress, status, completedDate: status === "completed" ? "Today" : g.completedDate };
    }));
  };

  const onAction = (action, goal) => {
    if (action === "edit") { setModal({ mode: "edit", goal }); return; }
    if (action === "complete") {
      setGoals((prev) => prev.map((g) => g.id === goal.id
        ? { ...g, status: "completed", progress: 1, completedDate: "Today", milestones: g.milestones.map((m) => ({ ...m, done: true })) } : g));
      fireBurst("✦ AMBITION CONQUERED", `+${goal.xp} XP · +${goal.coins} ◉`);
      return;
    }
    if (action === "archive") { setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, status: "archived" } : g)); return; }
    if (action === "restore") { setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, status: g.progress >= 1 ? "completed" : g.progress > 0 ? "in-progress" : "not-started" } : g)); return; }
    if (action === "delete") { setGoals((prev) => prev.filter((g) => g.id !== goal.id)); return; }
  };

  const tabCounts = {
    goals: goals.filter((g) => g.status !== "archived").length,
    trophies: stats.trophies,
  };

  return (
    <div className="app" data-density={t.density}>
      <TopBar query={query} setQuery={setQuery} />
      <div className="shell">
        <NavRail />
        <main className="main">
          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="ph-left">
              <div className="ph-tag">✦ &nbsp; CHRONICLE · 2026 &nbsp; ✦</div>
              <h1 className="ph-title">Ambitions & Glory</h1>
              <p className="ph-desc">
                {stats.active} ambitions in motion · {stats.completed} conquered · {stats.trophies} trophies earned ·
                <span className="combo"> {stats.completionRate}%</span> completion this season.
              </p>
            </div>
            <div className="ph-right">
              <div className="tab-switch">
                {[
                  { k: "goals", i: "◈", l: "Goals", c: tabCounts.goals },
                  { k: "overview", i: "▦", l: "Overview" },
                  { k: "trophies", i: "✧", l: "Trophies", c: tabCounts.trophies },
                ].map((tb) => (
                  <button key={tb.k} className={cls("tsw-btn", tab === tb.k && "active")} onClick={() => setTab(tb.k)}>
                    <span className="ico">{tb.i}</span>
                    <span>{tb.l}</span>
                    {tb.c != null && <span className="count">{tb.c}</span>}
                  </button>
                ))}
              </div>
              {tab === "goals" && (
                <button className="btn-primary" onClick={() => setModal({ mode: "new", goal: null })}><span>＋</span> New Goal</button>
              )}
            </div>
          </div>

          {/* TAB CONTENT */}
          {tab === "goals" && (
            <GoalsView
              goals={visibleGoals} stats={stats}
              filterCat={filterCat} setFilterCat={setFilterCat}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              sortBy={sortBy} setSortBy={setSortBy}
              expandedId={expandedId} onToggleExpand={onToggleExpand}
              onToggleMilestone={onToggleMilestone} onAction={onAction}
              onNew={() => setModal({ mode: "new", goal: null })}
            />
          )}
          {tab === "overview" && <OverviewView allGoals={goals} stats={stats} trophies={trophies} />}
          {tab === "trophies" && <TrophiesView trophies={trophies} stats={stats} />}
        </main>
      </div>

      {/* MODAL */}
      {modal && <GoalModal mode={modal.mode} goal={modal.goal} onClose={() => setModal(null)} />}

      {/* REWARD BURST */}
      {burst && (
        <div className="burst-overlay">
          <div className="burst-toast">
            <div className="burst-eyebrow">✦ GLORY ✦</div>
            <div className="burst-main">{burst.main}</div>
            <div className="burst-sub">{burst.sub}</div>
          </div>
        </div>
      )}

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor
          label="Accent" value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density" value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
