// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Ambitions & Glory · shared components
// Exported to window so goals-views.jsx / goals-app.jsx can use them.
// ═══════════════════════════════════════════════════════════════════
const { useState, useRef, useEffect } = React;

const cls = (...a) => a.filter(Boolean).join(" ");
const catClass = (catId) => "cat-" + (CAT[catId] ? CAT[catId].color : "gold");

// ── Circular progress ring ─────────────────────────────────
function Ring({ value, size = 52, stroke = 5, glow = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: "stroke-dashoffset 0.8s var(--ease-out)", filter: glow ? "drop-shadow(0 0 5px currentColor)" : "none" }}
      />
    </svg>
  );
}

// ── Top bar ─────────────────────────────────────────────────
function TopBar({ query, setQuery }) {
  return (
    <header className="topbar">
      <a className="brand" href="Personal Dashboard.html" title="Back to Dashboard">
        <div className="brand-mark">A</div>
        <div className="brand-text">
          <div className="brand-name">AETHERIA</div>
          <div className="brand-tag">AMBITIONS & GLORY</div>
        </div>
      </a>
      <div className="top-search">
        <span className="search-ico">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ambitions, trophies, milestones…"
        />
        <span className="kbd">⌘ K</span>
      </div>
      <div className="top-right">
        <div className="currency-pill gems"><span className="ico">◆</span><span>{HERO.gems}</span></div>
        <div className="currency-pill coins"><span className="ico">●</span><span>{HERO.coins}</span></div>
        <div className="streak-pill"><span className="ico">✦</span><span className="txt">{HERO.streak}d streak</span></div>
        <div className="avatar-pip">{HERO.initials}</div>
      </div>
    </header>
  );
}

// ── Nav rail ────────────────────────────────────────────────
function NavRail() {
  const items = [
    { i: "◉", l: "Hub",      href: "Personal Dashboard.html" },
    { i: "❖", l: "Quests",   href: "Task Management.html" },
    { i: "⚔", l: "Raid",     href: "Boss Raid.html" },
    { i: "✷", l: "Hero",     href: "Hero Identity.html" },
    { i: "✧", l: "Glory",    href: null, active: true },
    { i: "●", l: "Vault",    href: "Reward Marketplace.html" },
    { i: "◇", l: "Atlas",    href: "Adventure Map.html" },
  ];
  return (
    <aside className="navrail">
      <div className="nav-stack">
        {items.map((it) => (
          <a key={it.l} className={cls("nav-btn", it.active && "active")} href={it.href || undefined}>
            <span className="ico">{it.i}</span>
            <span className="lbl">{it.l}</span>
          </a>
        ))}
      </div>
      <div className="nav-bottom">
        <button className="nav-btn"><span className="ico">⚙</span><span className="lbl">Forge</span></button>
      </div>
    </aside>
  );
}

