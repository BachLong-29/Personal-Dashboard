// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Goal Bingo · board + cells + shared chrome
// Defines: cls, Ring, TopBar, NavRail, BingoCell, BingoBoard.
// ═══════════════════════════════════════════════════════════════════
const { useState: bState, useRef: bRef } = React;

const cls = (...a) => a.filter(Boolean).join(" ");
const catClass = (catId) => "cat-" + (window.CAT && CAT[catId] ? CAT[catId].color : "gold");

// ── Circular progress ring ──────────────────────────────────
function Ring({ value, size = 60, stroke = 5, glow = true }) {
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
          <div className="brand-tag">GOAL BINGO</div>
        </div>
      </a>
      <div className="top-search">
        <span className="search-ico">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the board for an ambition…"
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
    { i: "◉", l: "Hub",    href: "Personal Dashboard.html" },
    { i: "❖", l: "Quests", href: "Task Management.html" },
    { i: "⚔", l: "Raid",   href: "Boss Raid.html" },
    { i: "✷", l: "Hero",   href: "Hero Identity.html" },
    { i: "✧", l: "Glory",  href: "Achievements & Goals.html" },
    { i: "⊞", l: "Bingo",  href: null, active: true },
    { i: "●", l: "Vault",  href: "Reward Marketplace.html" },
    { i: "◇", l: "Atlas",  href: "Adventure Map.html" },
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

// ── A single bingo cell ─────────────────────────────────────
function BingoCell({ cell, onOpen, justDone, lineWin, dim }) {
  const cellRef = bRef(null);
  const cat = CAT[cell.cat];
  const pri = PRIORITIES[cell.priority];
  const state = cell.status === "completed" ? "done" : cell.status === "not-started" ? "locked" : "active";
  const pct = Math.round(cell.progress * 100);
  const delay = (cell.row + cell.col) * 70; // diagonal "deal" wave

  const handleClick = (e) => {
    // ripple
    const el = cellRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const rip = document.createElement("span");
      rip.className = "ripple";
      const d = Math.max(rect.width, rect.height) * 2;
      rip.style.width = rip.style.height = d + "px";
      rip.style.left = (e.clientX - rect.left) + "px";
      rip.style.top = (e.clientY - rect.top) + "px";
      el.appendChild(rip);
      setTimeout(() => rip.remove(), 650);
    }
    onOpen(cell.cell);
  };

  const priToken = { high: "▲▲▲", medium: "▲▲", low: "▲" }[cell.priority];

  return (
    <button
      ref={cellRef}
      type="button"
      className={cls("bcell", catClass(cell.cat), state, justDone && "just-done", lineWin && "line-win")}
      style={{ animationDelay: `${delay}ms`, ...(dim ? { opacity: 0.18, filter: "grayscale(0.7)" } : null) }}
      onClick={handleClick}
      aria-label={`${cell.title} — ${state === "done" ? "completed" : state === "locked" ? "not started" : pct + "% complete"}`}
    >
      {state === "locked" && <span className="bc-lock">🔒</span>}

      <div className="bc-top">
        <span className="bc-cat" aria-hidden="true">{cat.ci}</span>
        <span className={cls("bc-rank", "rank-" + cell.rank)}>{cell.rank}</span>
        <span className={cls("bc-pri", pri.cls)} title={`${pri.label} priority`}>{priToken}</span>
      </div>

      <div className="bc-title">{cell.title}</div>

      {state !== "done" && (
        <div className="bc-foot">
          <span className="bc-prog-track"><span className="bc-prog-fill" style={{ width: `${pct}%` }} /></span>
          <span className="bc-prog-num">{pct}%</span>
        </div>
      )}

      {state === "done" && (
        <>
          <span className="bc-daub" aria-hidden="true">{cell.linkedTrophy ? "♛" : "✓"}</span>
          <span className="bc-conquered">Conquered</span>
        </>
      )}
    </button>
  );
}

// ── The board ───────────────────────────────────────────────
function BingoBoard({ cells, dealt, ready, onOpen, justDoneId, lineWinCells, query }) {
  const q = (query || "").trim().toLowerCase();
  const matches = (cell) => {
    if (!q) return true;
    const hay = (cell.title + " " + cell.desc + " " + CAT[cell.cat].label).toLowerCase();
    return hay.includes(q);
  };
  return (
    <div className={cls("board-wrap", ready && "ready")} id="boardWrap">
      <span className="board-corner tl" /><span className="board-corner tr" />
      <span className="board-corner bl" /><span className="board-corner br" />

      <div className="board-head">
        <span className="board-title">⊞ &nbsp; The Glory Board</span>
        <div className="board-axis">
          {["G", "O", "A", "L"].map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>

      {!dealt && <div className="board-scan" />}

      <div className={cls("board", dealt && "dealt")} role="grid" aria-label="Goal bingo board, 4 by 4">
        {cells.map((cell) => (
          <BingoCell
            key={cell.id}
            cell={cell}
            onOpen={onOpen}
            justDone={justDoneId === cell.id}
            lineWin={lineWinCells.includes(cell.cell)}
            dim={!matches(cell)}
          />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { cls, catClass, Ring, TopBar, NavRail, BingoCell, BingoBoard });
