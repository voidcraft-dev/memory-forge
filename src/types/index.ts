// Session types
export interface Session {
  platform: string
  sessionKey: string
  sessionId: string
  displayTitle: string
  aliasTitle: string
  preview: string
  updatedAt: string
  cwd: string
  editable: boolean
}

export interface TimelineBlock {
  id: string
  role: 'user' | 'assistant' | 'thinking'
  content: string
  editable: boolean
  editTarget: string
  sourceMeta: Record<string, unknown>
}

export interface SessionDetail {
  platform: string
  sessionKey: string
  sessionId: string
  title: string
  aliasTitle: string
  cwd: string
  commands: Record<string, string>
  blocks: TimelineBlock[]
}

export interface PlatformSummary {
  platform: string
  count: number
  latest: string
  items: Session[]
}

export interface EditLogEntry {
  id: number
  editTarget: string
  oldContent: string
  newContent: string
  createdAt: string
}

export interface DashboardSummary {
  platforms: PlatformSummary[]
  trend: Array<{ day: string; count: number }>
  recentSessions: Session[]
}

// Prompt types
export interface PromptItem {
  id: number
  name: string
  content: string
  tags: string[]
  useCount: number
  createdAt: string
  updatedAt: string
}
