import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, SessionDetail, DashboardSummary } from '@/types'

type Theme = 'dark' | 'light' | 'system'

// Helper function to apply theme to DOM
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  } else {
    root.classList.add(theme)
  }
}

interface AppState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void

  // Current platform
  currentPlatform: string
  setCurrentPlatform: (platform: string) => void

  // Sessions
  sessions: Session[]
  setSessions: (sessions: Session[]) => void
  updateSession: (sessionKey: string, updates: Partial<Session>) => void
  selectedSessionKey: string | null
  setSelectedSessionKey: (key: string | null) => void

  // Session detail
  sessionDetail: SessionDetail | null
  setSessionDetail: (detail: SessionDetail | null) => void

  // Dashboard
  dashboard: DashboardSummary | null
  setDashboard: (dashboard: DashboardSummary | null) => void

  // Filters
  roleFilter: 'all' | 'user' | 'assistant' | 'thinking'
  setRoleFilter: (filter: 'all' | 'user' | 'assistant' | 'thinking') => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Edit modal
  editingBlock: { id: string; content: string; role: string } | null
  setEditingBlock: (block: { id: string; content: string; role: string } | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Platform
      currentPlatform: 'claude',
      setCurrentPlatform: (platform) => set({ currentPlatform: platform }),

      // Sessions
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      updateSession: (sessionKey, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionKey === sessionKey ? { ...s, ...updates } : s
          ),
        })),
      selectedSessionKey: null,
      setSelectedSessionKey: (key) => set({ selectedSessionKey: key }),

      // Session detail
      sessionDetail: null,
      setSessionDetail: (detail) => set({ sessionDetail: detail }),

      // Dashboard
      dashboard: null,
      setDashboard: (dashboard) => set({ dashboard }),

      // Filters
      roleFilter: 'all',
      setRoleFilter: (filter) => set({ roleFilter: filter }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Edit modal
      editingBlock: null,
      setEditingBlock: (block) => set({ editingBlock: block }),

      // Edit log
      editLog: [],
      setEditLog: (logs) => set({ editLog: logs }),
      showEditLog: false,
      setShowEditLog: (show) => set({ showEditLog: show }),
    }),
    {
      name: 'memory-forge-storage',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)
