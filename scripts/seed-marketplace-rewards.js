/**
 * Seed the real Reward catalog (used by /manage/rewards) from the marketplace mock data
 * (src/features/marketplace/data/mock.ts), for a single target user.
 *
 * The real `Reward` schema has no category/currency-agnostic/achievement-gating concepts the
 * mock data uses, so this seed:
 *   - maps mock `rarity: 'mythic'` -> 'legendary' (real enum has no 'mythic')
 *   - maps mock `currency: 'coins'|'gems'` -> `coinCost`/`gemCost`
 *   - maps mock `reqLevel` -> `unlockCondition.minLevel` (omitted when reqLevel <= 1)
 *   - maps mock `stock: <number>` -> `status: 'limited'` + `stock`; `stock: null` -> 'active'
 *   - strips the "[SEALED] " description prefix (no lock-reason field in the real schema)
 *   - assigns a `color` per mock category, purely for visual variety (real schema has no
 *     category field at all)
 *   - SKIPS the 3 mock items priced in 'achievement' currency (q1/q2/q4) — no equivalent
 *     unlock mechanic exists in the real schema
 *
 * Idempotent: skips any (userId, name) pair that already exists.
 *
 * Usage:
 *   DRY RUN (default):  node --env-file=.env.local scripts/seed-marketplace-rewards.js
 *   APPLY changes:      node --env-file=.env.local scripts/seed-marketplace-rewards.js --apply
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose');

const TARGET_EMAIL = 'bachthanhlong0821@gmail.com';
const APPLY = process.argv.includes('--apply');

const REWARD_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'];
const REWARD_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const REWARD_STATUSES = ['active', 'inactive', 'limited', 'sold_out'];

const unlockConditionSchema = new mongoose.Schema(
  { minLevel: { type: Number, min: 1 }, minRank: { type: String, trim: true } },
  { _id: false },
);

const rewardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, trim: true, maxlength: 10 },
    color: { type: String, enum: REWARD_COLORS, required: true, default: 'gold' },
    rarity: { type: String, enum: REWARD_RARITIES, required: true, default: 'common' },
    status: { type: String, enum: REWARD_STATUSES, required: true, default: 'active' },
    coinCost: { type: Number, min: 0 },
    gemCost: { type: Number, min: 0 },
    unlockCondition: { type: unlockConditionSchema },
    stock: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const RewardModel = mongoose.model('Reward', rewardSchema);

// Mirrors src/features/marketplace/data/mock.ts REWARD_DATA.rewards, minus the 3
// achievement-currency items (q1, q2, q4) — see file header.
const MOCK_REWARDS = [
  // REAL-WORLD — color: amber
  {
    id: 'r1',
    cat: 'real',
    title: 'Mechanical Keyboard',
    icon: '⌨️',
    rarity: 'epic',
    price: 1800,
    currency: 'coins',
    reqLevel: 20,
    desc: "Tactile clicky switches. RGB-lit. The Scribe's Choice.",
    stock: 3,
  },
  {
    id: 'r2',
    cat: 'real',
    title: 'Artisan Coffee Beans',
    icon: '☕',
    rarity: 'rare',
    price: 320,
    currency: 'coins',
    reqLevel: 5,
    desc: 'Premium beans from a remote highland village. +Focus boost.',
    stock: 12,
  },
  {
    id: 'r3',
    cat: 'real',
    title: 'Leather Journal',
    icon: '📓',
    rarity: 'uncommon',
    price: 180,
    currency: 'coins',
    reqLevel: 1,
    desc: 'Hand-bound leather. 240 pages. The Quest Logger.',
    stock: 24,
  },
  {
    id: 'r4',
    cat: 'real',
    title: "Sage's Reading Lamp",
    icon: '💡',
    rarity: 'rare',
    price: 540,
    currency: 'coins',
    reqLevel: 10,
    desc: 'Adaptive warm/cool lighting. Touch-controlled.',
    stock: 7,
  },
  {
    id: 'r5',
    cat: 'real',
    title: 'Phantom Mouse',
    icon: '🖱️',
    rarity: 'epic',
    price: 1200,
    currency: 'coins',
    reqLevel: 18,
    desc: 'Ultralight. 16K DPI. Wireless. The Click of Champions.',
    stock: 5,
  },
  {
    id: 'r6',
    cat: 'real',
    title: "Hero's Tea Set",
    icon: '🍵',
    rarity: 'uncommon',
    price: 240,
    currency: 'coins',
    reqLevel: 4,
    desc: 'Ceramic teapot + 2 cups. Restorative ritual companion.',
    stock: 18,
  },
  // COSMETICS — color: violet
  {
    id: 'c1',
    cat: 'cosmetic',
    title: 'Solar Flare Theme',
    icon: '🌅',
    rarity: 'epic',
    price: 80,
    currency: 'gems',
    reqLevel: 15,
    desc: 'Warm dawn-gradient theme with sun-flare animations.',
    stock: null,
  },
  {
    id: 'c2',
    cat: 'cosmetic',
    title: 'Void Knight Avatar',
    icon: '🛡️',
    rarity: 'legendary',
    price: 150,
    currency: 'gems',
    reqLevel: 22,
    desc: 'Animated armored avatar with floating runes.',
    stock: null,
  },
  {
    id: 'c3',
    cat: 'cosmetic',
    title: 'Sakura Profile Frame',
    icon: '🌸',
    rarity: 'rare',
    price: 40,
    currency: 'gems',
    reqLevel: 8,
    desc: 'Petals drift across your profile in real-time.',
    stock: null,
  },
  {
    id: 'c4',
    cat: 'cosmetic',
    title: 'Holo-Blue Card Skin',
    icon: '💎',
    rarity: 'epic',
    price: 90,
    currency: 'gems',
    reqLevel: 16,
    desc: 'Iridescent holographic shimmer on every quest card.',
    stock: null,
  },
  {
    id: 'c5',
    cat: 'cosmetic',
    title: 'Astral Cursor Trail',
    icon: '✨',
    rarity: 'rare',
    price: 35,
    currency: 'gems',
    reqLevel: 7,
    desc: 'Stardust follows your cursor across the realm.',
    stock: null,
  },
  {
    id: 'c6',
    cat: 'cosmetic',
    title: 'Eclipse Theme',
    icon: '🌑',
    rarity: 'mythic',
    price: 250,
    currency: 'gems',
    reqLevel: 35,
    desc: '[SEALED] Forged in the eye of the eclipse. Only the worthy may glimpse it.',
    stock: null,
  },
  // GAME ITEMS — color: cyan
  {
    id: 'g1',
    cat: 'game',
    title: 'Crystal of Focus',
    icon: '🔮',
    rarity: 'rare',
    price: 60,
    currency: 'gems',
    reqLevel: 10,
    desc: '+25% XP gain on Focus quests for 24h.',
    stock: null,
  },
  {
    id: 'g2',
    cat: 'game',
    title: 'Phoenix Companion',
    icon: '🦅',
    rarity: 'legendary',
    price: 400,
    currency: 'gems',
    reqLevel: 28,
    desc: '[SEALED] A loyal phoenix that revives one failed quest per day.',
    stock: null,
  },
  {
    id: 'g3',
    cat: 'game',
    title: 'Streak Shield',
    icon: '🛡️',
    rarity: 'epic',
    price: 120,
    currency: 'gems',
    reqLevel: 12,
    desc: 'Protects your streak for one missed day. Stackable x3.',
    stock: null,
  },
  {
    id: 'g4',
    cat: 'game',
    title: 'Blade of Discipline',
    icon: '⚔️',
    rarity: 'epic',
    price: 180,
    currency: 'gems',
    reqLevel: 20,
    desc: 'Ceremonial weapon. +5 permanent Discipline stat.',
    stock: null,
  },
  {
    id: 'g5',
    cat: 'game',
    title: 'Mystic Tarot Deck',
    icon: '🎴',
    rarity: 'legendary',
    price: 320,
    currency: 'gems',
    reqLevel: 25,
    desc: 'Draws a daily fortune card. Buffs randomized stats.',
    stock: 1,
  },
  {
    id: 'g6',
    cat: 'game',
    title: 'Dragon Soul Artifact',
    icon: '🐉',
    rarity: 'mythic',
    price: 999,
    currency: 'gems',
    reqLevel: 40,
    desc: '[SEALED] The dragon waits. Prove your worth.',
    stock: 1,
  },
  // BOOSTERS — color: rose
  {
    id: 'b1',
    cat: 'booster',
    title: 'Double XP (24h)',
    icon: '⚡',
    rarity: 'rare',
    price: 80,
    currency: 'gems',
    reqLevel: 5,
    desc: 'All XP gained doubled for 24 hours.',
    stock: null,
  },
  {
    id: 'b2',
    cat: 'booster',
    title: 'Coin Magnet (3 days)',
    icon: '🧲',
    rarity: 'epic',
    price: 150,
    currency: 'gems',
    reqLevel: 12,
    desc: '+50% coin drops from all quests for 3 days.',
    stock: null,
  },
  {
    id: 'b3',
    cat: 'booster',
    title: 'Time Dilation',
    icon: '⏳',
    rarity: 'legendary',
    price: 280,
    currency: 'gems',
    reqLevel: 22,
    desc: 'One quest can be retroactively completed within 12 hours.',
    stock: null,
  },
  {
    id: 'b4',
    cat: 'booster',
    title: 'Penalty Ward',
    icon: '🌟',
    rarity: 'epic',
    price: 200,
    currency: 'gems',
    reqLevel: 18,
    desc: 'Cancels one penalty quest. Use wisely.',
    stock: null,
  },
  // NEW QUESTS — color: mint (q1/q2/q4 skipped — achievement-currency, no real equivalent)
  {
    id: 'q3',
    cat: 'quest',
    title: 'Daily Lottery Tickets',
    icon: '🎟️',
    rarity: 'rare',
    price: 50,
    currency: 'coins',
    reqLevel: 8,
    desc: 'Spin once daily for randomized rewards.',
    stock: null,
  },
];

const COLOR_BY_CAT = {
  real: 'amber',
  cosmetic: 'violet',
  game: 'cyan',
  booster: 'rose',
  quest: 'mint',
};
const RARITY_MAP = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  mythic: 'legendary',
};

function toPayload(mock) {
  const payload = {
    name: mock.title,
    description: mock.desc.replace(/^\[SEALED\]\s*/, ''),
    icon: mock.icon,
    color: COLOR_BY_CAT[mock.cat],
    rarity: RARITY_MAP[mock.rarity],
    status: mock.stock != null ? 'limited' : 'active',
  };
  if (mock.currency === 'coins') payload.coinCost = mock.price;
  if (mock.currency === 'gems') payload.gemCost = mock.price;
  if (mock.reqLevel > 1) payload.unlockCondition = { minLevel: mock.reqLevel };
  if (mock.stock != null) payload.stock = mock.stock;
  return payload;
}

