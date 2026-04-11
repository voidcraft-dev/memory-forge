import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { SessionList } from '@/components/session/SessionList'
import { SessionDetail } from '@/components/session/SessionDetail'
import { EditLogPanel } from '@/components/session/EditLogPanel'
import { Dashboard } from '@/pages/Dashboard'
import { About } from '@/pages/About'

// Helper function to apply theme to DOM
function applyTheme(theme: 'dark' | 'light' | 'system') {
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

function App() {
  const currentPlatform = useAppStore((s) => s.currentPlatform)
  const theme = useAppStore((s) => s.theme)

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session List */}
        {currentPlatform !== 'dashboard' && currentPlatform !== 'about' && (
          <SessionList />
        )}

        {/* Detail / Dashboard / About */}
        {currentPlatform === 'dashboard' ? (
          <Dashboard />
        ) : currentPlatform === 'about' ? (
          <About />
        ) : (
          <SessionDetail />
        )}

        {/* Edit Log Panel */}
        {currentPlatform !== 'dashboard' && currentPlatform !== 'about' && <EditLogPanel />}
      </div>
    </div>
  )
}

export default App