// ── Goal card ───────────────────────────────────────────────
function GoalCard({ goal, expanded, onToggleExpand, onToggleMilestone, onAction, index }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = CAT[goal.cat];
  const pri = PRIORITIES[goal.priority];
  const done = goal.status === "completed";
  const msDone = goal.milestones.filter((m) => m.done).length;
  const msTotal = goal.milestones.length;
  const showMs = goal.milestones.slice(0, expanded ? goal.milestones.length : 3);
  const extra = msTotal - showMs.length;

  const dueCls = done ? "done" : goal.daysLeft <= 0 ? "" : goal.daysLeft <= 30 ? "soon" : "";

  return (
    <div
      className={cls("goal-card", catClass(goal.cat), goal.status === "completed" && "completed", goal.status === "archived" && "archived")}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {done && <div className="gc-ribbon">CONQUERED</div>}

      <div className="gc-top">
        <div className="gc-ring-wrap">
          <Ring value={goal.progress} size={52} stroke={5} />
          <div className={cls("gc-ring-num", done && "done")}>{done ? "✓" : Math.round(goal.progress * 100)}</div>
        </div>
        <div className="gc-headtext">
          <div className="gc-eyebrow-row">
            <span className={cls("gc-rank", "rank-" + goal.rank)}>{goal.rank}</span>
            <span className="gc-cat">{cat.ci} {cat.label}</span>
            {!done && goal.status !== "archived" && <span className={cls("gc-priority", pri.cls)}>{pri.label}</span>}
          </div>
          <div className="gc-title">{goal.title}</div>
        </div>
        <button className="gc-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Goal actions">⋯</button>
      </div>

      {menuOpen && (
        <div className="popmenu" onMouseLeave={() => setMenuOpen(false)}>
          <div className="popmenu-item" onClick={() => { onAction("edit", goal); setMenuOpen(false); }}><span>✎</span> Edit ambition</div>
          <div className="popmenu-item" onClick={() => { onToggleExpand(goal.id); setMenuOpen(false); }}><span>◱</span> {expanded ? "Collapse" : "Expand details"}</div>
          {goal.status !== "completed" && (
            <div className="popmenu-item" onClick={() => { onAction("complete", goal); setMenuOpen(false); }}><span>✓</span> Mark complete</div>
          )}
          <div className="popmenu-sep" />
          {goal.status === "archived"
            ? <div className="popmenu-item" onClick={() => { onAction("restore", goal); setMenuOpen(false); }}><span>↺</span> Restore</div>
            : <div className="popmenu-item" onClick={() => { onAction("archive", goal); setMenuOpen(false); }}><span>▣</span> Archive</div>}
          <div className="popmenu-item danger" onClick={() => { onAction("delete", goal); setMenuOpen(false); }}><span>🗑</span> Delete</div>
        </div>
      )}

      <div className="gc-desc">{goal.desc}</div>

      {/* MILESTONE CHECKLIST — hero element */}
      <div className="gc-milestones">
        <div className="gc-ms-head">
          <span className="gc-ms-label">Milestones</span>
          <div className="gc-ms-track"><div className="gc-ms-fill" style={{ width: `${(msDone / msTotal) * 100}%` }} /></div>
          <span className="gc-ms-count">{msDone}/{msTotal}</span>
        </div>
        {showMs.map((m) => (
          <div
            key={m.id}
            className={cls("ms-item", m.done && "done")}
            onClick={() => goal.status !== "archived" && onToggleMilestone(goal.id, m.id)}
          >
            <span className={cls("ms-check", m.done && "on")} />
            <span className="ms-text">{m.label}</span>
          </div>
        ))}
        {extra > 0 && (
          <div className="ms-more" onClick={() => onToggleExpand(goal.id)}>+ {extra} more milestone{extra > 1 ? "s" : ""}</div>
        )}
      </div>

      <div className="gc-foot">
        <span className={cls("gc-due", dueCls)}>
          <span className="ico">◷</span>
          {done ? `Done ${goal.completedDate}` : goal.status === "archived" ? "Archived" : `${goal.targetLabel} · ${goal.daysLeft}d left`}
        </span>
        <span className="gc-reward xp">{goal.xp}<small>XP</small></span>
        <span className="gc-reward coin">{goal.coins}<small>◉</small></span>
      </div>

      {expanded && (
        <div className="gc-expand">
          <div className="gcx-grid">
            <div><div className="gcx-label">Status</div><div className="gcx-value">{STATUSES[goal.status].label}</div></div>
            <div><div className="gcx-label">Rank</div><div className="gcx-value">{goal.rank} · {RANK_DESC[goal.rank]}</div></div>
            <div><div className="gcx-label">Priority</div><div className="gcx-value">{pri.label}</div></div>
            <div><div className="gcx-label">Started</div><div className="gcx-value">{goal.created}</div></div>
            <div><div className="gcx-label">Target</div><div className="gcx-value">{goal.targetLabel}</div></div>
            <div><div className="gcx-label">Reward</div><div className="gcx-value">{goal.xp} XP · {goal.coins} ◉</div></div>
          </div>
          {goal.note && (
            <div className="gcx-note">
              <div className="gcx-note-label">◆ STRATEGY</div>
              <div className="gcx-note-text">{goal.note}</div>
            </div>
          )}
          {goal.linkedTrophy && (
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--text-lo)" }}>
              ✧ Completing this unlocks the <span style={{ color: "var(--gold)" }}>{goal.linkedTrophy}</span> trophy
            </div>
          )}
          <div className="gcx-actions">
            {goal.status !== "completed" && <button className="gcx-btn primary" onClick={() => onAction("complete", goal)}>✓ Complete</button>}
            <button className="gcx-btn ghost" onClick={() => onAction("edit", goal)}>✎ Edit</button>
            {goal.status === "archived"
              ? <button className="gcx-btn ghost" onClick={() => onAction("restore", goal)}>↺ Restore</button>
              : <button className="gcx-btn ghost" onClick={() => onAction("archive", goal)}>▣ Archive</button>}
            <button className="gcx-btn danger" onClick={() => onAction("delete", goal)}>🗑 Delete</button>
          </div>
        </div>
      )}

      {!expanded && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button className="ms-more" onClick={() => onToggleExpand(goal.id)} style={{ fontStyle: "normal", letterSpacing: "0.1em" }}>
            ▾ Details
          </button>
        </div>
      )}
    </div>
  );
}

