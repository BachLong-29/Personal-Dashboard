// ═══════════════════════════════════════════════════════════════════════
//  AETHERIA — Progression Analytics Data
//  Sample chronicle data for Aria Solveig · Lv.24 · S-Rank
// ═══════════════════════════════════════════════════════════════════════

const ANALYTICS_DATA = {
  hero: {
    name: 'Aria Solveig',
    title: 'Shadow Weaver',
    level: 24,
    rank: 'S',
    season: 'Season III · Ashen Equinox',
    day: 78,
  },

  // ── HEADLINE METRICS (animated counters) ──────────────────────────────
  headline: [
    {
      key: 'xp',
      label: 'Total XP Earned',
      value: 48720,
      suffix: '',
      delta: +18.4,
      spark: [220, 260, 240, 310, 290, 360, 400, 380, 440, 470, 520, 560],
      accent: 'violet',
    },
    {
      key: 'quests',
      label: 'Quests Vanquished',
      value: 1284,
      suffix: '',
      delta: +9.2,
      spark: [12, 14, 11, 16, 15, 18, 17, 20, 19, 22, 24, 26],
      accent: 'gold',
    },
    {
      key: 'focus',
      label: 'Focus Hours',
      value: 312,
      suffix: 'h',
      delta: +4.1,
      spark: [3, 4, 3.5, 5, 4, 6, 5.5, 6, 5, 7, 6.5, 8],
      accent: 'cyan',
    },
    {
      key: 'streak',
      label: 'Day Streak',
      value: 78,
      suffix: 'd',
      delta: +1,
      spark: [40, 46, 52, 55, 60, 63, 67, 70, 72, 74, 76, 78],
      accent: 'gold',
    },
  ],

  // featured big metric (area chart hero)
  featured: {
    label: 'Lifetime Aether Accrued',
    value: 248930,
    delta: +22.6,
    sub: 'across 78 days of this season',
  },

  // ── XP OVER TIME (line / area) ────────────────────────────────────────
  xpOverTime: {
    labels: ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8', 'Wk9', 'Wk10', 'Wk11', 'Wk12'],
    earned: [2100, 2480, 2310, 3050, 2890, 3420, 3680, 3510, 4120, 4380, 4910, 5240],
    spent: [800, 1200, 980, 1500, 1320, 1680, 1450, 1900, 1720, 2100, 1980, 2400],
  },

  // ── QUESTS BY RANK (bar) ──────────────────────────────────────────────
  questsByRank: {
    labels: ['S', 'A', 'B', 'C', 'D'],
    values: [42, 138, 286, 410, 408],
  },

  // ── QUEST TYPE DISTRIBUTION (donut) ───────────────────────────────────
  questTypes: {
    labels: ['Focus', 'Habit', 'Create', 'Reflect', 'Admin', 'Health'],
    values: [312, 268, 196, 142, 224, 142],
    colors: ['cyan', 'gold', 'mint', 'violet', 'rose', 'mint'],
  },

  // ── ATTRIBUTE RADAR ───────────────────────────────────────────────────
  attributes: {
    labels: ['Focus', 'Will', 'Create', 'Discipline', 'Magic', 'Vigor'],
    now: [78, 65, 90, 54, 82, 71],
    season: [52, 48, 70, 40, 60, 55],
  },

  // ── ACTIVITY HEATMAP (18 weeks × 7 days, intensity 0-4) ───────────────
  // generated deterministically below
  heatmap: (() => {
    const weeks = 18,
      days = 7;
    const grid = [];
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < days; d++) {
        const recency = w / weeks; // ramps up over the season
        const weekend = d >= 5 ? 0.25 : 0; // slightly lower on weekends
        const r = rnd() + recency * 0.9 - weekend;
        let lvl = 0;
        if (r > 0.45) lvl = 1;
        if (r > 0.75) lvl = 2;
        if (r > 1.05) lvl = 3;
        if (r > 1.3) lvl = 4;
        col.push(lvl);
      }
      grid.push(col);
    }
    return grid;
  })(),
  heatmapMonths: ['Feb', 'Mar', 'Apr', 'May'],

  // ── REALM MAP (geographic) ────────────────────────────────────────────
  realms: [
    {
      id: 'focus',
      name: 'Focus Citadel',
      x: 28,
      y: 34,
      activity: 92,
      status: 'thriving',
      quests: 312,
    },
    {
      id: 'habit',
      name: 'Vale of Habits',
      x: 62,
      y: 22,
      activity: 84,
      status: 'thriving',
      quests: 268,
    },
    {
      id: 'create',
      name: 'Creative Wilds',
      x: 78,
      y: 58,
      activity: 71,
      status: 'active',
      quests: 196,
    },
    {
      id: 'reflect',
      name: 'Library of Reflection',
      x: 18,
      y: 66,
      activity: 48,
      status: 'active',
      quests: 142,
    },
    {
      id: 'admin',
      name: 'Inbox Marches',
      x: 48,
      y: 74,
      activity: 63,
      status: 'active',
      quests: 224,
    },
    {
      id: 'health',
      name: 'Verdant Reaches',
      x: 84,
      y: 30,
      activity: 39,
      status: 'fading',
      quests: 142,
    },
  ],

  // ── ORACLE / AI INSIGHTS ──────────────────────────────────────────────
  insights: [
    {
      icon: '✦',
      tone: 'violet',
      confidence: 94,
      tag: 'Pattern Detected',
      title: 'Your focus peaks at dawn',
      body: 'Deep-work quests completed before 09:00 yield 34% more XP on average. The System recommends front-loading S-Rank quests into the morning bell.',
    },
    {
      icon: '⚠',
      tone: 'gold',
      confidence: 81,
      tag: 'Streak Forecast',
      title: '78-day streak at low risk',
      body: 'Based on recent cadence, your streak has a 91% chance of surviving the week. One unfinished health quest on weekends is the sole vulnerability.',
    },
    {
      icon: '◈',
      tone: 'cyan',
      confidence: 88,
      tag: 'Growth Opportunity',
      title: 'Discipline lags the party',
      body: "Discipline (54) trails your other attributes by 19 points. Three consecutive morning rituals would close the gap and unlock the 'Ironclad' rune.",
    },
  ],

  // ── MILESTONE TIMELINE ────────────────────────────────────────────────
  milestones: [
    { day: 'Day 7', label: 'First Week Streak', icon: '🔥', reached: true },
    { day: 'Day 21', label: 'Reached Level 15', icon: '⭐', reached: true },
    { day: 'Day 40', label: 'S-Rank Unlocked', icon: '⚡', reached: true },
    { day: 'Day 64', label: '1,000 Quests Cleared', icon: '🗡', reached: true },
    { day: 'Day 78', label: 'Shadow Weaver Title', icon: '🌙', reached: true },
    { day: 'Day 90', label: 'Reach Level 30', icon: '👑', reached: false },
  ],

  // ── GUILD LEADERBOARD ─────────────────────────────────────────────────
  leaderboard: [
    {
      rank: 1,
      name: 'Kaede Oda',
      cls: 'Rogue',
      level: 31,
      xp: 62400,
      delta: +2,
      online: true,
      hue: 162,
      you: false,
    },
    {
      rank: 2,
      name: 'Aria Solveig',
      cls: 'Mage',
      level: 24,
      xp: 48720,
      delta: +1,
      online: true,
      hue: 295,
      you: true,
    },
    {
      rank: 3,
      name: 'Tora Saito',
      cls: 'Sage',
      level: 42,
      xp: 47180,
      delta: -1,
      online: false,
      hue: 85,
      you: false,
    },
    {
      rank: 4,
      name: 'Rin Aoyama',
      cls: 'Knight',
      level: 19,
      xp: 38940,
      delta: +3,
      online: true,
      hue: 5,
      you: false,
    },
    {
      rank: 5,
      name: 'Yuki Mori',
      cls: 'Cleric',
      level: 27,
      xp: 35610,
      delta: 0,
      online: false,
      hue: 205,
      you: false,
    },
    {
      rank: 6,
      name: 'Daichi Sato',
      cls: 'Ranger',
      level: 22,
      xp: 31200,
      delta: -2,
      online: true,
      hue: 130,
      you: false,
    },
  ],

  // ── ACTIVITY FEED (live pulse) ────────────────────────────────────────
  feed: [
    {
      tone: 'mint',
      icon: '✓',
      title: 'Quest Vanquished',
      body: 'Deep Work Session · +120 XP · +30 🪙',
      time: '2m ago',
      live: true,
    },
    {
      tone: 'violet',
      icon: '★',
      title: 'Achievement Unlocked',
      body: '"Shadow Weaver" — earn your seasonal title',
      time: '1h ago',
      live: false,
    },
    {
      tone: 'gold',
      icon: '▲',
      title: 'Level Up',
      body: 'Reached Level 24 · +3 attribute points',
      time: '3h ago',
      live: false,
    },
    {
      tone: 'cyan',
      icon: '◷',
      title: 'Focus Block Logged',
      body: '2h 15m uninterrupted · Focus +4',
      time: '5h ago',
      live: false,
    },
    {
      tone: 'rose',
      icon: '♡',
      title: 'Reward Claimed',
      body: 'Crystal of Focus · 60 💠 spent',
      time: 'Yesterday',
      live: false,
    },
    {
      tone: 'crimson',
      icon: '⚠',
      title: 'Penalty Cleared',
      body: 'Tier I corrective quest completed',
      time: 'Yesterday',
      live: false,
    },
  ],
};

Object.assign(window, { ANALYTICS_DATA });
