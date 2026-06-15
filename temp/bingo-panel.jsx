// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Goal Bingo · goal detail panel + notes feature
// ═══════════════════════════════════════════════════════════════════
const { useState: pState, useRef: pRef, useEffect: pEffect } = React;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function nowStamp() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${hh}:${mm}`;
}

// auto-grow a textarea to fit content
function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

// ── Single note card (view + inline edit + delete animation) ─
function NoteCard({ note, onEdit, onDelete }) {
  const [editing, setEditing] = pState(false);
  const [text, setText] = pState(note.text);
  const [removing, setRemoving] = pState(false);
  const taRef = pRef(null);

  pEffect(() => { if (editing && taRef.current) { autoGrow(taRef.current); taRef.current.focus(); } }, [editing]);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    onEdit(note.id, t);
    setEditing(false);
  };
  const remove = () => {
    setRemoving(true);
    setTimeout(() => onDelete(note.id), 300);
  };

  return (
    <div className={cls("note-card", removing && "removing")}>
      {editing ? (
        <>
          <textarea
            ref={taRef} className="note-edit" value={text}
            onChange={(e) => { setText(e.target.value); autoGrow(e.target); }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); if (e.key === "Escape") setEditing(false); }}
          />
          <div className="note-edit-actions">
            <button className="dp-archive" style={{ padding: "6px 12px", fontSize: 9 }} onClick={() => { setText(note.text); setEditing(false); }}>Cancel</button>
            <button className="notes-save" onClick={save}>✓ Save</button>
          </div>
        </>
      ) : (
        <>
          <div className="note-text">{note.text}</div>
          <div className="note-foot">
            <span className="note-ts">◷ {note.ts}{note.edited && <span className="edited"> · edited</span>}</span>
            <div className="note-actions">
              <button className="note-btn" title="Edit note" onClick={() => setEditing(true)}>✎</button>
              <button className="note-btn del" title="Delete note" onClick={remove}>🗑</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Notes block (add + list) ────────────────────────────────
function NotesBlock({ cell, onAddNote, onEditNote, onDeleteNote }) {
  const [draft, setDraft] = pState("");
  const [saved, setSaved] = pState(false);
  const taRef = pRef(null);

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAddNote(cell.id, { id: "n" + Date.now(), text: t, ts: nowStamp() });
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    setSaved(true);
    setTimeout(() => setSaved(false), 700);
  };

  return (
    <div>
      <div className="dp-sec-label">✎ &nbsp; Chronicle · Notes <span className="n">{cell.notes.length}</span></div>
      <div className="notes-add">
        <textarea
          ref={taRef} className="notes-input" value={draft} placeholder="Log a note — a reflection, a blocker, a small win…"
          onChange={(e) => { setDraft(e.target.value); autoGrow(e.target); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }}
        />
        <div className="notes-add-row">
          <span className="notes-hint">⌘ + ⏎ to save</span>
          <button className={cls("notes-save", saved && "saved")} disabled={!draft.trim()} onClick={add}>
            {saved ? "✓ Saved" : "✦ Add Note"}
          </button>
        </div>
      </div>
      <div className="notes-list">
        {cell.notes.length === 0 ? (
          <div className="notes-empty"><span className="ico">✶</span>No entries yet. The chronicle awaits its first line.</div>
        ) : (
          cell.notes.map((n) => (
            <NoteCard key={n.id} note={n} onEdit={(id, t) => onEditNote(cell.id, id, t)} onDelete={(id) => onDeleteNote(cell.id, id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── The detail panel ────────────────────────────────────────
function DetailPanel({ cell, onClose, onToggleMilestone, onComplete, onAddNote, onEditNote, onDeleteNote }) {
  pEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!cell) return null;
  const cat = CAT[cell.cat];
  const pri = PRIORITIES[cell.priority];
  const done = cell.status === "completed";
  const pct = Math.round(cell.progress * 100);
  const msDone = cell.milestones.filter((m) => m.done).length;

  return (
    <>
      <div className="dp-backdrop" onClick={onClose} />
      <aside className={cls("detail-panel", catClass(cell.cat))} role="dialog" aria-label={cell.title}>
        {/* BANNER */}
        <div className="dp-banner">
          <button className="dp-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="dp-eyebrow-row">
            <span className="dp-cat-chip">{cat.ci} {cat.label}</span>
            <span className={cls("dp-rank", "rank-" + cell.rank)}>{cell.rank}</span>
            {!done && <span className={cls("dp-pri", pri.cls)}>{pri.label}</span>}
          </div>
          <div className="dp-title">{cell.title}</div>
          <div className="dp-bannerstats">
            <div className="dp-ring-wrap">
              <Ring value={cell.progress} size={60} stroke={5} />
              <div className="dp-ring-num">{done ? "✓" : pct}</div>
            </div>
            <div className="dp-rewards">
              <span className="dp-reward xp">{cell.xp} <small>XP</small></span>
              <span className="dp-reward coin">{cell.coins} <small>COINS</small></span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="dp-body">
          <div>
            <div className="dp-sec-label">◆ &nbsp; The Vision</div>
            <div className="dp-desc">{cell.desc}</div>
          </div>

          <div>
            <div className="dp-sec-label">▦ &nbsp; Details</div>
            <div className="dp-meta-grid">
              <div className="dp-meta-item"><div className="k">Status</div><div className="v">{STATUSES[cell.status].label}</div></div>
              <div className="dp-meta-item"><div className="k">Rank</div><div className="v">{cell.rank} · {RANK_DESC[cell.rank]}</div></div>
              <div className="dp-meta-item"><div className="k">Priority</div><div className="v">{pri.label}</div></div>
              <div className="dp-meta-item"><div className="k">Started</div><div className="v">{cell.created}</div></div>
              <div className="dp-meta-item"><div className="k">Target</div><div className="v">{cell.targetLabel}</div></div>
              <div className="dp-meta-item"><div className="k">{done ? "Conquered" : "Time Left"}</div><div className="v">{done ? (cell.completedDate || "Today") : `${cell.daysLeft}d`}</div></div>
            </div>
          </div>

          <div>
            <div className="dp-sec-label">◈ &nbsp; Milestones <span className="n">{msDone}/{cell.milestones.length}</span></div>
            <div className="dp-ms">
              {cell.milestones.map((m) => (
                <div key={m.id} className={cls("dp-ms-item", m.done && "done")} onClick={() => onToggleMilestone(cell.id, m.id)}>
                  <span className={cls("dp-ms-check", m.done && "on")} />
                  <span className="dp-ms-text">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {cell.note && (
            <div className="dp-strategy">
              <div className="lab">◆ STRATEGY</div>
              <div className="txt">{cell.note}</div>
            </div>
          )}

          {cell.linkedTrophy && (
            <div style={{ fontFamily: "var(--f-mono)", fontSize: 10, color: "var(--text-lo)" }}>
              ✧ Completing this unlocks the <span style={{ color: "var(--gold)" }}>{cell.linkedTrophy}</span> trophy
            </div>
          )}

          <NotesBlock cell={cell} onAddNote={onAddNote} onEditNote={onEditNote} onDeleteNote={onDeleteNote} />
        </div>

        {/* FOOTER */}
        <div className="dp-foot">
          {done ? (
            <div className="dp-conquered-tag">✦ Ambition Conquered</div>
          ) : (
            <button className="dp-conquer" onClick={() => onComplete(cell)}>
              <span className="ico">✦</span> Conquer This Goal
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { DetailPanel, NotesBlock, NoteCard, nowStamp });