// ── Trophy / achievement card ───────────────────────────────
function Trophy({ t }) {
  const tierLabel = { bronze: "Bronze", silver: "Silver", gold: "Gold", legendary: "Legendary" }[t.tier];
  return (
    <div className={cls("trophy", t.unlocked ? "unlocked" : "locked", t.tier === "legendary" && "tier-legendary-card")}>
      <div className={cls("trophy-medal", "tier-" + t.tier)}>
        {t.unlocked ? t.icon : <span className="lock-ico">🔒</span>}
      </div>
      <div className={cls("trophy-tier-badge", "tier-" + t.tier)}>{tierLabel}</div>
      <div className="trophy-name">{t.name}</div>
      <div className="trophy-desc">{t.desc}</div>
      {t.unlocked ? (
        <div className="trophy-foot">
          <span className="trophy-date">◷ {t.date}</span>
          <span className="trophy-reward">{t.reward}</span>
        </div>
      ) : (
        <div className="trophy-progress">
          <div className="tp-label"><span>Locked</span><span>{Math.round(t.progress * 100)}%</span></div>
          <div className="tp-track"><div className="tp-fill" style={{ width: `${t.progress * 100}%` }} /></div>
          <div className="trophy-link" style={{ marginTop: 6 }}>↪ {t.linkedGoal}</div>
        </div>
      )}
    </div>
  );
}

// ── New / Edit goal modal (visual) ──────────────────────────
function GoalModal({ mode, goal, onClose }) {
  const [cat, setCat] = useState(goal ? goal.cat : "career");
  const [rank, setRank] = useState(goal ? goal.rank : "B");
  const [title, setTitle] = useState(goal ? goal.title : "");
  const reward = { S: [880, 240], A: [560, 150], B: [420, 110], C: [300, 80], D: [180, 50] }[rank];

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-glow" />
        <div className="modal-head">
          <span className="modal-eyebrow">✦ {mode === "edit" ? "REFORGE AMBITION" : "DECLARE A NEW AMBITION"} ✦</span>
          <div className="modal-title">{mode === "edit" ? "Edit Ambition" : "Forge an Ambition"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="mfield">
            <label>Ambition Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run a half marathon" autoFocus />
          </div>
          <div className="mfield">
            <label>The Vision</label>
            <textarea rows={2} defaultValue={goal ? goal.desc : ""} placeholder="What does victory look like? Describe the summit…" />
          </div>
          <div className="mfield">
            <label>Realm · Category</label>
            <div className="mcats">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={cls("chip", "chip-" + c.color, cat === c.id && "on", "cat-" + c.color)}
                  onClick={() => setCat(c.id)}
                ><span className="ci">{c.ci}</span> {c.label}</button>
              ))}
            </div>
          </div>
          <div className="mrow">
            <div className="mfield">
              <label>Difficulty Rank</label>
              <div className="mranks">
                {["S", "A", "B", "C", "D"].map((r) => (
                  <button key={r} className={cls("mrank", "rk-" + r, rank === r && "on")} onClick={() => setRank(r)}>
                    {r}<small>{RANK_DESC[r]}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="mfield small" style={{ maxWidth: 160 }}>
              <label>Target Date</label>
              <input type="text" defaultValue={goal ? goal.targetLabel : ""} placeholder="Sep 20, 2026" />
            </div>
          </div>
          <div className="mrow">
            <div className="mfield">
              <label>Priority</label>
              <div className="seg" style={{ width: "100%" }}>
                {Object.entries(PRIORITIES).map(([k, p]) => (
                  <button key={k} className={cls("seg-btn", (goal ? goal.priority : "medium") === k && "on")} style={{ flex: 1 }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div className="mfield">
              <label>First Milestone</label>
              <input placeholder="The first honest step…" />
            </div>
          </div>
          <div className="mreward">
            <div className="mreward-label">◆ BOUNTY ON COMPLETION</div>
            <div className="mreward-pills">
              <span className="reward-large xp">{reward[0]} <small>XP</small></span>
              <span className="reward-large coin">{reward[1]} <small>COINS</small></span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}><span>✦</span> {mode === "edit" ? "Save" : "Declare It"}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { cls, catClass, Ring, TopBar, NavRail, GoalCard, Trophy, GoalModal });
