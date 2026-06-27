/**
 * Rename SVG icons that were exported with a leading `Name=` prefix.
 *
 * Some icons in public/icons come out of the design tool named like
 * `Name=GiCutDiamond.svg`. This strips the `Name=` prefix so the file is just
 * `GiCutDiamond.svg`.
 *
 * Idempotent / re-runnable: files without the prefix are skipped, and it refuses
 * to overwrite an existing target.
 *
 * Usage:
 *   DRY RUN (default):  npx ts-node scripts/rename-icons.ts
 *   APPLY changes:      npx ts-node scripts/rename-icons.ts --apply
 */

import { existsSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const ICONS_DIR = join(process.cwd(), 'public', 'icons');
const PREFIX = 'Name=';

const apply = process.argv.includes('--apply');

function main(): void {
  if (!existsSync(ICONS_DIR)) {
    console.error(`✗ Folder not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const targets = readdirSync(ICONS_DIR).filter(
    (f) => f.toLowerCase().endsWith('.svg') && f.startsWith(PREFIX),
  );

  if (targets.length === 0) {
    console.log(`Nothing to rename — no .svg files start with "${PREFIX}".`);
    return;
  }

  console.log(`${apply ? 'Renaming' : 'DRY RUN —'} ${targets.length} file(s) in public/icons:\n`);

  let renamed = 0;
  for (const oldName of targets) {
    const newName = oldName.slice(PREFIX.length);

    if (existsSync(join(ICONS_DIR, newName))) {
      console.log(`  ⏭  "${oldName}" → "${newName}" (target already exists, skipped)`);
      continue;
    }

    if (apply) {
      renameSync(join(ICONS_DIR, oldName), join(ICONS_DIR, newName));
    }
    console.log(`  ${apply ? '✓' : '＋'} "${oldName}" → "${newName}"`);
    renamed++;
  }

  console.log(
    `\n${apply ? `Done — renamed ${renamed} file(s).` : `Would rename ${renamed} file(s). Re-run with --apply to do it.`}`,
  );
}

main();