async function main() {
  if (!process.env.MONGODB_URI)
    throw new Error('MONGODB_URI not set — run with --env-file=.env.local');

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await mongoose.connection.db.collection('users').findOne({ email: TARGET_EMAIL });
  if (!user) throw new Error(`No user found with email ${TARGET_EMAIL}`);

  const existing = await RewardModel.find({ userId: user._id }, { name: 1 }).lean();
  const existingNames = new Set(existing.map((r) => r.name));

  const toCreate = [];
  const skipped = [];
  for (const mock of MOCK_REWARDS) {
    const payload = toPayload(mock);
    if (existingNames.has(payload.name)) {
      skipped.push(payload.name);
      continue;
    }
    toCreate.push(payload);
  }

  console.log(`Target user: ${TARGET_EMAIL} (${user._id})`);
  console.log(`Already present, skipping: ${skipped.length ? skipped.join(', ') : '(none)'}`);
  console.log(`${APPLY ? 'Creating' : 'Would create'} ${toCreate.length} reward(s):`);
  toCreate.forEach((p) => {
    const cost = p.coinCost != null ? `${p.coinCost} coins` : `${p.gemCost} gems`;
    console.log(
      `  - ${p.icon ?? '◆'} ${p.name} [${p.rarity}/${p.color}] ${cost}${
        p.unlockCondition ? ` Lv.${p.unlockCondition.minLevel}+` : ''
      }${p.status === 'limited' ? ` (limited, stock ${p.stock})` : ''}`,
    );
  });

  if (APPLY && toCreate.length > 0) {
    await RewardModel.insertMany(toCreate.map((p) => ({ ...p, userId: user._id })));
    console.log(`\nInserted ${toCreate.length} reward(s).`);
  } else if (!APPLY) {
    console.log('\nDry run — no changes made. Re-run with --apply to write.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
