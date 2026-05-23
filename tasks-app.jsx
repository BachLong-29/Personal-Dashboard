// ════════════════════════════════════════════════════════════
//  AETHERIA — QUEST LOG
//  Daily / Weekly / Monthly task management
// ════════════════════════════════════════════════════════════
const { useState, useMemo, useEffect, useRef, Fragment } = React;

// ── helpers ───────────────────────────────────────────────
const cls = (...xs) => xs.filter(Boolean).join(" ");
const fmtTime = (s) => {
  const m = Math.floor(s/60), sec = s%60;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};
const fmtEst = (mins) => {
  if (mins >= 60) {
    const h = Math.floor(mins/60), m = mins%60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
};
const catOf  = (id) => TASK_CATEGORIES.find(c => c.id === id) || TASK_CATEGORIES[0];
const priOf  = (id) => PRIORITIES[id] || PRIORITIES.medium;

// ── SHELL ─────────────────────────────────────────────────
function App() {
  const [view,       setView]       = useState("day");      // day | week | month
  const [tasks,      setTasks]      = useState(() => TASKS.map(t => ({...t})));
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [search,     setSearch]     = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDay,setSelectedDay]= useState(0);          // for week view
  const [focusMode,  setFocusMode]  = useState(false);
  const [splitMode,  setSplitMode]  = useState("week");     // week | month — right pane in day view
  const [showNew,    setShowNew]    = useState(false);
  const [xpBurst,    setXpBurst]    = useState(null);
  const [achieveToast, setAchieveToast] = useState(null);
  const [loading,    setLoading]    = useState(true);

  // Load skeleton sim
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // ── filters
  const visible = useMemo(() => {
    return tasks.filter(t => {
      if (filterCat  !== "all" && t.cat  !== filterCat) return false;
      if (filterDiff !== "all" && t.diff !== filterDiff) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.title.toLowerCase().includes(s) && !t.desc.toLowerCase().includes(s)
          && !t.tags.some(x => x.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [tasks, filterCat, filterDiff, search]);

  // ── actions
  const toggleDone = (id) => {
    setTasks(ts => ts.map(t => {
      if (t.id !== id) return t;
      const wasDone = !!t.done;
      const next = { ...t, done: !wasDone, progress: !wasDone ? 1 : (t.progress < 1 ? t.progress : 0.0) };
      if (!wasDone) {
        // celebrate
        triggerXpBurst(t.xp, t.coins);
        if (t.diff === "S") setAchieveToast({ title: "S-Rank Cleared", desc: t.title, icon: "⚡" });
      }
      return next;
    }));
  };

  const triggerXpBurst = (xp, coins) => {
    setXpBurst({ xp, coins, id: Math.random() });
    setTimeout(() => setXpBurst(null), 2400);
  };

  // Drag-and-drop: between day slots (day view)
  const dragRef = useRef(null);
  const onDragStart = (e, id) => { dragRef.current = id; e.dataTransfer.effectAllowed = "move"; };
  const onDropToSlot = (e, slot) => {
    e.preventDefault();
    const id = dragRef.current;
    if (!id) return;
    setTasks(ts => ts.map(t => t.id === id ? { ...t, slot, day: 0 } : t));
    dragRef.current = null;
  };
  const onDropToDay = (e, dayIdx) => {
    e.preventDefault();
    const id = dragRef.current;
    if (!id) return;
    setTasks(ts => ts.map(t => t.id === id ? { ...t, day: dayIdx } : t));
    dragRef.current = null;
  };

  return (
    <div className={cls("app", focusMode && "focus-mode")}>
      <TopBar
        search={search} setSearch={setSearch}
        focusMode={focusMode} setFocusMode={setFocusMode}
      />
      <div className="shell">
        <NavRail />
        <main className="main" data-screen-label="Quest Log">
          <PageHeader
            view={view} setView={setView}
            filterCat={filterCat} setFilterCat={setFilterCat}
            filterDiff={filterDiff} setFilterDiff={setFilterDiff}
            splitMode={splitMode} setSplitMode={setSplitMode}
            onNew={() => setShowNew(true)}
          />

          {view === "day"   && (
            <DayView
              tasks={visible} allTasks={tasks}
              expandedId={expandedId} setExpandedId={setExpandedId}
              toggleDone={toggleDone}
              onDragStart={onDragStart} onDropToSlot={onDropToSlot}
              splitMode={splitMode} setSplitMode={setSplitMode}
              loading={loading}
            />
          )}
          {view === "week"  && (
            <WeekView
              tasks={visible}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay}
              expandedId={expandedId} setExpandedId={setExpandedId}
              toggleDone={toggleDone}
              onDragStart={onDragStart} onDropToDay={onDropToDay}
              loading={loading}
            />
          )}
          {view === "month" && (
            <MonthView
              tasks={visible}
              expandedId={expandedId} setExpandedId={setExpandedId}
              toggleDone={toggleDone}
              loading={loading}
            />
          )}
        </main>
        <HeroRail />
      </div>

      {showNew      && <NewQuestModal onClose={() => setShowNew(false)} />}
      {xpBurst      && <XpBurst data={xpBurst} />}
      {achieveToast && <AchieveToast data={achieveToast} onDone={() => setAchieveToast(null)} />}
    </div>
  );
}

// ═══ TOPBAR ════════════════════════════════════════════════
function TopBar({ search, setSearch, focusMode, setFocusMode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">✦</div>
        <div>
          <div className="brand-name">AETHERIA</div>
          <div className="brand-tag">QUEST LOG</div>
        </div>
      </div>

      <div className="top-search">
        <span className="search-ico">⌕</span>
        <input
          placeholder="Search quests, tags, sagas…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="kbd">⌘ K</span>
      </div>

      <div className="top-right">
        <button className={cls("focus-pill", focusMode && "on")} onClick={() => setFocusMode(f => !f)}>
          <span className="ico">◎</span> Focus { focusMode ? "ON" : "OFF" }
        </button>
        <div className="currency-pill gems">
          <span className="ico">◆</span><span>{HERO.gems}</span>
        </div>
        <div className="currency-pill coins">
          <span className="ico">●</span><span>{HERO.coins}</span>
        </div>
        <div className="streak-pill">
          <span className="ico">✦</span><span>{HERO.streak}d streak</span>
        </div>
        <div className="avatar-pip">AS</div>
      </div>
    </header>
  );
}

// ═══ NAV RAIL ══════════════════════════════════════════════
function NavRail() {
  const items = [
    { i:"◉", l:"Hub",          k:"hub" },
    { i:"❖", l:"Quest Log",    k:"quests", active: true },
    { i:"⚔", l:"Trials",       k:"trials" },
    { i:"✷", l:"Guild",        k:"guild" },
    { i:"✧", l:"Achievements", k:"ach" },
    { i:"●", l:"Treasury",     k:"shop" },
    { i:"◇", l:"Codex",        k:"codex" },
  ];
  return (
    <aside className="navrail">
      <div className="nav-stack">
        {items.map(it => (
          <button key={it.k} className={cls("nav-btn", it.active && "active")}>
            <span className="ico">{it.i}</span>
            <span className="lbl">{it.l}</span>
          </button>
        ))}
      </div>
      <div className="nav-bottom">
        <button className="nav-btn">
          <span className="ico">⚙</span><span className="lbl">Forge</span>
        </button>
      </div>
    </aside>
  );
}

// ═══ PAGE HEADER ═══════════════════════════════════════════
function PageHeader({ view, setView, filterCat, setFilterCat, filterDiff, setFilterDiff, splitMode, setSplitMode, onNew }) {
  return (
    <div className="page-header">
      <div className="ph-left">
        <div className="ph-tag">✦ &nbsp; CHRONICLE · MAY 2026 &nbsp; ✦</div>
        <h1 className="ph-title">Quest Log</h1>
        <p className="ph-desc">
          {HERO.completedToday} of {HERO.totalToday} cleared today · {HERO.completedWeek} of {HERO.totalWeek} this week · combo
          <span className="combo">×{HERO.comboMultiplier}</span>
          active until midnight.
        </p>
      </div>

      <div className="ph-right">
        <div className="view-switch">
          {["day","week","month"].map(v => (
            <button
              key={v}
              className={cls("vs-btn", view === v && "active")}
              onClick={() => setView(v)}
            >
              {v === "day" && "◐"}
              {v === "week" && "◧"}
              {v === "month" && "▦"}
              <span>{v.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onNew}>
          <span>＋</span> Forge Quest
        </button>
      </div>

      <div className="ph-filters">
        <div className="filter-group">
          <span className="fg-label">Realm</span>
          <button
            className={cls("chip", filterCat === "all" && "on")}
            onClick={() => setFilterCat("all")}
          >All</button>
          {TASK_CATEGORIES.map(c => (
            <button
              key={c.id}
              className={cls("chip", `chip-${c.color}`, filterCat === c.id && "on")}
              onClick={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
            >
              <span className="ci">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="fg-label">Rank</span>
          <button
            className={cls("chip rank-chip", filterDiff === "all" && "on")}
            onClick={() => setFilterDiff("all")}
          >Any</button>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              className={cls("chip rank-chip", `rk-${d}`, filterDiff === d && "on")}
              onClick={() => setFilterDiff(filterDiff === d ? "all" : d)}
            >{d}</button>
          ))}
        </div>
        {view === "day" && (
          <div className="filter-group right-align">
            <span className="fg-label">Side panel</span>
            <div className="seg">
              <button className={cls("seg-btn", splitMode === "week" && "on")}
                onClick={() => setSplitMode("week")}>Week</button>
              <button className={cls("seg-btn", splitMode === "month" && "on")}
                onClick={() => setSplitMode("month")}>Month</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ DAY VIEW ══════════════════════════════════════════════
const SLOTS = [
  { id:"morning",   label:"Dawn",      time:"06–10",  glyph:"◐" },
  { id:"deep",      label:"Deep Work", time:"10–13",  glyph:"❖" },
  { id:"afternoon", label:"Afternoon", time:"13–17",  glyph:"☉" },
  { id:"evening",   label:"Twilight",  time:"17–22",  glyph:"☾" },
];

function DayView({ tasks, allTasks, expandedId, setExpandedId, toggleDone, onDragStart, onDropToSlot, splitMode, loading }) {
  const today = tasks.filter(t => t.day === 0);
  const bySlot = SLOTS.map(s => ({ ...s, items: today.filter(t => t.slot === s.id) }));

  return (
    <div className="day-view">
      {/* LEFT — primary daily ledger */}
      <section className="day-main panel">
        <div className="panel-head">
          <span className="panel-eyebrow">CHAPTER I</span>
          <h2 className="panel-title">Today · Monday, May 18</h2>
          <div className="panel-spacer" />
          <div className="day-stats">
            <DayProgress done={today.filter(t=>t.done).length} total={today.length} />
          </div>
        </div>

        <div className="timeline-rail">
          <ActiveBlock />
        </div>

        <div className="slot-stack" data-screen-label="Day Slots">
          {loading ? <SkeletonTasks /> :
            bySlot.map(slot => (
              <SlotColumn
                key={slot.id}
                slot={slot}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                toggleDone={toggleDone}
                onDragStart={onDragStart}
                onDropToSlot={onDropToSlot}
              />
            ))
          }
        </div>
      </section>

      {/* RIGHT — split-view */}
      <section className="day-side">
        {splitMode === "week"
          ? <WeekPeek tasks={tasks} toggleDone={toggleDone} />
          : <MonthPeek tasks={tasks} />
        }
        <ScheduleStrip />
      </section>
    </div>
  );
}

function DayProgress({ done, total }) {
  const pct = total ? Math.round((done/total)*100) : 0;
  return (
    <div className="day-progress">
      <div className="dp-num"><strong>{done}</strong><span>/ {total}</span></div>
      <div className="dp-bar"><div className="dp-fill" style={{ width: `${pct}%` }} /></div>
      <div className="dp-pct">{pct}%</div>
    </div>
  );
}

function ActiveBlock() {
  return (
    <div className="active-block">
      <div className="ab-pulse" />
      <div className="ab-time">
        <div className="ab-now">NOW · 09:42</div>
        <div className="ab-fin">ends 11:00</div>
      </div>
      <div className="ab-info">
        <div className="ab-tag">▶ DEEP WORK · DUNGEON</div>
        <div className="ab-title">Deep Work — Solo Dungeon</div>
        <div className="ab-sub">38m remaining · Streak +6 · XP gain at clear: +180</div>
      </div>
      <div className="ab-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" stroke="rgba(80,80,120,0.35)" strokeWidth="4" fill="none" />
          <circle cx="32" cy="32" r="26" stroke="url(#abGrad)" strokeWidth="4" fill="none"
            strokeDasharray="163.4" strokeDashoffset="49"
            strokeLinecap="round" transform="rotate(-90 32 32)" />
          <defs>
            <linearGradient id="abGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.22 295)" />
              <stop offset="100%" stopColor="oklch(0.78 0.16 82)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="ab-ring-num">70%</div>
      </div>
    </div>
  );
}

function SlotColumn({ slot, expandedId, setExpandedId, toggleDone, onDragStart, onDropToSlot }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cls("slot", over && "over")}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDropToSlot(e, slot.id); }}
    >
      <div className="slot-head">
        <span className="slot-glyph">{slot.glyph}</span>
        <span className="slot-label">{slot.label}</span>
        <span className="slot-time">{slot.time}</span>
        <span className="slot-count">{slot.items.length}</span>
      </div>
      {slot.items.length === 0
        ? <EmptySlot />
        : slot.items.map(t => (
            <QuestCard
              key={t.id} task={t}
              expanded={expandedId === t.id}
              onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onToggleDone={() => toggleDone(t.id)}
              onDragStart={onDragStart}
            />
          ))
      }
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="empty-slot">
      <div className="es-orb">+</div>
      <div className="es-text">Drag a quest here, or forge a new one.</div>
    </div>
  );
}

// ═══ QUEST CARD ════════════════════════════════════════════
function QuestCard({ task, expanded, onExpand, onToggleDone, onDragStart, compact }) {
  const c = catOf(task.cat), p = priOf(task.priority);
  return (
    <article
      className={cls(
        "quest-card",
        `cat-${c.color}`,
        task.done && "done",
        expanded && "expanded",
        task.saga && "saga",
        compact && "compact"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      data-comment-anchor={`quest-${task.id}`}
    >
      <div className="qc-left">
        <button
          className={cls("qc-check", task.done && "on")}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          aria-label="Mark complete"
        >{task.done ? "✓" : ""}</button>
        <div className={cls("qc-diff", `diff-${task.diff}`)}>{task.diff}</div>
      </div>

      <div className="qc-body" onClick={onExpand}>
        <div className="qc-row">
          <div className="qc-title">{task.title}</div>
          <div className={cls("qc-priority", `pri-${p.color}`)}>
            <span className="pp">{p.token}</span>
            <span className="pl">{p.label}</span>
          </div>
        </div>
        <div className="qc-desc">{task.desc}</div>

        <div className="qc-meta-row">
          <span className={cls("qc-cat", `cat-pill-${c.color}`)}>
            <span className="ci">{c.icon}</span>{c.label}
          </span>
          <span className="qc-est">⏲ {fmtEst(task.est)}</span>
          <span className={cls("qc-deadline", `due-${task.deadlineUrgency}`)}>
            ◷ {task.deadline}
          </span>
          {task.streak > 0 && (
            <span className="qc-streak">✦ {task.streak}d</span>
          )}
          {task.combo > 0 && (
            <span className="qc-combo">×{task.combo} combo</span>
          )}
        </div>

        {task.subtasks > 0 && (
          <div className="qc-subprog">
            <div className="qc-sub-track">
              <div className="qc-sub-fill"
                style={{ width: `${(task.subtasksDone / task.subtasks) * 100}%` }} />
            </div>
            <span className="qc-sub-num">{task.subtasksDone}/{task.subtasks}</span>
          </div>
        )}

        <div className="qc-tags">
          {task.tags.map(t => <span key={t} className="qc-tag">#{t}</span>)}
        </div>
      </div>

      <div className="qc-right">
        <div className="qc-reward xp">+{task.xp} <span>XP</span></div>
        <div className="qc-reward coin">+{task.coins} <span>◎</span></div>
        <button className="qc-more" aria-label="more">⋯</button>
      </div>

      {expanded && (
        <div className="qc-expanded">
          <div className="qcx-grid">
            <Detail label="Realm"        value={`${c.icon} ${c.label}`} />
            <Detail label="Rank"         value={task.diff} />
            <Detail label="Priority"     value={p.label} />
            <Detail label="Estimated"    value={fmtEst(task.est)} />
            <Detail label="Deadline"     value={task.deadline} />
            <Detail label="Streak"       value={task.streak > 0 ? `${task.streak} days` : "—"} />
            <Detail label="Combo Mult."  value={task.combo > 0 ? `×${task.combo}` : "—"} />
            <Detail label="Reward"       value={`${task.xp} XP · ${task.coins} ◎`} />
          </div>
          {task.expandedNote && (
            <div className="qcx-note">
              <div className="qcx-note-label">SAGE'S NOTE</div>
              <div className="qcx-note-text">{task.expandedNote}</div>
            </div>
          )}
          <div className="qcx-progress">
            <div className="qcx-progress-label">
              <span>Progress</span>
              <span>{Math.round((task.progress || 0) * 100)}%</span>
            </div>
            <div className="qcx-progress-bar">
              <div className="qcx-progress-fill" style={{ width: `${(task.progress || 0) * 100}%` }} />
            </div>
          </div>
          <div className="qcx-actions">
            <button className="qcx-btn primary">▶ Begin Quest</button>
            <button className="qcx-btn ghost">✎ Edit</button>
            <button className="qcx-btn ghost">⤴ Reschedule</button>
            <button className="qcx-btn danger">✕ Abandon</button>
          </div>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}

// ═══ WEEK PEEK (right side of Day view) ═════════════════════
function WeekPeek({ tasks, toggleDone }) {
  return (
    <div className="panel side-panel">
      <div className="panel-head">
        <span className="panel-eyebrow">PARCHMENT</span>
        <h3 className="panel-title">This Week</h3>
      </div>
      <div className="weekpeek-stack">
        {WEEK_DAYS.map(d => {
          const ts = tasks.filter(t => t.day === d.idx);
          const done = ts.filter(t => t.done).length;
          return (
            <div key={d.idx} className={cls("wp-day", d.today && "today")}>
              <div className="wp-rail">
                <div className="wp-short">{d.short}</div>
                <div className="wp-num">{18 + d.idx}</div>
              </div>
              <div className="wp-content">
                <div className="wp-meta">
                  <span className="wp-count">{ts.length} quests</span>
                  {ts.length > 0 && <span className="wp-done">{done}/{ts.length}</span>}
                  {d.today && <span className="wp-today">TODAY</span>}
                </div>
                <div className="wp-tasks">
                  {ts.slice(0, 3).map(t => (
                    <div key={t.id} className={cls("wp-task", `cat-dot-${catOf(t.cat).color}`, t.done && "done")}>
                      <span className="wp-task-dot" />
                      <span className="wp-task-title">{t.title}</span>
                      <span className={cls("wp-task-diff", `diff-${t.diff}`)}>{t.diff}</span>
                    </div>
                  ))}
                  {ts.length > 3 && <div className="wp-more">+ {ts.length - 3} more…</div>}
                  {ts.length === 0 && <div className="wp-empty">— no quests —</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ MONTH PEEK (right side of Day view) ════════════════════
function MonthPeek({ tasks }) {
  // Build heat dots for a 6-week grid centered on May 18
  const grid = useMemo(() => {
    const arr = [];
    const { firstWeekday, daysInMonth, todayDate } = MONTH_META;
    // include leading blanks
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      // map quests to date — simple mod
      const offset = d - todayDate;
      const ts = tasks.filter(t => t.day === offset || (t.day >= 7 && offset >= 7 && offset === t.day));
      arr.push({ date: d, count: ts.length, today: d === todayDate, isPast: d < todayDate });
    }
    // trailing
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [tasks]);

  return (
    <div className="panel side-panel">
      <div className="panel-head">
        <span className="panel-eyebrow">CARTOGRAPHER</span>
        <h3 className="panel-title">May 2026</h3>
        <div className="panel-spacer" />
        <div className="month-nav">
          <button className="btn-icon-mini">◂</button>
          <button className="btn-icon-mini">▸</button>
        </div>
      </div>
      <div className="monthpeek-grid">
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} className="mp-dow">{d}</div>
        ))}
        {grid.map((cell, i) => (
          <div key={i} className={cls("mp-cell",
              !cell && "muted",
              cell?.today && "today",
              cell?.isPast && "past"
            )}>
            {cell && (
              <>
                <span className="mp-num">{cell.date}</span>
                {cell.count > 0 && <span className={cls("mp-pip", `pip-${Math.min(cell.count,4)}`)} />}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mp-legend">
        <span className="mp-leg-dot pip-1" /><span>1</span>
        <span className="mp-leg-dot pip-2" /><span>2</span>
        <span className="mp-leg-dot pip-3" /><span>3</span>
        <span className="mp-leg-dot pip-4" /><span>4+</span>
      </div>
    </div>
  );
}

// ═══ TODAY'S SCHEDULE STRIP ════════════════════════════════
function ScheduleStrip() {
  return (
    <div className="panel side-panel timeline-panel">
      <div className="panel-head">
        <span className="panel-eyebrow">HOURGLASS</span>
        <h3 className="panel-title">Today's Path</h3>
        <div className="panel-spacer" />
        <span className="panel-aux">38m → next</span>
      </div>
      <div className="schedule-list">
        {TODAY_SCHEDULE.map((s, i) => (
          <div key={i} className={cls("sched-row", s.done && "done", s.active && "active")}>
            <div className="sched-time">
              <div className="st-start">{s.time}</div>
              <div className="st-end">{s.endTime}</div>
            </div>
            <div className="sched-spine">
              <div className={cls("sched-dot", s.done && "done", s.active && "active")} />
              {i < TODAY_SCHEDULE.length - 1 && <div className="sched-line" />}
            </div>
            <div className="sched-info">
              <div className="sched-label">{s.label}</div>
              <div className="sched-tag">
                {s.active && <span className="now-tag">▶ NOW</span>}
                {s.done && <span className="done-tag">✓ done</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ WEEK VIEW ═════════════════════════════════════════════
function WeekView({ tasks, selectedDay, setSelectedDay, expandedId, setExpandedId, toggleDone, onDragStart, onDropToDay, loading }) {
  return (
    <section className="week-view">
      <div className="wv-stats panel">
        <WeekStats tasks={tasks} />
      </div>
      <div className="wv-board" data-screen-label="Week Board">
        {WEEK_DAYS.map(d => {
          const ts = tasks.filter(t => t.day === d.idx);
          const done = ts.filter(t => t.done).length;
          const pct = ts.length ? Math.round((done/ts.length)*100) : 0;
          return (
            <WeekColumn
              key={d.idx}
              day={d}
              tasks={ts}
              done={done}
              pct={pct}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              toggleDone={toggleDone}
              onDragStart={onDragStart}
              onDropToDay={onDropToDay}
              loading={loading}
            />
          );
        })}
      </div>
    </section>
  );
}

function WeekColumn({ day, tasks, done, pct, expandedId, setExpandedId, toggleDone, onDragStart, onDropToDay, loading }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cls("wv-col panel", day.today && "today", over && "over")}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDropToDay(e, day.idx); }}
    >
      <div className="wv-col-head">
        <div className="wv-day-info">
          <span className="wv-short">{day.short}</span>
          <span className="wv-date">{day.date}</span>
          {day.today && <span className="wv-today-pill">TODAY</span>}
        </div>
        <div className="wv-progress">
          <div className="wv-prog-bar">
            <div className="wv-prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="wv-prog-num">{done}/{tasks.length}</span>
        </div>
      </div>
      <div className="wv-stack">
        {loading ? <SkeletonTasks small /> : tasks.length === 0 ? (
          <div className="wv-empty">
            <div className="wv-empty-orb">＋</div>
            <div className="wv-empty-text">No quests</div>
          </div>
        ) : tasks.map(t => (
          <QuestCardMini
            key={t.id} task={t}
            expanded={expandedId === t.id}
            onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
            onToggleDone={() => toggleDone(t.id)}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

function QuestCardMini({ task, expanded, onExpand, onToggleDone, onDragStart }) {
  const c = catOf(task.cat), p = priOf(task.priority);
  return (
    <article
      className={cls("qcm", `cat-${c.color}`, task.done && "done", task.saga && "saga", expanded && "expanded")}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <div className="qcm-top">
        <button
          className={cls("qcm-check", task.done && "on")}
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
        >{task.done ? "✓" : ""}</button>
        <span className={cls("qcm-diff", `diff-${task.diff}`)}>{task.diff}</span>
        <span className={cls("qcm-pri", `pri-${p.color}`)} title={p.label}>{p.token}</span>
      </div>
      <div className="qcm-title" onClick={onExpand}>{task.title}</div>
      <div className="qcm-rewards">
        <span className="qcm-xp">+{task.xp}<small>XP</small></span>
        <span className="qcm-coin">+{task.coins}<small>◎</small></span>
      </div>
      {task.subtasks > 0 && (
        <div className="qcm-subprog">
          <div className="qcm-track"><div className="qcm-fill" style={{ width: `${(task.subtasksDone/task.subtasks)*100}%` }} /></div>
          <span className="qcm-num">{task.subtasksDone}/{task.subtasks}</span>
        </div>
      )}
      <div className="qcm-foot">
        <span className={cls("qcm-cat", `cat-pill-${c.color}`)}>{c.icon} {c.label}</span>
        <span className="qcm-est">{fmtEst(task.est)}</span>
      </div>
      {expanded && (
        <div className="qcm-expand">
          <p>{task.desc}</p>
          <div className="qcm-expand-actions">
            <button className="qcx-btn primary">▶ Start</button>
            <button className="qcx-btn ghost">✎</button>
          </div>
        </div>
      )}
    </article>
  );
}

function WeekStats({ tasks }) {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const xp = tasks.filter(t => t.done).reduce((a,b) => a + b.xp, 0);
  const stats = [
    { label: "Quests Cleared", value: `${done}/${total}`, color: "gold" },
    { label: "XP Earned",      value: `+${xp}`,           color: "violet" },
    { label: "Combo",          value: `×${HERO.comboMultiplier}`, color: "cyan", sub: "active" },
    { label: "Streak",         value: `${HERO.streak}d`,  color: "rose", sub: `best ${HERO.bestStreak}d` },
    { label: "Focus Hours",    value: "16.5h",            color: "mint", sub: "this week" },
  ];
  return (
    <div className="week-stats">
      {stats.map(s => (
        <div key={s.label} className={cls("ws-card", `ws-${s.color}`)}>
          <div className="ws-label">{s.label}</div>
          <div className="ws-value">{s.value}</div>
          {s.sub && <div className="ws-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══ MONTH VIEW ════════════════════════════════════════════
function MonthView({ tasks, expandedId, setExpandedId, toggleDone, loading }) {
  const { firstWeekday, daysInMonth, todayDate, monthName, year } = MONTH_META;
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const offset = d - todayDate;
      const ts = tasks.filter(t => {
        if (offset >= 0 && offset <= 6) return t.day === offset;
        // monthly/later quests
        return t.day === offset;
      });
      arr.push({ date: d, tasks: ts, today: d === todayDate });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [tasks]);

  const monthQuests = tasks.filter(t => t.day >= 7 || (t.day >= 0 && t.day <= 6));
  const sagas = tasks.filter(t => t.saga);

  return (
    <section className="month-view">
      <div className="mv-toolbar panel">
        <div className="mv-title-block">
          <span className="mv-eyebrow">CARTOGRAPHER'S ATLAS</span>
          <div className="mv-title">{monthName} <span>{year}</span></div>
        </div>
        <div className="mv-month-stats">
          <div className="mv-stat">
            <div className="mv-stat-num">{monthQuests.length}</div>
            <div className="mv-stat-lbl">Quests Logged</div>
          </div>
          <div className="mv-stat">
            <div className="mv-stat-num">{sagas.length}</div>
            <div className="mv-stat-lbl">Active Sagas</div>
          </div>
          <div className="mv-stat">
            <div className="mv-stat-num">62%</div>
            <div className="mv-stat-lbl">Month Cleared</div>
          </div>
        </div>
        <div className="mv-nav">
          <button className="btn-icon">◂</button>
          <button className="btn-secondary">Today</button>
          <button className="btn-icon">▸</button>
        </div>
      </div>

      <div className="mv-body">
        <div className="mv-grid panel" data-screen-label="Month Grid">
          <div className="mv-dow-row">
            {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
              <div key={d} className="mv-dow">{d}</div>
            ))}
          </div>
          <div className="mv-cells">
            {cells.map((cell, i) => (
              <MonthCell key={i} cell={cell} />
            ))}
          </div>
        </div>

        <SagaPanel sagas={sagas} />
      </div>
    </section>
  );
}

function MonthCell({ cell }) {
  if (!cell) return <div className="mv-cell muted" />;
  const overflow = cell.tasks.length - 3;
  return (
    <div className={cls("mv-cell", cell.today && "today")}>
      <div className="mv-cell-head">
        <span className="mv-cell-num">{cell.date}</span>
        {cell.today && <span className="mv-cell-today">TODAY</span>}
      </div>
      <div className="mv-cell-tasks">
        {cell.tasks.slice(0, 3).map(t => {
          const c = catOf(t.cat);
          return (
            <div key={t.id} className={cls("mv-pill", `cat-pill-${c.color}`, t.done && "done", t.saga && "saga")}>
              <span className={cls("mv-pill-rank", `diff-${t.diff}`)}>{t.diff}</span>
              <span className="mv-pill-title">{t.title}</span>
            </div>
          );
        })}
        {overflow > 0 && <div className="mv-overflow">+ {overflow} more</div>}
      </div>
    </div>
  );
}

function SagaPanel({ sagas }) {
  return (
    <div className="saga-panel panel">
      <div className="panel-head">
        <span className="panel-eyebrow">BOUND SAGAS</span>
        <h3 className="panel-title">Active Quest Lines</h3>
      </div>
      <div className="saga-list">
        {sagas.map(s => (
          <div key={s.id} className="saga-card">
            <div className="saga-glyph">⌬</div>
            <div className="saga-info">
              <div className="saga-title">{s.title}</div>
              <div className="saga-desc">{s.desc}</div>
              <div className="saga-meta">
                <span>{s.subtasksDone}/{s.subtasks} chapters</span>
                <span>{s.deadline}</span>
                <span className="saga-xp">+{s.xp} XP</span>
              </div>
              <div className="saga-bar">
                <div className="saga-bar-fill" style={{ width: `${s.progress * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
        <ActivityFeed />
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="activity-feed">
      <div className="af-head">RECENT ECHOES</div>
      <ul className="af-list">
        {ACTIVITY.map((a, i) => (
          <li key={i} className={cls("af-row", `kind-${a.kind}`)}>
            <span className="af-glyph">{a.icon}</span>
            <span className="af-text">{a.text}</span>
            <span className="af-ts">{a.ts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══ HERO RAIL (right column) ══════════════════════════════
function HeroRail() {
  const xpPct = (HERO.xp / HERO.xpNext) * 100;
  const weekPct = (HERO.weeklyXp / HERO.weeklyXpGoal) * 100;
  const todayPct = (HERO.todayXp / HERO.todayXpGoal) * 100;

  return (
    <aside className="herorail">
      <div className="hero-card panel panel-gold">
        <div className="hero-portrait">
          <div className="hp-ring">
            <div className="hp-inner">
              <span className="hp-mark">A</span>
            </div>
          </div>
          <div className="hp-rank">S</div>
        </div>
        <div className="hero-name">{HERO.name}</div>
        <div className="hero-title">{HERO.title}</div>

        <div className="hero-xpbar">
          <div className="hero-xp-meta">
            <span>XP</span>
            <span>{HERO.xp} / {HERO.xpNext}</span>
          </div>
          <div className="hero-xp-track">
            <div className="hero-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="hero-counts">
          <div className="hc-item"><span className="hc-num">{HERO.level}</span><span className="hc-lbl">Level</span></div>
          <div className="hc-div" />
          <div className="hc-item"><span className="hc-num">{HERO.streak}</span><span className="hc-lbl">Streak</span></div>
          <div className="hc-div" />
          <div className="hc-item"><span className="hc-num">{HERO.totalWeek}</span><span className="hc-lbl">Quests</span></div>
        </div>
      </div>

      <div className="panel goals-panel">
        <div className="panel-head">
          <span className="panel-eyebrow">PACT</span>
          <h3 className="panel-title">Daily Pact</h3>
        </div>
        <div className="goal-row">
          <div className="gr-meta">
            <span className="gr-label">Today's XP</span>
            <span className="gr-val">{HERO.todayXp}<small>/ {HERO.todayXpGoal}</small></span>
          </div>
          <div className="gr-bar"><div className="gr-fill violet" style={{ width: `${todayPct}%` }} /></div>
        </div>
        <div className="goal-row">
          <div className="gr-meta">
            <span className="gr-label">Weekly Arc</span>
            <span className="gr-val">{HERO.weeklyXp}<small>/ {HERO.weeklyXpGoal}</small></span>
          </div>
          <div className="gr-bar"><div className="gr-fill gold" style={{ width: `${weekPct}%` }} /></div>
        </div>
        <div className="goal-row">
          <div className="gr-meta">
            <span className="gr-label">Quests Cleared</span>
            <span className="gr-val">{HERO.completedToday}<small>/ {HERO.totalToday}</small></span>
          </div>
          <div className="gr-bar"><div className="gr-fill cyan" style={{ width: `${(HERO.completedToday/HERO.totalToday)*100}%` }} /></div>
        </div>
      </div>

      <FocusTimer />

      <div className="panel streak-panel">
        <div className="panel-head">
          <span className="panel-eyebrow">EMBER</span>
          <h3 className="panel-title">Streak</h3>
        </div>
        <div className="streak-flame">✦</div>
        <div className="streak-num">{HERO.streak}<span>days</span></div>
        <div className="streak-week">
          {WEEK_DAYS.map((d,i) => (
            <div key={i} className={cls("sw-day", i < 5 && "lit", i === 5 && "today", i > 5 && "future")}>
              <span className="sw-glyph">{i < 5 ? "✦" : i === 5 ? "◉" : "·"}</span>
              <span className="sw-lbl">{d.short.charAt(0)}</span>
            </div>
          ))}
        </div>
        <div className="streak-msg">2 days to <strong>14-day rite</strong> — Unlock <em>Iron Discipline</em></div>
      </div>
    </aside>
  );
}

function FocusTimer() {
  const [remaining, setRemaining] = useState(HERO.focusRemaining);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const pct = 1 - (remaining / HERO.focusTotal);
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - pct);
  return (
    <div className="panel focus-card">
      <div className="panel-head">
        <span className="panel-eyebrow">SIGIL</span>
        <h3 className="panel-title">Focus Trial</h3>
        <div className="panel-spacer" />
        <span className="focus-active">{running ? "● live" : "paused"}</span>
      </div>
      <div className="focus-body">
        <div className="focus-ring">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" stroke="rgba(60,60,90,0.4)" strokeWidth="4" fill="none" />
            <circle cx="50" cy="50" r="38" stroke="url(#focusGrad)" strokeWidth="4" fill="none"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" transform="rotate(-90 50 50)" />
            <defs>
              <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.66 0.22 295)" />
                <stop offset="100%" stopColor="oklch(0.78 0.16 82)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="focus-time">{fmtTime(remaining)}</div>
          <div className="focus-sub">until clear</div>
        </div>
        <div className="focus-quest">Deep Work — Solo Dungeon</div>
        <div className="focus-controls">
          <button className="fc-btn primary" onClick={() => setRunning(r => !r)}>
            {running ? "❚❚ Pause" : "▶ Resume"}
          </button>
          <button className="fc-btn ghost" onClick={() => setRemaining(HERO.focusTotal)}>↺</button>
        </div>
      </div>
    </div>
  );
}

// ═══ SKELETONS / EMPTY ═════════════════════════════════════
function SkeletonTasks({ small }) {
  const n = small ? 2 : 3;
  return (
    <div className="skel-stack">
      {Array.from({ length: n }).map((_,i) => (
        <div key={i} className={cls("skel-card", small && "small")}>
          <div className="skel-row">
            <div className="skel-circle" />
            <div className="skel-flex">
              <div className="skel-line w60" />
              <div className="skel-line w40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ NEW QUEST MODAL ═══════════════════════════════════════
function NewQuestModal({ onClose }) {
  const [diff, setDiff] = useState("B");
  const [cat, setCat] = useState("focus");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="new-quest-modal" onClick={e => e.stopPropagation()}>
        <div className="nqm-glow" />
        <div className="nqm-head">
          <span className="nqm-eyebrow">✦ FORGE A NEW QUEST ✦</span>
          <h2 className="nqm-title">Inscribe Quest</h2>
        </div>
        <div className="nqm-body">
          <div className="nqm-field">
            <label>Quest Title</label>
            <input type="text" placeholder="e.g. Plot the Solveig Codex" autoFocus />
          </div>
          <div className="nqm-field">
            <label>Description</label>
            <textarea rows="2" placeholder="What does completion look like?" />
          </div>
          <div className="nqm-row">
            <div className="nqm-field">
              <label>Realm</label>
              <div className="nqm-cats">
                {TASK_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={cls("chip", `chip-${c.color}`, cat === c.id && "on")}
                    onClick={() => setCat(c.id)}
                  >
                    <span className="ci">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="nqm-row">
            <div className="nqm-field">
              <label>Difficulty Rank</label>
              <div className="nqm-diffs">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    className={cls("nqm-diff", `diff-${d}`, diff === d && "on")}
                    onClick={() => setDiff(d)}
                  >
                    {d}
                    <small>{diff===d && {S:"+280", A:"+180", B:"+100", C:"+60", D:"+40"}[d] + " XP"}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="nqm-field small">
              <label>Estimated</label>
              <input type="text" defaultValue="45m" />
            </div>
            <div className="nqm-field small">
              <label>Deadline</label>
              <input type="text" defaultValue="Today · 18:00" />
            </div>
          </div>
          <div className="nqm-reward">
            <div className="nqm-reward-label">Predicted Reward</div>
            <div className="nqm-reward-pills">
              <span className="reward-large xp">+ {diff==="S"?280:diff==="A"?180:diff==="B"?100:diff==="C"?60:40} <small>XP</small></span>
              <span className="reward-large coin">+ {diff==="S"?72:diff==="A"?48:diff==="B"?28:diff==="C"?16:10} <small>◎</small></span>
              <span className="reward-large combo">× {HERO.comboMultiplier}<small>combo</small></span>
            </div>
          </div>
        </div>
        <div className="nqm-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Inscribe Quest ✦</button>
        </div>
      </div>
    </div>
  );
}

// ═══ XP BURST ══════════════════════════════════════════════
function XpBurst({ data }) {
  return (
    <div className="xp-burst-overlay">
      <div className="xpb-toast">
        <div className="xpb-glow" />
        <div className="xpb-content">
          <div className="xpb-eyebrow">QUEST CLEARED</div>
          <div className="xpb-rewards">
            <span className="xpb-xp">+{data.xp} XP</span>
            <span className="xpb-sep">·</span>
            <span className="xpb-coin">+{data.coins} ◎</span>
          </div>
          <div className="xpb-combo">combo × {HERO.comboMultiplier} applied</div>
        </div>
        <div className="xpb-particles">
          {Array.from({ length: 12 }).map((_,i) => (
            <span key={i} className="xpb-p" style={{
              "--a": `${(i/12)*360}deg`,
              "--d": `${60 + (i%3)*20}px`,
              "--del": `${i*30}ms`
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchieveToast({ data, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="achieve-toast">
      <div className="at-medal">{data.icon}</div>
      <div className="at-content">
        <div className="at-eyebrow">ACHIEVEMENT UNLOCKED</div>
        <div className="at-title">{data.title}</div>
        <div className="at-desc">{data.desc}</div>
      </div>
      <div className="at-shine" />
    </div>
  );
}

// ── MOUNT
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
