export interface HeroAccent {
  id: string;
  name: string;
  glow: string;
  fill: string;
}

export interface HeroClass {
  id: string;
  name: string;
  glyph: string;
  tagline: string;
  blurb: string;
  bias: string;
  color: string;
}

export interface HeroCompanion {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
  bonus: string;
  tone: string;
}

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface HeroBadge {
  id: string;
  name: string;
  glyph: string;
  era: string;
  rarity: BadgeRarity;
  color: string;
}

export interface HeroFocus {
  id: string;
  name: string;
  glyph: string;
  blurb: string;
}

export interface HeroRank {
  minLv: number;
  name: string;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  lumen: number;
  completed: number;
  legendary: number;
  season: string;
}

export const HERO_ACCENTS: HeroAccent[] = [
  { id: 'amber',   name: 'Amber',   glow: 'oklch(0.78 0.16 82)',  fill: 'oklch(0.55 0.12 82)' },
  { id: 'aurora',  name: 'Aurora',  glow: 'oklch(0.68 0.22 295)', fill: 'oklch(0.45 0.18 295)' },
  { id: 'teal',    name: 'Teal',    glow: 'oklch(0.78 0.16 205)', fill: 'oklch(0.52 0.12 205)' },
  { id: 'rose',    name: 'Rose',    glow: 'oklch(0.74 0.18 5)',   fill: 'oklch(0.48 0.14 5)' },
  { id: 'jade',    name: 'Jade',    glow: 'oklch(0.76 0.14 162)', fill: 'oklch(0.50 0.10 162)' },
  { id: 'crimson', name: 'Crimson', glow: 'oklch(0.62 0.24 22)',  fill: 'oklch(0.42 0.18 22)' },
];

export const HERO_CLASSES: HeroClass[] = [
  {
    id: 'scribe',
    name: 'Scribe',
    glyph: '✍',
    tagline: 'The Patient Chronicler',
    blurb: 'You wield knowledge like a blade. Writing, reading, and deep reflection are your primary weapons.',
    bias: 'wisdom',
    color: 'amber',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    glyph: '🏹',
    tagline: 'The Tireless Wanderer',
    blurb: 'Movement is your meditation. You find clarity through physical challenge and time spent outdoors.',
    bias: 'endurance',
    color: 'jade',
  },
  {
    id: 'artificer',
    name: 'Artificer',
    glyph: '⚙',
    tagline: 'The Relentless Maker',
    blurb: 'You build worlds with your hands. Every project is a quest, every shipped feature a victory.',
    bias: 'composition',
    color: 'teal',
  },
  {
    id: 'warden',
    name: 'Warden',
    glyph: '☯',
    tagline: 'The Balanced Keeper',
    blurb: 'You guard the equilibrium between effort and rest, between growth and peace. Balance is your strength.',
    bias: 'serenity',
    color: 'aurora',
  },
  {
    id: 'sage',
    name: 'Sage',
    glyph: '🔮',
    tagline: 'The Seeking Mind',
    blurb: 'Every moment is a lesson. You pursue mastery across disciplines and honour the long arc of learning.',
    bias: 'wisdom',
    color: 'crimson',
  },
  {
    id: 'forgeborn',
    name: 'Forgeborn',
    glyph: '⚔',
    tagline: 'The Driven Executor',
    blurb: 'Ambition forged into action. You do not wait for the perfect moment — you make it.',
    bias: 'discipline',
    color: 'rose',
  },
];

export const HERO_COMPANIONS: HeroCompanion[] = [
  {
    id: 'fox',
    name: 'The Midnight Fox',
    glyph: '🦊',
    blurb: 'A cunning guide who appears when you are lost. She rewards adaptability and lateral thinking.',
    bonus: '+15% XP on creative solutions',
    tone: 'amber',
  },
  {
    id: 'crane',
    name: 'The Crane of Stillness',
    glyph: '🕊',
    blurb: 'Patient beyond measure. He grants clarity in moments of overwhelm and buffs rest-based recovery.',
    bonus: '+20% streak protection on rest days',
    tone: 'teal',
  },
  {
    id: 'wolf',
    name: 'The Iron Wolf',
    glyph: '🐺',
    blurb: 'She runs alongside you through every early morning. Discipline and endurance are her gifts.',
    bonus: '+10% XP on physical quests',
    tone: 'jade',
  },
  {
    id: 'owl',
    name: 'The Ember Owl',
    glyph: '🦉',
    blurb: 'A scholar of the in-between hours. He watches you study late and amplifies knowledge quests.',
    bonus: '+12% XP on learning milestones',
    tone: 'crimson',
  },
  {
    id: 'phoenix',
    name: 'The Reborn Phoenix',
    glyph: '🔥',
    blurb: 'She has seen you fall and rise. Every time you restart after a break, she burns brighter.',
    bonus: 'Restore 50% streak on comeback week',
    tone: 'rose',
  },
];

