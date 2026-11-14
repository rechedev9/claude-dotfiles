import type { FileChange, GitSnapshot } from '../types'

type Run = (argv: readonly string[]) => Promise<{ exitCode: number; stdout: string }>

const BRANCH_LINE = /^## (.+?)(?:\.\.\.(\S+))?(?: \[(.+)\])?$/

function count(label: string, text: string): number {
  const found = new RegExp(`${label} (\\d+)`).exec(text)

  return found === null ? 0 : Number(found[1])
}

function parseStatus(stdout: string): Omit<GitSnapshot, 'isRepo' | 'lastCommit'> {
  const lines = stdout.split('\n').filter(line => line.length > 0)
  const head = BRANCH_LINE.exec(lines[0] ?? '')
  const tracking = head?.[3] ?? ''
  const files: FileChange[] = lines.slice(1).map(line => ({
    code: line.slice(0, 2).trim() || '?',
    path: line.slice(3),
    added: 0,
    removed: 0,
  }))

  return {
    branch: head?.[1] ?? 'HEAD',
    upstream: head?.[2] ?? '',
    ahead: count('ahead', tracking),
    behind: count('behind', tracking),
    files,
  }
}

function addNumstat(files: FileChange[], stdout: string): FileChange[] {
  const counts = new Map<string, [number, number]>()

  for (const line of stdout.split('\n')) {
    const [added, removed, path] = line.split('\t')

    if (path !== undefined) {
      counts.set(path, [Number(added) || 0, Number(removed) || 0])
    }
  }

  return files.map(file => {
    const pair = counts.get(file.path)

    return pair === undefined ? file : { ...file, added: pair[0], removed: pair[1] }
  })
}

export async function readGit(run: Run): Promise<GitSnapshot> {
  const status = await run(['git', 'status', '--porcelain=v1', '--branch', '--untracked-files=normal'])

  if (status.exitCode !== 0) {
    return { isRepo: false, branch: '', upstream: '', ahead: 0, behind: 0, lastCommit: '', files: [] }
  }

  const parsed = parseStatus(status.stdout)
  const noDiff = { exitCode: 0, stdout: '' }
  const [numstat, log] = await Promise.all([
    parsed.files.length === 0 ? noDiff : run(['git', 'diff', '--numstat', 'HEAD']),
    run(['git', 'log', '-1', '--format=%h %s']),
  ])

  return {
    ...parsed,
    isRepo: true,
    files: addNumstat(parsed.files, numstat.stdout),
    lastCommit: log.stdout.trim(),
  }
}
