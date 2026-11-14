import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { FileChange, GitSnapshot, Tab, Todo } from '../types'
import { readGit } from './git.ts'
import { problems, theme } from './palette.ts'
import { nextTodos } from './plan.ts'
import { SCENE } from './scene.ts'

const PANE = 'gentle'
const PINK = '#F095C8'
const ROSE = '#D7A0B8'
const MAX_FILES = 40
const CARD = '#241A22'

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'gentle-night', glass: { blur: 18, tint: '#1A1218', opacity: 0.72 } },
}

const tab = atom({ plugin: 'gentle', key: 'tab' } as const, 'status')
const git = atom({ plugin: 'gentle', key: 'git' } as const, null, { shape: 'git-1' })
const todos = atom({ plugin: 'gentle', key: 'todos' } as const, [], { shape: 'todos-1' })
const tools = atom({ plugin: 'gentle', key: 'tools' } as const, 0)

const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'changes', label: 'Changes' },
  { id: 'todo', label: 'TODO' },
]

const CHANGES_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'Bash', 'PowerShell'])

const MARK: Record<Todo['status'], string> = { completed: '✓', in_progress: '●', pending: '○' }

function totals(files: FileChange[]): { added: number; removed: number } {
  return files.reduce(
    (sum, file) => ({ added: sum.added + file.added, removed: sum.removed + file.removed }),
    { added: 0, removed: 0 },
  )
}

let isRefreshing = false
let isStale = false
let lastSnapshot = ''

// One git read at a time; a request during a read runs one more read after it, never more.
async function refresh($: EngineInterface): Promise<void> {
  if (isRefreshing) {
    isStale = true
    return
  }
  isRefreshing = true

  try {
    do {
      isStale = false
      const snapshot: GitSnapshot = await readGit(argv => $.process.run(argv))
      const key = JSON.stringify(snapshot)

      if (key !== lastSnapshot) {
        lastSnapshot = key
        await update($, git, () => snapshot)
      }
    } while (isStale)
  } finally {
    isRefreshing = false
  }
}

