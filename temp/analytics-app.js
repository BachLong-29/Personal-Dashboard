/* ═══════════════════════════════════════════════════════════════════════
   AETHERIA — Progression Analytics · app logic
   Vanilla JS. Renders sections, Chart.js charts, counters, scroll reveals.
   Exposes window.applyAccent / window.applyMotion for the Tweaks island.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  const D = window.ANALYTICS_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ── colour palette (explicit RGB so canvas gradients work everywhere) ──
  const PAL = {
    gold: [229, 169, 58],
    violet: [155, 107, 242],
    cyan: [47, 196, 221],
    mint: [95, 214, 160],
    rose: [240, 138, 176],
    crimson: [219, 76, 52],
  };
  const rgba = (name, a = 1) => `rgba(${PAL[name].join(',')},${a})`;
  let ACCENT = document.body.dataset.accent || 'gold';
  const accentRGB = () => PAL[ACCENT] || PAL.gold;
  const acc = (a = 1) => `rgba(${accentRGB().join(',')},${a})`;

  const motionOn = () => document.body.dataset.motion !== 'reduced';
  const TEXT_LO = '#7676a0';
  const TEXT_MD = '#b4b4d8';
  const GRID = 'rgba(255,255,255,0.05)';
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  // ═══════════ RENDER STATIC SECTIONS ═══════════

  // ── KPI cards ──
  function renderKPIs() {
    const icons = { xp: '⚡', quests: '⚔', focus: '◷', streak: '🔥' };
    const bento = $('#headlineBento');
    D.headline.forEach((k, i) => {
      const up = k.delta > 0,
        flat = k.delta === 0;
      const dCls = flat ? 'flat' : up ? 'up' : 'down';
      const arrow = flat ? '■' : up ? '▲' : '▼';
      const dLabel = k.key === 'streak' ? `${arrow} best yet` : `${arrow} ${Math.abs(k.delta)}%`;
      const el = document.createElement('div');
      el.className = 'glass kpi reveal';
      el.style.setProperty('--d', `${0.05 + i * 0.06}s`);
      el.innerHTML = `
        <div class="kpi-top">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-ico ${k.accent}">${icons[k.key] || '◆'}</div>
        </div>
        <div class="kpi-val" data-count="${k.value}" data-suffix="${k.suffix}" data-scale="${k.key !== 'streak'}">0</div>
        <div class="kpi-foot">
          <span class="delta ${dCls}">${dLabel}</span>
          <canvas class="kpi-spark" data-spark="${k.key}"></canvas>
        </div>`;
      bento.appendChild(el);
    });
  }

  // ── Heatmap ──
  function renderHeatmap() {
    const wrap = $('#heatmap');
    D.heatmap.forEach((week) => {
      week.forEach((lvl) => {
        const c = document.createElement('div');
        c.className = 'hm-cell';
        c.dataset.lvl = lvl;
        wrap.appendChild(c);
      });
    });
  }

  // ── Realm map nodes + list ──
  function renderRealms() {
    const statusColor = { thriving: 'mint', active: ACCENT, fading: 'lo' };
    const ov = $('#realmOverlay');
    const list = $('#realmList');
    D.realms.forEach((r) => {
      const node = document.createElement('div');
      node.className = 'realm-node' + (r.status === 'fading' ? ' fading' : '');
      node.style.left = r.x + '%';
      node.style.top = r.y + '%';
      node.innerHTML = `
        <span class="pin"></span>
        <span class="realm-tip">
          <span class="rt-name">${r.name}</span>
          <span class="rt-meta">${r.activity}% active · ${r.quests} quests</span>
        </span>`;
      ov.appendChild(node);

      const dotCol =
        r.status === 'thriving' ? rgba('mint') : r.status === 'fading' ? TEXT_LO : acc();
      const row = document.createElement('div');
      row.className = 'realm-row';
      row.innerHTML = `
        <span class="rr-dot" style="background:${dotCol};color:${dotCol};"></span>
        <span class="rr-name">${r.name}</span>
        <div class="rr-bar"><div class="rr-fill" style="width:0%" data-w="${r.activity}"></div></div>
        <span class="rr-pct">${r.activity}%</span>`;
      list.appendChild(row);
    });
  }

  // ── Oracle insights ──
  function renderInsights() {
    const grid = $('#insightGrid');
    D.insights.forEach((ins, i) => {
      const el = document.createElement('div');
      el.className = `glass insight ${ins.tone} reveal`;
      el.style.setProperty('--d', `${i * 0.08}s`);
      el.innerHTML = `
        <div class="insight-top">
          <div class="insight-ico">${ins.icon}</div>
          <div>
            <div class="insight-tag">${ins.tag}</div>
            <div class="insight-title">${ins.title}</div>
          </div>
        </div>
        <div class="insight-body">${ins.body}</div>
        <div class="insight-foot">
          <span class="conf-num">Confidence</span>
          <div class="conf-track"><div class="conf-fill" style="width:0%" data-w="${ins.confidence}"></div></div>
          <span class="conf-num">${ins.confidence}%</span>
        </div>`;
      grid.appendChild(el);
    });
  }

  // ── Milestone timeline ──
  function renderTimeline() {
    const tl = $('#timeline');
    D.milestones.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'tl-node' + (m.reached ? '' : ' locked');
      el.innerHTML = `
        <div class="tl-medal">${m.icon}</div>
        <div class="tl-day">${m.day}</div>
        <div class="tl-label">${m.label}</div>`;
      tl.appendChild(el);
    });
  }

  // ── Leaderboard ──
  function renderLeaderboard() {
    const lb = $('#leaderboard');
    D.leaderboard.forEach((p) => {
      const dCls = p.delta > 0 ? 'up' : p.delta < 0 ? 'down' : 'flat';
      const dTxt = p.delta > 0 ? `▲${p.delta}` : p.delta < 0 ? `▼${Math.abs(p.delta)}` : '–';
      const el = document.createElement('div');
      el.className = 'lb-row' + (p.you ? ' you' : '');
      el.innerHTML = `
        <span class="lb-rank${p.rank === 1 ? ' top1' : ''}">${p.rank}</span>
        <div class="lb-id">
          <span class="lb-av" style="background:linear-gradient(135deg, oklch(0.5 0.16 ${p.hue}), oklch(0.68 0.2 ${p.hue}));">
            ${p.name[0]}
            <span class="on" style="background:${p.online ? rgba('mint') : TEXT_LO};"></span>
          </span>
          <div style="min-width:0;">
            <div class="lb-name">${p.name}${p.you ? '<span class="you-tag">YOU</span>' : ''}</div>
            <div class="lb-cls">${p.cls}</div>
          </div>
        </div>
        <div class="lb-xp">${fmt(p.xp)}<span class="lvl">LV.${p.level}</span></div>
        <span class="lb-delta ${dCls}">${dTxt}</span>`;
      lb.appendChild(el);
    });
  }

  // ── Activity feed ──
  function renderFeed() {
    const feed = $('#feed');
    D.feed.forEach((f) => {
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.innerHTML = `
        <div class="feed-ico ${f.tone}">${f.icon}</div>
        <div class="feed-body">
          <div class="feed-title">${f.title}${f.live ? '<span class="feed-live"></span>' : ''}</div>
          <div class="feed-desc">${f.body}</div>
        </div>
        <div class="feed-time">${f.time}</div>`;
      feed.appendChild(el);
    });
  }

  // ═══════════ CHART.JS ═══════════
  const charts = {};
  let chartsReady = false;

  function chartFont() {
    return { family: "'Sora', sans-serif" };
  }

  function vGradient(ctx, area, name, top = 0.42, bottom = 0.0) {
    if (!area) return rgba(name, 0.2);
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, rgba(name, top));
    g.addColorStop(1, rgba(name, bottom));
    return g;
  }
  function accentGradient(ctx, area, top = 0.42, bottom = 0.0) {
    if (!area) return acc(0.2);
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, acc(top));
    g.addColorStop(1, acc(bottom));
    return g;
  }

  const animOpt = () => (motionOn() ? { duration: 1100, easing: 'easeOutQuart' } : false);

  // FEATURED — cumulative aether area
  function buildFeatured() {
    const cv = $('#chartFeatured');
    if (!cv) return;
    let cum = 0;
    const data = D.xpOverTime.earned.map((v) => (cum += v));
    charts.featured = new Chart(cv, {
      type: 'line',
      data: {
        labels: D.xpOverTime.labels,
        datasets: [
          {
            data,
            borderColor: acc(1),
            borderWidth: 2.5,
            backgroundColor: (c) => accentGradient(c.chart.ctx, c.chart.chartArea, 0.45, 0),
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: acc(1),
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animOpt(),
        plugins: { legend: { display: false }, tooltip: tt() },
        scales: { x: { display: false }, y: { display: false } },
        interaction: { intersect: false, mode: 'index' },
      },
    });
  }

  // XP earned vs spent
  function buildXP() {
    const cv = $('#chartXP');
    if (!cv) return;
    charts.xp = new Chart(cv, {
      type: 'line',
      data: {
        labels: D.xpOverTime.labels,
        datasets: [
          {
            label: 'Earned',
            data: D.xpOverTime.earned,
            borderColor: acc(1),
            borderWidth: 2.5,
            backgroundColor: (c) => accentGradient(c.chart.ctx, c.chart.chartArea, 0.3, 0),
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: acc(1),
          },
          {
            label: 'Spent',
            data: D.xpOverTime.spent,
            borderColor: rgba('violet', 1),
            borderWidth: 2,
            backgroundColor: (c) => vGradient(c.chart.ctx, c.chart.chartArea, 'violet', 0.16, 0),
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: rgba('violet', 1),
            borderDash: [],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animOpt(),
        plugins: { legend: { display: false }, tooltip: tt() },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { grid: { display: false }, ticks: { color: TEXT_LO, font: chartFont() } },
          y: {
            grid: { color: GRID },
            border: { display: false },
            ticks: {
              color: TEXT_LO,
              font: chartFont(),
              callback: (v) => (v >= 1000 ? v / 1000 + 'k' : v),
            },
          },
        },
      },
    });
  }

  // Radar — attributes
  function buildRadar() {
    const cv = $('#chartRadar');
    if (!cv) return;
    charts.radar = new Chart(cv, {
      type: 'radar',
      data: {
        labels: D.attributes.labels,
        datasets: [
          {
            label: 'Start',
            data: D.attributes.season,
            borderColor: rgba('rose', 0),
            borderWidth: 0,
            backgroundColor: 'rgba(118,118,160,0.18)',
            pointRadius: 0,
          },
          {
            label: 'Now',
            data: D.attributes.now,
            borderColor: acc(1),
            borderWidth: 2,
            backgroundColor: acc(0.18),
            pointBackgroundColor: acc(1),
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animOpt(),
        plugins: { legend: { display: false }, tooltip: tt() },
        scales: {
          r: {
            min: 0,
            max: 100,
            angleLines: { color: GRID },
            grid: { color: GRID },
            pointLabels: { color: TEXT_MD, font: { ...chartFont(), size: 11 } },
            ticks: { display: false, stepSize: 25 },
          },
        },
      },
    });
  }

  // Bar — quests by rank
  function buildBar() {
    const cv = $('#chartBar');
    if (!cv) return;
    charts.bar = new Chart(cv, {
      type: 'bar',
      data: {
        labels: D.questsByRank.labels,
        datasets: [
          {
            data: D.questsByRank.values,
            backgroundColor: (c) => accentGradient(c.chart.ctx, c.chart.chartArea, 1, 0.35),
            hoverBackgroundColor: acc(1),
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.62,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animOpt(),
        plugins: { legend: { display: false }, tooltip: tt() },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: TEXT_MD,
              font: { ...chartFont(), family: "'Cinzel', serif", weight: '700' },
            },
          },
          y: {
            grid: { color: GRID },
            border: { display: false },
            ticks: { color: TEXT_LO, font: chartFont() },
          },
        },
      },
    });
  }

  // Donut — quest types
  function buildDonut() {
    const cv = $('#chartDonut');
    if (!cv) return;
    const cols = D.questTypes.colors.map((c) => rgba(c, 0.85));
    charts.donut = new Chart(cv, {
      type: 'doughnut',
      data: {
        labels: D.questTypes.labels,
        datasets: [
          {
            data: D.questTypes.values,
            backgroundColor: cols,
            borderColor: '#0e0e1a',
            borderWidth: 3,
            hoverOffset: 8,
            hoverBorderColor: '#0e0e1a',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: animOpt(),
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: TEXT_MD,
              font: chartFont(),
              boxWidth: 9,
              boxHeight: 9,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12,
            },
          },
          tooltip: tt(),
        },
      },
    });
  }

  function tt() {
    return {
      backgroundColor: 'rgba(10,10,20,0.95)',
      borderColor: acc(0.5),
      borderWidth: 1,
      titleColor: '#f0eeff',
      bodyColor: '#b4b4d8',
      padding: 10,
      cornerRadius: 8,
      titleFont: { ...chartFont(), family: "'Cinzel', serif" },
      bodyFont: chartFont(),
      displayColors: true,
      usePointStyle: true,
    };
  }

  // KPI sparklines
  function buildSparks() {
    $$('[data-spark]').forEach((cv) => {
      const k = D.headline.find((h) => h.key === cv.dataset.spark);
      if (!k) return;
      const name = k.accent;
      if (charts['spark_' + k.key]) charts['spark_' + k.key].destroy();
      charts['spark_' + k.key] = new Chart(cv, {
        type: 'line',
        data: {
          labels: k.spark.map((_, i) => i),
          datasets: [
            {
              data: k.spark,
              borderColor: rgba(name, 1),
              borderWidth: 2,
              backgroundColor: (c) => vGradient(c.chart.ctx, c.chart.chartArea, name, 0.35, 0),
              fill: true,
              tension: 0.45,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: animOpt(),
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        },
      });
    });
  }

  const CHART_INIT = {
    chartFeatured: buildFeatured,
    chartXP: buildXP,
    chartRadar: buildRadar,
    chartBar: buildBar,
    chartDonut: buildDonut,
  };
  const builtCharts = new Set();

  function buildChartIn(el) {
    $$('canvas', el).forEach((cv) => {
      if (cv.id && CHART_INIT[cv.id] && !builtCharts.has(cv.id)) {
        CHART_INIT[cv.id]();
        builtCharts.add(cv.id);
        finalizeChart(cv.id);
      }
      if (cv.dataset.spark && !builtCharts.has('spark_' + cv.dataset.spark)) {
        const k = D.headline.find((h) => h.key === cv.dataset.spark);
        if (k) {
          buildSparks();
          builtCharts.add('spark_' + cv.dataset.spark);
          finalizeChart('spark_' + k.key);
        }
      }
    });
  }

  // Guarantee a chart reaches its final painted state even if its rAF-driven
  // entrance animation is throttled (background/headless tabs).
  function finalizeChart(key) {
    setTimeout(() => {
      const reg = Chart.instances || {};
      for (const k in reg) {
        try {
          reg[k].update('none');
          reg[k].draw();
        } catch (e) {}
      }
    }, 1400);
  }

  // ═══════════ COUNTERS ═══════════
  function animateCount(el) {
    if (el.dataset.done === '1') return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (!motionOn()) {
      el.innerHTML = fmt(target) + sfx(suffix);
      return;
    }
    const dur = 1300;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = fmt(target * e) + sfx(suffix);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // failsafe: ensure the final value lands even if rAF is throttled
    setTimeout(() => {
      el.innerHTML = fmt(target) + sfx(suffix);
    }, dur + 120);
  }
  const sfx = (s) => (s ? `<span class="suffix">${s}</span>` : '');

  // re-run counters (range change)
  function recount(factor) {
    $$('.kpi-val[data-count]').forEach((el) => {
      const base = +el.dataset.base || +el.dataset.count;
      el.dataset.base = base;
      const scale = el.dataset.scale === 'true';
      el.dataset.count = Math.round(scale ? base * factor : base);
      el.dataset.done = '0';
      animateCount(el);
    });
    const feat = $('.featured-val[data-count]');
    if (feat) {
      const base = +feat.dataset.base || +feat.dataset.count;
      feat.dataset.base = base;
      feat.dataset.count = Math.round(base * factor);
      feat.dataset.done = '0';
      animateCount(feat);
    }
  }

  // ═══════════ REVEAL (scroll-driven, IO-independent) ═══════════
  // Pin final opacity via JS so content is never left stuck mid-transition
  // in throttled/headless contexts (the CSS transition still plays normally
  // in a live tab; this only forces the end state after the animation window).
  function pinVisible(el) {
    const prev = el.style.transition;
    el.style.transition = 'none';
    el.style.opacity = '1';
    void el.offsetWidth; // flush, so no transition replays
    el.style.transition = prev; // restore CSS-driven hover transitions
  }
  function revealEl(el) {
    if (el.dataset.shown === '1') return;
    el.dataset.shown = '1';
    el.classList.add('in');
    setTimeout(() => pinVisible(el), 820);
    buildChartIn(el);
    $$('[data-count]', el).forEach(animateCount);
    if (el.matches('[data-count]')) animateCount(el);
    $$('.rr-fill[data-w], .conf-fill[data-w]', el).forEach((b) => {
      requestAnimationFrame(() => {
        b.style.width = b.dataset.w + '%';
      });
      setTimeout(() => {
        b.style.width = b.dataset.w + '%';
      }, 60);
    });
  }

  function setupReveal() {
    const items = $$('.reveal');
    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      for (const el of items) {
        if (el.dataset.shown === '1') continue;
        const r = el.getBoundingClientRect();
        // reveal once the element's top crosses the trigger line — also
        // catches elements jumped past (bottom already above viewport)
        if (r.top < vh * 0.92) revealEl(el);
      }
    };
    let scheduled = false;
    const onScroll = () => {
      // run immediately (don't depend on rAF, which pauses in hidden tabs),
      // but coalesce bursts with a short timeout
      if (scheduled) return;
      scheduled = true;
      check();
      setTimeout(() => {
        scheduled = false;
        check();
      }, 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    // initial pass (covers above-the-fold + any non-scrolling layout)
    check();
    // safety net for late layout / fonts
    setTimeout(check, 400);
    setTimeout(check, 1200);
    window.addEventListener('load', check);
  }

  // ═══════════ THEMING (tweaks) ═══════════
  function rebuildAllCharts() {
    Object.values(charts).forEach((c) => c && c.destroy());
    for (const k in charts) delete charts[k];
    builtCharts.clear();
    // rebuild whichever are currently in view / already revealed
    $$('.reveal.in').forEach(buildChartIn);
  }

  window.applyAccent = function (name) {
    ACCENT = name;
    document.body.dataset.accent = name;
    rebuildAllCharts();
    // recolour realm dots that used the accent
    $$('.realm-row').forEach((row, i) => {
      const r = D.realms[i];
      if (!r) return;
      if (r.status === 'active') {
        const dot = $('.rr-dot', row);
        if (dot) {
          dot.style.background = acc();
          dot.style.color = acc();
        }
      }
    });
  };

  window.applyMotion = function (mode) {
    document.body.dataset.motion = mode;
    rebuildAllCharts();
  };

  // ═══════════ RANGE CONTROL ═══════════
  function setupRange() {
    const factors = { 7: 0.09, 30: 0.38, season: 1, all: 5.2 };
    $('#rangeCtl').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      $$('#rangeCtl button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      recount(factors[btn.dataset.range] ?? 1);
    });
  }

  // ═══════════ INIT ═══════════
  function init() {
    // Chart.js global defaults
    if (window.Chart) {
      Chart.defaults.font.family = "'Sora', sans-serif";
      Chart.defaults.color = TEXT_MD;
      Chart.defaults.plugins.tooltip.boxPadding = 4;
    }
    renderKPIs();
    renderHeatmap();
    renderRealms();
    renderInsights();
    renderTimeline();
    renderLeaderboard();
    renderFeed();
    setupReveal();
    setupRange();
    chartsReady = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
