/**
 * Migration: convert task.startTime → a schedule block, then drop the field.
 *
 * Part of the "block-driven scheduling" refactor — see
 * rules/docs/requirements/block-driven-scheduling.md.
 *
 * For each task that still has a `startTime`:
 *   - create a ScheduleBlock { sourceType:'task', date:startDate, startTime,
 *     duration: task.duration ?? 60, status:'planned' } — but only if the task has
 *     no block on that date yet (idempotent / re-runnable)
 *   - $unset the task's `startTime`
 *
 * Reads raw collections so it works after the Mongoose schema dropped the field.
 *
 * Usage:
 *   DRY RUN (default):  npx ts-node scripts/migrate-starttime-to-blocks.ts
 *   APPLY changes:      npx ts-node scripts/migrate-starttime-to-blocks.ts --apply
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });
import mongoose from 'mongoose';

const DEFAULT_DURATION = 60;

interface RawTask {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  startTime?: string;
  duration?: number;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.warn('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database handle');
  console.warn('✅  Connected\n');

  const tasksCol = db.collection<RawTask>('tasks');
  const blocksCol = db.collection('scheduleblocks');

  const tasks = await tasksCol.find({ startTime: { $exists: true } }).toArray();
  console.warn(`📋  Found ${tasks.length} task(s) with a startTime\n`);

  let created = 0;
  let skippedExisting = 0;

  for (const t of tasks) {
    if (!t.startTime) continue;

    // Normalize the block date to UTC-midnight of the task's startDate.
    const d = new Date(t.startDate);
    const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const existing = await blocksCol.findOne({
      sourceType: 'task',
      sourceId: t._id,
      date: { $gte: dayStart, $lt: dayEnd },
    });

    if (existing) {
      skippedExisting++;
      console.warn(
        `  ⏭  "${t.name}" already has a block on ${dayStart.toISOString().slice(0, 10)}`,
      );
    } else {
      created++;
      console.warn(
        `  ＋ "${t.name}" → block ${dayStart.toISOString().slice(0, 10)} ${t.startTime} (${t.duration ?? DEFAULT_DURATION}m)`,
      );
      if (apply) {
        const now = new Date();
        await blocksCol.insertOne({
          userId: t.userId,
          sourceType: 'task',
          sourceId: t._id,
          date: dayStart,
          startTime: t.startTime,
          duration: t.duration ?? DEFAULT_DURATION,
          status: 'planned',
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (apply) {
      await tasksCol.updateOne({ _id: t._id }, { $unset: { startTime: '' } });
    }
  }

  console.warn(`\n📊  Summary:`);
  console.warn(`     Blocks to create : ${created}`);
  console.warn(`     Already blocked  : ${skippedExisting}`);
  console.warn(`     startTime cleared: ${apply ? tasks.length : 0}`);

  if (!apply) {
    console.warn('\n🔍  DRY RUN — no changes written. Pass --apply to apply.\n');
  } else {
    console.warn('\n✅  Migration applied.');
  }

  await mongoose.disconnect();
  console.warn('🔌  Disconnected. Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