function isPlanTool(tool: string): boolean {
  return tool === 'TodoWrite' || tool.endsWith('__update_plan')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    await $.theme.set(LOOK)
    await $.command.register({ name: 'gentle', description: 'Abre el panel RSN (Status, Changes, TODO)' })
    await $.command.register({ name: 'gentle-off', description: 'Quita el tema Gentle de esta sesión' })
    void $.ui.open({ id: PANE, title: '👒 RSN' })
    void refresh($)

    return next(e)
  })

  on('command.run', { command: 'gentle' }, async $ => {
    void refresh($)
    await $.ui.open({ id: PANE, title: '👒 RSN' })

    return { text: 'Panel RSN abierto.' }
  })

  on('command.run', { command: 'gentle-off' }, async $ => {
    await $.theme.clear()

    return { text: 'Tema Gentle quitado. Vuelve a abrir la sesión para recuperarlo.' }
  })

  on('tool.call', async ($, e, next) => {
    if (isPlanTool(e.tool)) {
      await update($, todos, list => nextTodos(e.tool, e, list) ?? list)
    }

    // The app's wrap-up checks off the whole plan without another plan call.
    if (e.tool.endsWith('__wrap_up')) {
      await update($, todos, list => list.map(item => ({ ...item, status: 'completed' as const })))
    }

    const ran = await next(e)
    await update($, tools, n => n + 1)

    if (CHANGES_TOOLS.has(e.tool)) {
      void refresh($)
    }

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    void refresh($)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== 'gentle-night' || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="Noche ciruela con pétalos rosas cayendo" />
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const current = await read($, tab)
    const snapshot = await read($, git)
    const plan = await read($, todos)
    const toolCount = await read($, tools)
    const done = plan.filter(item => item.status === 'completed').length

    const label = (text: string) => (
      <Text dimColor bold>
        {text.toUpperCase()}
      </Text>
    )

    const tabs = (
      <Box flexDirection="row" gap="sm">
        {TABS.map(one => (
          <Button
            key={`tab-${one.id}`}
            label={one.id === 'todo' && plan.length > 0 ? `${one.label} ${done}/${plan.length}` : one.label}
            variant={one.id === current ? 'primary' : undefined}
            onPress={() => update($, tab, () => one.id)}
          />
        ))}
      </Box>
    )

    let body = <Text dimColor>Leyendo git…</Text>

    if (current === 'status' && snapshot !== null && !snapshot.isRepo) {
      body = <Text dimColor>Esta carpeta no es un repositorio git.</Text>
    }

    if (current === 'status' && snapshot !== null && snapshot.isRepo) {
      const sum = totals(snapshot.files)
      body = (
        <Box flexDirection="column" gap="md">
          <Box flexDirection="column" gap="xs" padding="md" backgroundColor={CARD}>
            {label('Rama')}
            <Text color={PINK} bold wrap="truncate-end">
              ⎇ {snapshot.branch}
            </Text>
            {snapshot.upstream !== '' && (
              <Text dimColor wrap="truncate-end">
                {snapshot.upstream}  ↑{snapshot.ahead} ↓{snapshot.behind}
              </Text>
            )}
          </Box>
          <Box flexDirection="column" gap="xs" padding="md" backgroundColor={CARD}>
            {label('Último commit')}
            <Text wrap="wrap">{snapshot.lastCommit}</Text>
          </Box>
          <Box flexDirection="column" gap="xs" padding="md" backgroundColor={CARD}>
            {label('Sesión')}
            <Text>
              <Text color={ROSE} bold>{snapshot.files.length}</Text> archivos{'   '}
              <Text color="green">+{sum.added}</Text>{' '}
              <Text color="red">-{sum.removed}</Text>
            </Text>
            <Text dimColor>{toolCount} llamadas a herramientas</Text>
          </Box>
        </Box>
      )
    }

    if (current === 'changes' && snapshot !== null) {
      body =
        snapshot.files.length === 0 ? (
          <Text dimColor>Sin cambios sin commitear. 👒</Text>
        ) : (
          <Box flexDirection="column" gap="sm" padding="md" backgroundColor={CARD}>
            {label(`${snapshot.files.length} archivos`)}
            {snapshot.files.slice(0, MAX_FILES).map(file => (
              <Box key={`file-${file.path}`} flexDirection="row" gap="sm">
                <Box width={3}>
                  <Text color={ROSE} bold>{file.code}</Text>
                </Box>
                <Box flexGrow={1} flexShrink={1}>
                  <Text wrap="truncate-start">{file.path}</Text>
                </Box>
                <Text color="green">+{file.added}</Text>
                <Text color="red">-{file.removed}</Text>
              </Box>
            ))}
            {snapshot.files.length > MAX_FILES && (
              <Text dimColor>y {snapshot.files.length - MAX_FILES} más</Text>
            )}
          </Box>
        )
    }

    if (current === 'todo') {
      body =
        plan.length === 0 ? (
          <Text dimColor>Sin plan todavía.</Text>
        ) : (
          <Box flexDirection="column" gap="sm" padding="md" backgroundColor={CARD}>
            {label(`${done} de ${plan.length} hechos`)}
            {plan.map((item, i) => (
              <Box key={`todo-${i}`} flexDirection="row" gap="sm">
                <Box width={2}>
                  <Text color={item.status === 'pending' ? undefined : PINK} dimColor={item.status === 'pending'}>
                    {MARK[item.status]}
                  </Text>
                </Box>
                <Box flexGrow={1} flexShrink={1}>
                  <Text
                    wrap="wrap"
                    color={item.status === 'in_progress' ? PINK : undefined}
                    dimColor={item.status === 'completed'}
                    bold={item.status === 'in_progress'}
                  >
                    {item.content}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )
    }

    return (
      <Box flexDirection="column" gap="lg" paddingX="md" paddingY="sm">
        {tabs}
        {body}
      </Box>
    )
  })
}
