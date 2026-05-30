/**
 * Migration: Backfill startTime for existing tasks
 *
 * Run with:
 *   npx ts-node --project tsconfig.json scripts/migrate-task-starttime.ts
 *
 * What it does:
 *   - Finds all active tasks that have NO startTime set
 *   - Optionally assigns a default startTime based on createdAt hour
 *     (so tasks created in the morning get '09:00', afternoon get '14:00', etc.)
 *   - Prints a summary — does NOT write unless you pass --apply
 *
 * Usage:
 *   DRY RUN (default):  npx ts-node scripts/migrate-task-starttime.ts
 *   APPLY changes:      npx ts-node scripts/migrate-task-starttime.ts --apply
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';

// ─── Inline schema (avoids importing Next.js server modules) ──────────────────

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    startTime: { type: String },
    active: { type: Boolean, default: true },
    createdAt: { type: Date },
  },
  { timestamps: true, strict: false },
);

const Task =
  (mongoose.models['Task'] as mongoose.Model<mongoose.Document>) ??
  mongoose.model('Task', taskSchema);

// ─── Slot helpers ─────────────────────────────────────────────────────────────

/**
 * Maps an hour (0-23) to the default startTime for that slot:
 *   Dawn (06-10)       → '06:00'
 *   Deep Work (10-13)  → '10:00'
 *   Afternoon (13-17)  → '13:00'
 *   Twilight (17-22)   → '17:00'
 *   Outside hours      → no assignment (returns null)
 */
function hourToDefaultSlotTime(hour: number): string | null {
  if (hour >= 6 && hour < 10) return '06:00';
  if (hour >= 10 && hour < 13) return '10:00';
  if (hour >= 13 && hour < 17) return '13:00';
  if (hour >= 17 && hour < 22) return '17:00';
  return null; // midnight–6 or 22+ → skip, leave unset
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apply = process.argv.includes('--apply');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.warn('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.warn('✅  Connected\n');

  // Find tasks with no startTime
  const tasks = await Task.find({ active: true, startTime: { $exists: false } }).lean();
  console.warn(`📋  Found ${tasks.length} task(s) without startTime\n`);

  let willUpdate = 0;
  let willSkip = 0;

  const updates: Array<{ id: string; name: string; startTime: string }> = [];

  for (const t of tasks) {
    const doc = t as unknown as { _id: mongoose.Types.ObjectId; name: string; createdAt?: Date };
    const createdHour = doc.createdAt ? doc.createdAt.getHours() : 9;
    const defaultTime = hourToDefaultSlotTime(createdHour);

    if (defaultTime) {
      updates.push({ id: doc._id.toString(), name: doc.name, startTime: defaultTime });
      willUpdate++;
    } else {
      console.warn(
        `  ⏭  Skipping "${doc.name}" (created at ${createdHour}:xx — outside slot hours)`,
      );
      willSkip++;
    }
  }

  console.warn(`\n📊  Summary:`);
  console.warn(`     Will update : ${willUpdate}`);
  console.warn(`     Will skip   : ${willSkip}`);

  if (!apply) {
    console.warn('\n🔍  DRY RUN — no changes written.');
    console.warn('    Pass --apply to apply changes.\n');
    console.warn('   Planned updates:');
    for (const u of updates) {
      console.warn(`     [${u.id}]  "${u.name}"  →  startTime: ${u.startTime}`);
    }
  } else {
    console.warn('\n✏️   Applying updates…');
    let done = 0;
    for (const u of updates) {
      await Task.findByIdAndUpdate(u.id, { $set: { startTime: u.startTime } });
      done++;
      if (done % 50 === 0) console.warn(`     ${done}/${updates.length}…`);
    }
    console.warn(`✅  Updated ${done} task(s).`);
  }

  await mongoose.disconnect();
  console.warn('\n🔌  Disconnected. Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
