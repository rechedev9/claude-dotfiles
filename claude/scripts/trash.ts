import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type MovePathsToTrashOptions = {
  allowMissing?: boolean;
};

export type MovePathsToTrashResult = {
  moved: string[];
  missing: string[];
  errors: string[];
};

const getTrashDir = (): string => {
  const home = os.homedir();
  if (process.platform === 'darwin' || process.platform === 'win32') {
    return path.join(home, '.Trash');
  }
  return path.join(home, '.local', 'share', 'Trash', 'files');
};

const ensureDirSync = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const uniqueDestPathSync = (trashDir: string, originalName: string): string => {
  const base = path.basename(originalName);
  const ext = path.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;

  let candidate = path.join(trashDir, base);
  if (!fs.existsSync(candidate)) {
    return candidate;
  }

  const nonce = Date.now();
  for (let attempt = 1; attempt < 10_000; attempt += 1) {
    candidate = path.join(trashDir, `${stem}-${nonce}-${attempt}${ext}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find free Trash destination for ${base}`);
};

// Windows marks files like .git objects read-only; rmSync fails on them with EPERM.
const clearReadOnlySync = (targetPath: string): void => {
  const stats = fs.lstatSync(targetPath);
  fs.chmodSync(targetPath, stats.mode | 0o200);
  if (stats.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      clearReadOnlySync(path.join(targetPath, entry));
    }
  }
};

const moveSync = (sourcePath: string, destinationPath: string): void => {
  try {
    fs.renameSync(sourcePath, destinationPath);
  } catch {
    const stats = fs.lstatSync(sourcePath);
    fs.cpSync(sourcePath, destinationPath, { recursive: stats.isDirectory(), errorOnExist: true });
    if (process.platform === 'win32') {
      clearReadOnlySync(sourcePath);
    }
    fs.rmSync(sourcePath, { recursive: stats.isDirectory(), force: true, maxRetries: 3 });
  }
};

export function movePathsToTrash(
  targets: string[],
  cwd: string,
  options: MovePathsToTrashOptions = {}
): MovePathsToTrashResult {
  const result: MovePathsToTrashResult = {
    moved: [],
    missing: [],
    errors: [],
  };

  const trashDir = getTrashDir();
  ensureDirSync(trashDir);

  for (const target of targets) {
    const trimmed = target.trim();
    if (!trimmed) {
      continue;
    }

    const absolutePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
    if (!fs.existsSync(absolutePath)) {
      if (!options.allowMissing) {
        result.missing.push(trimmed);
      }
      continue;
    }

    try {
      // On Windows a directory cannot be moved while any process (including this one) has its cwd inside it.
      const relativeFromTarget = path.relative(absolutePath, process.cwd());
      if (relativeFromTarget === '' || (!relativeFromTarget.startsWith('..') && !path.isAbsolute(relativeFromTarget))) {
        process.chdir(path.dirname(absolutePath));
      }
      const destinationPath = uniqueDestPathSync(trashDir, absolutePath);
      moveSync(absolutePath, destinationPath);
      result.moved.push(trimmed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`rm: ${trimmed}: ${message}`);
    }
  }

  return result;
}

const isCliEntry = (): boolean => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === path.resolve(import.meta.filename);
};

if (isCliEntry()) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error('Usage: trash <path> [<path> ...]');
    process.exit(2);
  }

  const result = movePathsToTrash(targets, process.cwd());
  for (const moved of result.moved) {
    console.log(`Trashed: ${moved}`);
  }
  for (const missing of result.missing) {
    console.error(`trash: not found: ${missing}`);
  }
  for (const error of result.errors) {
    console.error(error);
  }

  if (result.missing.length > 0 || result.errors.length > 0) {
    process.exit(1);
  }
}
