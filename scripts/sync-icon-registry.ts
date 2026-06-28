/**
 * Sync the `ICON_FILES` registry with the files that exist in `public/icons`.
 *
 * Supported asset types:
 * - `.svg`
 * - `.png`
 *
 * Usage:
 *   npx ts-node scripts/sync-icon-registry.ts
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const ICONS_DIR = join(process.cwd(), 'public', 'icons');
const REGISTRY_PATH = join(process.cwd(), 'src', 'components', 'common', 'icon-registry.ts');
const SUPPORTED_ICON_EXTENSIONS = new Set(['.png', '.svg']);
const ICON_FILES_BLOCK_REGEX = /const ICON_FILES = \[[\s\S]*?\] as const;/;

function getLineEnding(content: string): string {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function getIconNames(): string[] {
  const iconNames = readdirSync(ICONS_DIR)
    .filter((fileName) => SUPPORTED_ICON_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => basename(fileName, extname(fileName)))
    .sort((left, right) => left.localeCompare(right));

  return [...new Set(iconNames)];
}

function buildIconFilesBlock(iconNames: readonly string[], lineEnding: string): string {
  const entries = iconNames.map((iconName) => `  '${iconName}',`).join(lineEnding);
  return `const ICON_FILES = [${lineEnding}${entries}${lineEnding}] as const;`;
}

function main(): void {
  if (!existsSync(ICONS_DIR)) {
    console.error(`Icon folder not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  if (!existsSync(REGISTRY_PATH)) {
    console.error(`Registry file not found: ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const registrySource = readFileSync(REGISTRY_PATH, 'utf8');
  const lineEnding = getLineEnding(registrySource);

  if (!ICON_FILES_BLOCK_REGEX.test(registrySource)) {
    console.error('Could not find `ICON_FILES` block in icon-registry.ts');
    process.exit(1);
  }

  const iconNames = getIconNames();
  const nextIconFilesBlock = buildIconFilesBlock(iconNames, lineEnding);
  const nextRegistrySource = registrySource.replace(ICON_FILES_BLOCK_REGEX, nextIconFilesBlock);

  if (nextRegistrySource === registrySource) {
    console.log(`ICON_FILES is already up to date (${iconNames.length} icon(s)).`);
    return;
  }

  writeFileSync(REGISTRY_PATH, nextRegistrySource, 'utf8');

  console.log(`Updated ICON_FILES with ${iconNames.length} icon(s):`);
  for (const iconName of iconNames) {
    console.log(`- ${iconName}`);
  }
}

main();
