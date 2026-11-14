import type { Todo } from '../types'

type Status = Todo['status']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStatus(value: unknown): Status {
  return value === 'in_progress' || value === 'completed' ? value : 'pending'
}

function toTodos(list: unknown, textKey: string): Todo[] | undefined {
  if (!Array.isArray(list)) {
    return undefined
  }

  return list.filter(isRecord).map(item => ({
    content: String(item[textKey] ?? ''),
    status: toStatus(item.status),
  }))
}

function numbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((n): n is number => typeof n === 'number') : []
}

// The desktop app's plan tool sends a whole list, or `advance` / `done` + `start` (1-based).
function applyPlanStep(todos: Todo[], args: Record<string, unknown>): Todo[] {
  if (args.advance === true) {
    const current = todos.findIndex(todo => todo.status === 'in_progress')
    const nextPending = todos.findIndex((todo, i) => i > current && todo.status === 'pending')

    return todos.map((todo, i) => {
      if (i === current) return { ...todo, status: 'completed' }
      if (i === nextPending) return { ...todo, status: 'in_progress' }

      return todo
    })
  }

  const done = new Set(numbers(args.done).map(n => n - 1))
  const start = typeof args.start === 'number' ? args.start - 1 : -1

  return todos.map((todo, i) => {
    if (done.has(i)) return { ...todo, status: 'completed' }
    if (i === start) return { ...todo, status: 'in_progress' }

    return todo
  })
}

export function nextTodos(tool: string, args: unknown, todos: Todo[]): Todo[] | undefined {
  if (!isRecord(args)) {
    return undefined
  }

  if (tool === 'TodoWrite') {
    return toTodos(args.todos, 'content')
  }

  if (tool.endsWith('__update_plan')) {
    return toTodos(args.items, 'content') ?? applyPlanStep(todos, args)
  }

  return undefined
}
