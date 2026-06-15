// ═══════════════════════════════════════════════════════════════════
// AETHERIA — Goal Bingo · FX layer
// Canvas confetti + fireworks (window.BingoFX), reward popup, BINGO banner,
// achievement toast. Exported to window for bingo-app.jsx.
// ═══════════════════════════════════════════════════════════════════
const { useEffect: fxEffect, useRef: fxRef, useState: fxState } = React;
// (every bingo file keeps hooks uniquely aliased — all babel scripts share one global scope)

// Palette resolved to hex so canvas fillStyle is universally happy.
const FX_COLORS = ["#e8b84b", "#f0d27a", "#a06bff", "#4fd0e0", "#5fd6a0", "#ff6b8a", "#ffffff"];

// ── Canvas particle engine ──────────────────────────────────
function FXCanvas() {
  const ref = fxRef(null);
  fxEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let raf = null;
    let running = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a, b) => a + Math.random() * (b - a);

    const spawn = (x, y, opts = {}) => {
      const {
        count = 120, spread = Math.PI * 2, angle = -Math.PI / 2,
        power = 9, gravity = 0.18, colors = FX_COLORS, scalar = 1, upward = false,
      } = opts;
      for (let i = 0; i < count; i++) {
        const a = angle + rand(-spread / 2, spread / 2);
        const v = rand(power * 0.4, power) * (upward ? 1 : 1);
        particles.push({
          x, y,
          vx: Math.cos(a) * v + rand(-0.6, 0.6),
          vy: Math.sin(a) * v - (upward ? rand(2, 5) : 0),
          g: gravity,
          size: rand(5, 11) * scalar,
          color: colors[(Math.random() * colors.length) | 0],
          rot: rand(0, Math.PI * 2),
          vrot: rand(-0.3, 0.3),
          shape: Math.random() < 0.45 ? "rect" : Math.random() < 0.7 ? "circle" : "streamer",
          life: 1, decay: rand(0.006, 0.014), wob: rand(0, Math.PI * 2), wobs: rand(0.05, 0.13),
        });
      }
      if (!running) loop();
    };

    const loop = () => {
      running = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += p.g;
        p.vx *= 0.99;
        p.wob += p.wobs;
        p.x += p.vx + Math.cos(p.wob) * 0.6;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > window.innerHeight + 40) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === "streamer") {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 2.2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (particles.length > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // public API
    window.BingoFX = {
      // celebratory two-cannon burst from lower corners + a center pop
      confetti(opts = {}) {
        const W = window.innerWidth, H = window.innerHeight;
        spawn(W * 0.5, H * 0.42, { count: 90, spread: Math.PI * 2, power: 11, ...opts });
        spawn(0, H, { count: 70, angle: -Math.PI / 3, spread: Math.PI / 3, power: 16, upward: true });
        spawn(W, H, { count: 70, angle: -Math.PI * 2 / 3, spread: Math.PI / 3, power: 16, upward: true });
      },
      // burst at a specific screen point (e.g. a cell)
      burstAt(x, y, opts = {}) {
        spawn(x, y, { count: 60, spread: Math.PI * 2, power: 9, ...opts });
      },
      // staggered fireworks for the big BINGO moment
      fireworks(n = 5) {
        const W = window.innerWidth, H = window.innerHeight;
        for (let k = 0; k < n; k++) {
          setTimeout(() => {
            spawn(rand(W * 0.15, W * 0.85), rand(H * 0.18, H * 0.55), {
              count: 80, spread: Math.PI * 2, power: 13, gravity: 0.12,
              colors: [FX_COLORS[(Math.random() * FX_COLORS.length) | 0]].concat(FX_COLORS),
            });
          }, k * 260);
        }
      },
    };

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      particles = [];
      delete window.BingoFX;
    };
  }, []);

  return <canvas ref={ref} className="fx-canvas" aria-hidden="true" />;
}

// ── Reward popup (goal conquered) ───────────────────────────
function RewardPopup({ data, onDone }) {
  const [out, setOut] = fxState(false);
  fxEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2200);
    const t2 = setTimeout(onDone, 2650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data, onDone]);
  return (
    <div className={cls("reward-pop", out && "out")} role="status">
      <div className="reward-medal">{data.icon || "✦"}</div>
      <div className="reward-eyebrow">✦ &nbsp; AMBITION CONQUERED &nbsp; ✦</div>
      <div className="reward-main">{data.title}</div>
      {data.cat && <div className="reward-goal">{data.cat} · Rank {data.rank}</div>}
      <div className="reward-pills">
        <span className="reward-pill xp">+{data.xp} <small>XP</small></span>
        <span className="reward-pill coin">+{data.coins} <small>COINS</small></span>
      </div>
    </div>
  );
}

// ── BINGO banner (line completed) ───────────────────────────
function BingoBanner({ data, onDone }) {
  const [out, setOut] = fxState(false);
  fxEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2600);
    const t2 = setTimeout(onDone, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data, onDone]);
  return (
    <div className={cls("bingo-banner", out && "out")} role="status">
      <div className="wave" />
      <div className="bingo-word">BINGO!</div>
      <div className="bingo-sub">{data.cheer}</div>
      <div className="bingo-line-name">◆ {data.line} ◆</div>
    </div>
  );
}

// ── Achievement toast (trophy unlocked) ─────────────────────
function AchievementToast({ data, onDone }) {
  const [out, setOut] = fxState(false);
  fxEffect(() => {
    const t1 = setTimeout(() => setOut(true), 3400);
    const t2 = setTimeout(onDone, 3850);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data, onDone]);
  return (
    <div className={cls("ach-toast", out && "out")} role="status">
      <div className="ach-medal">{data.icon || "♛"}</div>
      <div className="ach-meta">
        <div className="ach-eyebrow">✧ &nbsp; TROPHY UNLOCKED</div>
        <div className="ach-name">{data.name}</div>
        <div className="ach-reward">{data.reward}</div>
      </div>
    </div>
  );
}

Object.assign(window, { FXCanvas, RewardPopup, BingoBanner, AchievementToast, FX_COLORS });
