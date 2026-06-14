// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Ambitions & Glory · views
// GoalsView · OverviewView · TrophiesView (+ visualizations)
// ═══════════════════════════════════════════════════════════════════
const { useState: useStateV, useRef: useRefV, useEffect: useEffectV } = React;

const SORTS = [
  { id: "priority", label: "Priority" },
  { id: "progress", label: "Progress" },
  { id: "due",      label: "Due Date" },
  { id: "status",   label: "Status" },
];

// ── Stat card ───────────────────────────────────────────────
function StatCard({ tone, ico, label, value, suffix, sub, trend }) {
  return (
    <div className={cls("stat-card", "sc-" + tone)}>
      <div className="sc-label"><span className="sc-ico">{ico}</span>{label}</div>
      <div className="sc-value">{value}{suffix && <small>{suffix}</small>}</div>
      {sub && <div className="sc-sub">{trend && <span className={cls("sc-trend", trend < 0 && "down")}>{trend > 0 ? "▲" : "▼"} </span>}{sub}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// GOALS VIEW
// ══════════════════════════════════════════════════════════
function GoalsView({ goals, stats, filterCat, setFilterCat, filterStatus, setFilterStatus,
                     sortBy, setSortBy, expandedId, onToggleExpand, onToggleMilestone, onAction, onNew }) {
  const [sortOpen, setSortOpen] = useStateV(false);

  return (
    <div className="goals-view" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* STAT STRIP */}
      <div className="stat-strip">
        <StatCard tone="gold"   ico="◎" label="Total Goals"   value={stats.total} sub={`${stats.active} in motion`} />
        <StatCard tone="cyan"   ico="❖" label="Active"        value={stats.active} sub="being pursued now" />
        <StatCard tone="mint"   ico="✓" label="Completed"     value={stats.completed} sub={`${stats.completedThisYear} this year`} />
        <StatCard tone="violet" ico="✧" label="Trophies"      value={stats.trophies} sub={`${stats.lockedTrophies} within reach`} />
        <StatCard tone="gold"   ico="◐" label="Completion"    value={stats.completionRate} suffix="%" sub="+14 vs last month" trend={1} />
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="filter-group">
          <span className="fg-label">Realm</span>
          <button className={cls("chip", filterCat === "all" && "on")} onClick={() => setFilterCat("all")}>All</button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={cls("chip", "chip-" + c.color, "cat-" + c.color, filterCat === c.id && "on")}
              onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
            ><span className="ci">{c.ci}</span> {c.label}</button>
          ))}
        </div>
        <div className="spacer" />
        <div className="filter-group">
          <div className="seg">
            {[["all", "All"], ["in-progress", "Active"], ["not-started", "Queued"], ["completed", "Done"], ["archived", "Archived"]].map(([k, l]) => (
              <button key={k} className={cls("seg-btn", filterStatus === k && "on")} onClick={() => setFilterStatus(k)}>{l}</button>
            ))}
          </div>
          <div className={cls("sort-select", sortOpen && "open")}>
            <button className="sort-trigger" onClick={() => setSortOpen((o) => !o)}>
              ⇅ {SORTS.find((s) => s.id === sortBy).label} <span className="chev">▼</span>
            </button>
            {sortOpen && (
              <div className="sort-menu" onMouseLeave={() => setSortOpen(false)}>
                {SORTS.map((s) => (
                  <div key={s.id} className={cls("sort-option", sortBy === s.id && "selected")} onClick={() => { setSortBy(s.id); setSortOpen(false); }}>
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={onNew}><span>＋</span> New Goal</button>
        </div>
      </div>

      {/* GRID */}
      <div className="goal-grid">
        {goals.length === 0 ? (
          <div className="empty">
            <div className="empty-art">✦</div>
            <div className="empty-title">No ambitions in this realm</div>
            <div className="empty-msg">Every legend starts with a single declared intent. Forge your first ambition and the journey begins.</div>
            <button className="btn-primary" onClick={onNew}><span>＋</span> Declare an Ambition</button>
          </div>
        ) : (
          goals.map((g, i) => (
            <GoalCard
              key={g.id} goal={g} index={i}
              expanded={expandedId === g.id}
              onToggleExpand={onToggleExpand}
              onToggleMilestone={onToggleMilestone}
              onAction={onAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// OVERVIEW VIEW
// ══════════════════════════════════════════════════════════
function OverviewView({ allGoals, stats, trophies }) {
  const motiv = MOTIV_LINES[0];

  // status counts
  const order = ["not-started", "in-progress", "completed", "archived"];
  const counts = order.map((s) => ({ s, n: allGoals.filter((g) => g.status === s).length }));
  const totalForBar = counts.reduce((a, c) => a + c.n, 0) || 1;

  // upcoming deadlines (active goals, soonest first)
  const upcoming = allGoals
    .filter((g) => g.status === "in-progress" || g.status === "not-started")
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // timeline — group active+completed by target month
  const monthOrder = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const tlGoals = allGoals.filter((g) => g.status !== "archived");
  const byMonth = {};
  tlGoals.forEach((g) => {
    const m = (g.completedDate || g.targetLabel).split(" ")[0];
    (byMonth[m] = byMonth[m] || []).push(g);
  });
  const months = monthOrder.filter((m) => byMonth[m]);

  // category distribution
  const catDist = CATEGORIES.map((c) => ({
    ...c,
    n: allGoals.filter((g) => g.cat === c.id).length,
  }));
  const maxCat = Math.max(...catDist.map((c) => c.n), 1);

  return (
    <div className="overview">
      {/* MOTIVATION BANNER */}
      <div className="motiv">
        <div className="motiv-orb">✦</div>
        <div className="motiv-text">
          <div className="motiv-quote">"{motiv.quote}"</div>
          <div className="motiv-sub" dangerouslySetInnerHTML={{ __html: motiv.sub }} />
        </div>
      </div>

      {/* ROW 1 — completion ring + status breakdown */}
      <div className="ov-grid">
        {/* status breakdown */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-eyebrow">◆ Distribution</span>
            <span className="panel-title">Status Breakdown</span>
            <span className="panel-spacer" />
            <span className="panel-aux">{totalForBar} ambitions</span>
          </div>
          <div className="panel-body">
            <div className="status-bar">
              {counts.map(({ s, n }) => n > 0 && (
                <div key={s} className={cls("status-seg", "s-" + s.replace("-", ""))} style={{ flex: n }}>
                  {n}
                </div>
              ))}
            </div>
            <div className="status-legend">
              {counts.map(({ s, n }) => (
                <div key={s} className="sl-item">
                  <span className="sl-swatch" style={{ background: STATUSES[s].swatch }} />
                  <div className="sl-meta">
                    <span className="sl-name">{STATUSES[s].label}</span>
                    <span className="sl-count">{n}</span>
                  </div>
                  <span className="sl-pct">{Math.round((n / totalForBar) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* completion ring + insights */}
        <div className="panel panel-gold">
          <div className="panel-head">
            <span className="panel-eyebrow">◆ Momentum</span>
            <span className="panel-title">Completion & Streak</span>
          </div>
          <div className="panel-body">
            <div className="bigring-wrap">
              <div className="bigring cat-gold">
                <Ring value={stats.completionRate / 100} size={150} stroke={11} />
                <div className="bigring-center">
                  <div className="bigring-pct">{stats.completionRate}%</div>
                  <div className="bigring-lbl">Complete</div>
                </div>
              </div>
              <div className="bigring-info">
                <div className="bri-row">
                  <span className="bri-dot" style={{ background: "var(--mint)", color: "var(--mint)" }} />
                  <span className="bri-text"><strong>{stats.completed}</strong> conquered</span>
                  <span className="bri-num">{stats.completed}</span>
                </div>
                <div className="bri-row">
                  <span className="bri-dot" style={{ background: "var(--cyan)", color: "var(--cyan)" }} />
                  <span className="bri-text"><strong>{stats.active}</strong> in progress</span>
                  <span className="bri-num">{stats.active}</span>
                </div>
                <div className="bri-row">
                  <span className="bri-dot" style={{ background: "var(--gold)", color: "var(--gold)" }} />
                  <span className="bri-text">Avg progress</span>
                  <span className="bri-num">{stats.avgProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 — insight cards */}
      <div className="ov-grid-3">
        <div className="panel">
          <div className="panel-body">
            <div className="insight-card" style={{ background: "transparent", border: "none", padding: 0 }}>
              <div className="insight-ico" style={{ color: "var(--gold)" }}>🔥</div>
              <div className="insight-num gold">{HERO.streak} <span style={{ fontSize: 14, color: "var(--text-lo)" }}>days</span></div>
              <div className="insight-label">Current Streak</div>
              <div className="insight-sub">Best: {HERO.bestStreak} days · keep the flame</div>
              <div className="streak-week">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className={cls("sw-day", HERO.weekDots[i] && "lit", i === HERO.todayIdx && "today")}>
                    <span className="sw-glyph">{HERO.weekDots[i] ? "✦" : (i === HERO.todayIdx ? "◌" : "·")}</span>
                    <span className="sw-lbl">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="insight-card" style={{ background: "transparent", border: "none", padding: 0 }}>
              <div className="insight-ico" style={{ color: "var(--violet)" }}>✧</div>
              <div className="insight-num violet">{stats.milestonesDone}<span style={{ fontSize: 14, color: "var(--text-lo)" }}>/{stats.milestonesTotal}</span></div>
              <div className="insight-label">Milestones Cleared</div>
              <div className="insight-sub">{Math.round((stats.milestonesDone / stats.milestonesTotal) * 100)}% of all steps complete</div>
              <div style={{ marginTop: 8, height: 6, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(stats.milestonesDone / stats.milestonesTotal) * 100}%`, background: "linear-gradient(90deg, var(--violet-2), var(--violet))", boxShadow: "0 0 8px var(--violet-glow)" }} />
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="panel-eyebrow">◆ Realms</span>
            <span className="panel-title">By Category</span>
          </div>
          <div className="panel-body">
            <div className="cat-dist">
              {catDist.map((c) => (
                <div key={c.id} className={cls("cd-row", "cat-" + c.color)}>
                  <span className="cd-name"><span className="ci">{c.ci}</span>{c.label}</span>
                  <span className="cd-track"><span className="cd-fill" style={{ width: `${(c.n / maxCat) * 100}%` }} /></span>
                  <span className="cd-num">{c.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — timeline + upcoming */}
      <div className="ov-grid">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-eyebrow">◆ Roadmap</span>
            <span className="panel-title">Ambition Timeline</span>
            <span className="panel-spacer" />
            <span className="panel-aux">2026 · by target month</span>
          </div>
          <div className="panel-body">
            <div className="timeline">
              {months.map((m) => (
                <div key={m} className="tl-month">
                  <div className="tl-month-head">
                    <span className="tl-month-name">{m}</span>
                    <span className="tl-month-line" />
                    <span className="tl-month-count">{byMonth[m].length} ambition{byMonth[m].length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="tl-track">
                    {byMonth[m].map((g) => (
                      <div key={g.id} className={cls("tl-node", catClass(g.cat), g.status === "completed" && "completed")}>
                        <div className="tl-node-top">
                          <span className="tl-date">{g.completedDate || g.targetLabel}</span>
                          <span className="tl-name">{g.title}</span>
                          <span className="gc-cat">{CAT[g.cat].ci} {CAT[g.cat].label}</span>
                        </div>
                        <div className="tl-prog-row">
                          <span className="tl-prog-track"><span className="tl-prog-fill" style={{ width: `${g.progress * 100}%` }} /></span>
                          <span className="tl-prog-num">{g.status === "completed" ? "✓" : Math.round(g.progress * 100) + "%"}</span>
                          <span className="tl-days">{g.status === "completed" ? "done" : g.daysLeft + "d"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-eyebrow">◆ Imminent</span>
            <span className="panel-title">Upcoming Deadlines</span>
          </div>
          <div className="panel-body">
            <div className="deadline-list">
              {upcoming.map((g) => (
                <div key={g.id} className={cls("dl-item", catClass(g.cat))}>
                  <div className="dl-countdown">
                    <div className="dl-cd-num">{g.daysLeft}</div>
                    <div className="dl-cd-lbl">days</div>
                  </div>
                  <div className="dl-body">
                    <div className="dl-name">{g.title}</div>
                    <div className="dl-meta">
                      <span className="dl-date">{g.targetLabel}</span>
                      <span className="dl-mini-track"><span className="dl-mini-fill" style={{ width: `${g.progress * 100}%` }} /></span>
                      <span className="dl-date">{Math.round(g.progress * 100)}%</span>
                    </div>
                  </div>
                  <span className="dl-urg" style={{ opacity: g.daysLeft <= 35 ? 1 : 0.4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TROPHIES VIEW
// ══════════════════════════════════════════════════════════
function TrophiesView({ trophies, stats }) {
  const [filter, setFilter] = useStateV("all");
  const recent = trophies.filter((t) => t.recent).slice(0, 3);
  const shown = trophies.filter((t) =>
    filter === "all" ? true : filter === "unlocked" ? t.unlocked : !t.unlocked
  );
  const tierCounts = ["legendary", "gold", "silver", "bronze"].map((tier) => ({
    tier, n: trophies.filter((t) => t.tier === tier && t.unlocked).length,
  }));

  return (
    <div className="trophies-view" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* recent glory */}
      <div className="recent-glory">
        {recent.map((t) => (
          <div key={t.id} className="glory-card">
            <div className="gm">{t.icon}</div>
            <div className="glory-body">
              <div className="glory-eyebrow">✦ RECENTLY EARNED</div>
              <div className="glory-name">{t.name}</div>
              <div className="glory-meta">{t.date} · {t.reward}</div>
            </div>
          </div>
        ))}
      </div>

      {/* stat strip */}
      <div className="stat-strip">
        <StatCard tone="gold"   ico="🏆" label="Unlocked"   value={stats.trophies} suffix={`/${stats.totalTrophies}`} sub="trophies earned" />
        <StatCard tone="violet" ico="♛" label="Legendary"  value={tierCounts[0].n} sub="rarest tier" />
        <StatCard tone="mint"   ico="✧" label="In Reach"    value={stats.lockedTrophies} sub="locked & tracking" />
        <StatCard tone="cyan"   ico="◈" label="Completion"  value={Math.round((stats.trophies / stats.totalTrophies) * 100)} suffix="%" sub="of all glory" />
      </div>

      {/* filter */}
      <div className="toolbar">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <span className="section-num">★</span>
          <span className="section-title">Trophy Hall</span>
        </div>
        <div className="spacer" />
        <div className="seg">
          {[["all", "All"], ["unlocked", "Earned"], ["locked", "Locked"]].map(([k, l]) => (
            <button key={k} className={cls("seg-btn", filter === k && "on")} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="trophy-grid">
        {shown.map((t) => <Trophy key={t.id} t={t} />)}
      </div>
    </div>
  );
}

Object.assign(window, { GoalsView, OverviewView, TrophiesView, StatCard });
