import { useEffect, useRef, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/lib/api'
import { RefreshCw, Search, CheckCircle } from 'lucide-react'
import type { Session } from '@/types'

function formatTime(timestamp: string): string {
  try {
    const num = parseInt(timestamp)
    let date: Date
    
    if (num > 10 ** 17) {
      date = new Date(num / 1_000_000)
    } else if (num > 10 ** 15) {
      date = new Date(num / 1_000)
    } else if (num > 10 ** 12) {
      date = new Date(num)
    } else {
      date = new Date(num * 1000)
    }
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${Math.floor(hours)}h`
    if (hours < 48) return '1d'
    return `${Math.floor(hours / 24)}d`
  } catch {
    return ''
  }
}

const platformColors = {
  claude: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  codex: 'bg-gradient-to-br from-orange-500 to-red-500',
  opencode: 'bg-gradient-to-br from-green-500 to-emerald-600',
}

const platformBorderColors = {
  claude: 'border-l-blue-500',
  codex: 'border-l-orange-500',
  opencode: 'border-l-green-500',
}

export function SessionList() {
  const currentPlatform = useAppStore((s) => s.currentPlatform)
  const sessions = useAppStore((s) => s.sessions)
  const setSessions = useAppStore((s) => s.setSessions)
  const updateSession = useAppStore((s) => s.updateSession)
  const selectedSessionKey = useAppStore((s) => s.selectedSessionKey)
  const setSelectedSessionKey = useAppStore((s) => s.setSelectedSessionKey)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const setSessionDetail = useAppStore((s) => s.setSessionDetail)
  const setEditLog = useAppStore((s) => s.setEditLog)
  const showEditLog = useAppStore((s) => s.showEditLog)

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const debouncedSetSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }, [setSearchQuery])

  // Keep local input value for immediate feedback
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentPlatform === 'dashboard') return
    
    const loadSessions = async () => {
      try {
        const data = await api.getSessions(currentPlatform, searchQuery)
        setSessions(data)
        if (data.length > 0 && !selectedSessionKey) {
          setSelectedSessionKey(data[0].sessionKey)
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
        setSessions([])
      }
    }
    loadSessions()
  }, [currentPlatform, searchQuery])

  useEffect(() => {
    if (!selectedSessionKey || currentPlatform === 'dashboard') return
    
    const loadDetail = async () => {
      try {
        const detail = await api.getSessionDetail(currentPlatform, selectedSessionKey)
        setSessionDetail(detail)
        // Load edit log if panel is open
        if (showEditLog) {
          api.getEditLog(currentPlatform, selectedSessionKey).then(setEditLog).catch(console.error)
        }
        // Update session list with latest alias
        updateSession(selectedSessionKey, { 
          displayTitle: detail.aliasTitle || detail.title,
          aliasTitle: detail.aliasTitle 
        })
      } catch (err) {
        console.error('Failed to load session detail:', err)
      }
    }
    loadDetail()
  }, [selectedSessionKey, currentPlatform])

  const [refreshing, setRefreshing] = useState(false)
  const [refreshDone, setRefreshDone] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshDone(false)
    try {
      const data = await api.getSessions(currentPlatform, searchQuery)
      setSessions(data)
      setRefreshDone(true)
      setTimeout(() => setRefreshDone(false), 1500)
    } catch (err) {
      console.error('Failed to refresh:', err)
    }
    setRefreshing(false)
  }

  if (currentPlatform === 'dashboard') {
    return null
  }

  return (
    <div className="w-96 flex-shrink-0 bg-gradient-to-b from-card to-card/50 border-r border-border/50 flex flex-col backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-lg">
            {currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)} 会话
          </h2>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className={cn("h-8 w-8 transition-all duration-300", refreshDone && "text-green-400")}>
            {refreshDone ? <CheckCircle className="w-4 h-4" /> : <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />}
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="搜索会话..."
            defaultValue={searchQuery}
            onChange={(e) => debouncedSetSearch(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无会话</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.sessionKey}
                session={session}
                isSelected={selectedSessionKey === session.sessionKey}
                onClick={() => setSelectedSessionKey(session.sessionKey)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function SessionCard({ 
  session, 
  isSelected, 
  onClick 
}: { 
  session: Session
  isSelected: boolean
  onClick: () => void
}) {
  const platform = session.platform || 'claude'
  const borderColor = platformBorderColors[platform as keyof typeof platformBorderColors] || platformBorderColors.claude

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-200",
        "bg-gradient-to-r from-muted/30 to-transparent",
        isSelected 
          ? cn(
              "bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/50 shadow-lg shadow-blue-500/10",
              "border-l-blue-500"
            )
          : cn(
              "border-border/50 hover:border-border hover:from-muted/50",
              borderColor
            )
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg",
            platformColors[platform as keyof typeof platformColors] || platformColors.claude
          )}>
            {platform[0].toUpperCase()}
          </span>
          <h3 className={cn(
            "font-semibold text-sm truncate",
            isSelected ? "text-blue-400" : "text-foreground"
          )}>
            {session.displayTitle || session.sessionId || '未命名会话'}
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 bg-muted/30 px-2 py-1 rounded-md">
          {formatTime(session.updatedAt)}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
        {session.preview || '无预览内容'}
      </p>
      
      {session.cwd && (
        <p className="text-[10px] text-muted-foreground/50 mt-2 truncate font-mono">
          {session.cwd}
        </p>
      )}
    </div>
  )
}
