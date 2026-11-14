export type Tab = 'status' | 'changes' | 'todo'

export type FileChange = { path: string; code: string; added: number; removed: number }

export type GitSnapshot = {
  isRepo: boolean
  branch: string
  upstream: string
  ahead: number
  behind: number
  lastCommit: string
  files: FileChange[]
}

export type Todo = { content: string; status: 'pending' | 'in_progress' | 'completed' }

declare module 'claude-code' {
  interface PluginState {
    gentle: {
      tab: Tab
      git: Shaped<GitSnapshot | null>
      todos: Shaped<Todo[]>
      tools: number
    }
  }
}