export const HERO_FOCUSES: HeroFocus[] = [
  { id: 'mind',    name: 'Mind',    glyph: '📖', blurb: 'Study · reading · language · skill' },
  { id: 'body',    name: 'Body',    glyph: '⚡', blurb: 'Exercise · sleep · nutrition · health' },
  { id: 'craft',   name: 'Craft',   glyph: '🛠', blurb: 'Building · shipping · making · design' },
  { id: 'spirit',  name: 'Spirit',  glyph: '🌙', blurb: 'Meditation · reflection · journaling' },
  { id: 'bond',    name: 'Bond',    glyph: '🤝', blurb: 'Relationships · community · mentoring' },
  { id: 'purpose', name: 'Purpose', glyph: '🎯', blurb: 'Vision · legacy · long-arc goals' },
  { id: 'wealth',  name: 'Wealth',  glyph: '💎', blurb: 'Finance · investments · income streams' },
  { id: 'flow',    name: 'Flow',    glyph: '🌊', blurb: 'Creativity · art · music · expression' },
  { id: 'system',  name: 'System',  glyph: '⚙', blurb: 'Habits · routines · automation · order' },
];

export const HERO_BADGES: HeroBadge[] = [
  { id: 'first-light',    name: 'First Light',       glyph: '🌅', era: 'Origins',   rarity: 'common',    color: 'amber' },
  { id: 'week-strider',   name: 'Week Strider',      glyph: '📅', era: 'Season I',  rarity: 'uncommon',  color: 'teal' },
  { id: 'dawn-rite',      name: 'Dawn Rite',         glyph: '☀',  era: 'Season I',  rarity: 'common',    color: 'amber' },
  { id: 'month-guardian', name: 'Month Guardian',    glyph: '🛡', era: 'Season I',  rarity: 'rare',      color: 'teal' },
  { id: 'century-keeper', name: 'Century Keeper',    glyph: '💯', era: 'Founding',  rarity: 'epic',      color: 'aurora' },
  { id: 'forge-champion', name: 'Forge Champion',    glyph: '⚔',  era: 'Season II', rarity: 'rare',      color: 'rose' },
  { id: 'quiet-mind',     name: 'Quiet Mind',        glyph: '🧘', era: 'Season II', rarity: 'uncommon',  color: 'jade' },
  { id: 'iron-will',      name: 'Iron Will',         glyph: '⚡', era: 'Season II', rarity: 'rare',      color: 'crimson' },
  { id: 'sage-seasons',   name: 'Sage of Seasons',   glyph: '🍂', era: 'Season III',rarity: 'epic',      color: 'amber' },
  { id: 'mythic-seal',    name: 'The Mythic Seal',   glyph: '✦',  era: 'Ancient',   rarity: 'legendary', color: 'amber' },
  { id: 'eternal-flame',  name: 'Eternal Flame',     glyph: '🔥', era: 'Ancient',   rarity: 'legendary', color: 'crimson' },
  { id: 'twilight-scholar',name: 'Twilight Scholar', glyph: '🌙', era: 'Season I',  rarity: 'uncommon',  color: 'aurora' },
];

export const HERO_RANKS: HeroRank[] = [
  { minLv: 0,   name: 'Initiate' },
  { minLv: 5,   name: 'Wayfarer' },
  { minLv: 10,  name: 'Seeker' },
  { minLv: 20,  name: 'Adept' },
  { minLv: 30,  name: 'Veteran' },
  { minLv: 50,  name: 'Champion' },
  { minLv: 75,  name: 'Legend' },
  { minLv: 100, name: 'Mythic' },
];

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  level: 12,
  xp: 3240,
  xpToNext: 5000,
  streak: 23,
  lumen: 1840,
  completed: 127,
  legendary: 3,
  season: 'Season III · The Wandering Tide',
};

export function findAccent(id: string): HeroAccent {
  return HERO_ACCENTS.find((a) => a.id === id) ?? HERO_ACCENTS[0]!;
}

export function findClass(id: string): HeroClass {
  return HERO_CLASSES.find((c) => c.id === id) ?? HERO_CLASSES[0]!;
}

export function findCompanion(id: string): HeroCompanion {
  return HERO_COMPANIONS.find((c) => c.id === id) ?? HERO_COMPANIONS[0]!;
}

export function findBadge(id: string): HeroBadge | undefined {
  return HERO_BADGES.find((b) => b.id === id);
}

export function findFocus(id: string): HeroFocus | undefined {
  return HERO_FOCUSES.find((f) => f.id === id);
}

export function findRank(level: number): HeroRank {
  const rank = [...HERO_RANKS].reverse().find((r) => level >= r.minLv);
  return rank ?? HERO_RANKS[0]!;
}
