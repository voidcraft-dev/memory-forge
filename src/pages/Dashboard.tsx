import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Clock, TrendingUp, ChevronRight, MessageSquare, Sparkles, RefreshCw } from 'lucide-react'

const platformConfig = {
  claude: { 
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    bg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    ring: 'ring-blue-500/20',
  },
  codex: { 
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    ring: 'ring-orange-500/20',
  },
  opencode: { 
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    ring: 'ring-green-500/20',
  },
}

export function Dashboard() {
  const dashboard = useAppStore((s) => s.dashboard)
  const setDashboard = useAppStore((s) => s.setDashboard)
  const setCurrentPlatform = useAppStore((s) => s.setCurrentPlatform)
  const setSelectedSessionKey = useAppStore((s) => s.setSelectedSessionKey)
  const setSessions = useAppStore((s) => s.setSessions)
  const [loading, setLoading] = useState(false)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await api.getDashboard()
      setDashboard(data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!dashboard) {
      loadDashboard()
    }
  }, [])

  const handleSessionClick = (platform: string, sessionKey: string) => {
    setCurrentPlatform(platform)
    setSelectedSessionKey(sessionKey)
    api.getSessions(platform).then(data => setSessions(data))
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              欢迎使用记忆锻造
            </h1>
            <p className="text-muted-foreground mt-1">管理和编辑你的 AI 对话</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setCurrentPlatform('claude')}>
              <Sparkles className="w-4 h-4" />
              开始使用
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6">
          {dashboard?.platforms.map((platform) => {
            const config = platformConfig[platform.platform as keyof typeof platformConfig] || platformConfig.claude
            return (
              <Card 
                key={platform.platform}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                  "border bg-gradient-to-br from-card to-card/50 backdrop-blur-xl",
                  "hover:shadow-xl hover:shadow-blue-500/10"
                )}
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", config.bg)} />
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
                        {platform.platform}
                      </p>
                      <p className="text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-foreground to-muted-foreground">
                        {platform.count}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {platform.latest ? `最近: ${platform.latest}` : '暂无会话'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                      config.gradient,
                      "shadow-lg",
                      config.ring
                    )}>
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Trend Chart */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>最近 7 天趋势</span>
            </CardTitle>
            {dashboard?.trend && (
              <span className="text-xs text-muted-foreground">
                共 {dashboard.trend.reduce((sum, t) => sum + t.count, 0)} 条会话
              </span>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !dashboard?.trend || dashboard.trend.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                <TrendingUp className="w-8 h-8" />
                <p className="text-sm">暂无趋势数据</p>
              </div>
            ) : (
              <div className="h-52">
                {/* Chart area with fixed pixel heights */}
                <div className="flex items-end justify-between gap-3 h-[180px]">
                  {dashboard.trend.map((item, i) => {
                    const maxCount = Math.max(...dashboard.trend.map(t => t.count || 0), 1)
                    const barHeight = item.count > 0 ? Math.max((item.count / maxCount) * 160, 12) : 4
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        {/* Hover tooltip */}
                        <div className="mb-1 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                            {item.count} 条
                          </div>
                        </div>
                        {/* Bar */}
                        <div 
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-500 cursor-pointer",
                            item.count > 0 
                              ? "bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 shadow-md shadow-blue-500/20"
                              : "bg-muted",
                            "group-hover:shadow-xl group-hover:shadow-blue-500/40"
                          )}
                          style={{ 
                            height: `${barHeight}px`,
                            minHeight: '4px'
                          }}
                        />
                        {/* Date label */}
                        <span className="text-xs text-muted-foreground/60 mt-2 font-medium">
                          {item.day.slice(5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span>最近会话</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {dashboard?.recentSessions.map((session, i) => {
                  const config = platformConfig[session.platform as keyof typeof platformConfig] || platformConfig.claude
                  return (
                    <div
                      key={i}
                      onClick={() => handleSessionClick(session.platform, session.sessionKey)}
                      className={cn(
                        "group relative p-5 rounded-2xl border cursor-pointer transition-all duration-200",
                        "bg-gradient-to-r from-muted/30 to-transparent",
                        "border-l-4",
                        config.border,
                        "hover:from-muted/50 hover:shadow-lg hover:shadow-blue-500/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            config.gradient,
                            "flex-shrink-0 shadow-lg"
                          )}>
                            <span className="text-white font-bold text-sm">
                              {session.platform[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-foreground truncate">
                                {session.title || session.displayTitle || '未命名会话'}
                              </h4>
                              <Badge variant="outline" className={cn("text-xs uppercase", config.text)}>
                                {session.platform}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground/70 truncate font-mono">
                              {session.cwd || '无工作目录'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground/60">
                            {session.updatedAt}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
