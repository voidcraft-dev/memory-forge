import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/stores/appStore'
import { Sun, Moon, Monitor, LayoutDashboard, ChevronLeft, ChevronRight, Info, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const platforms = [
  { key: 'claude', name: 'Claude', icon: 'C', color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  { key: 'codex', name: 'Codex', icon: 'X', color: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { key: 'opencode', name: 'OpenCode', icon: 'O', color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
]

export function Sidebar() {
  const currentPlatform = useAppStore((s) => s.currentPlatform)
  const setCurrentPlatform = useAppStore((s) => s.setCurrentPlatform)
  const dashboard = useAppStore((s) => s.dashboard)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const { t, i18n } = useTranslation()

  const getPlatformCount = (key: string) => {
    return dashboard?.platforms.find(p => p.platform === key)?.count ?? 0
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  const cycleTheme = () => {
    const themes: ('dark' | 'light' | 'system')[] = ['dark', 'light', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const toggleLang = () => {
    const next = i18n.language === 'zh-CN' ? 'en' : 'zh-CN'
    i18n.changeLanguage(next)
  }

  const themeLabel = theme === 'dark' ? t('sidebar.theme.dark') : theme === 'light' ? t('sidebar.theme.light') : t('sidebar.theme.system')

  return (
    <aside className={cn(
      "h-screen bg-gradient-to-b from-card to-card/80 border-r border-border/50 flex flex-col transition-all duration-300 backdrop-blur-xl",
      sidebarCollapsed ? "w-20" : "w-72"
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-blue-500/30 flex-shrink-0">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-lg text-foreground">{t('app.name')}</h1>
              <p className="text-xs text-muted-foreground/70">{t('app.nameEn')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4 px-3">
        <nav className="space-y-1">
          {/* Dashboard */}
          <Button
            variant="ghost"
            className={cn(
              "w-full h-12 rounded-xl transition-all",
              sidebarCollapsed ? "justify-center" : "justify-start gap-3",
              currentPlatform === 'dashboard' 
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10" 
                : "hover:bg-muted/50"
            )}
            onClick={() => setCurrentPlatform('dashboard')}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">{t('sidebar.dashboard')}</span>}
          </Button>

          {/* Platforms */}
          <div className="pt-4">
            {!sidebarCollapsed && (
              <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                {t('sidebar.platforms')}
              </p>
            )}
            {platforms.map((platform) => (
              <Button
                key={platform.key}
                variant="ghost"
                className={cn(
                  "w-full h-12 rounded-xl transition-all",
                  sidebarCollapsed ? "justify-center" : "justify-start gap-3",
                  currentPlatform === platform.key
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                    : "hover:bg-muted/50"
                )}
                onClick={() => setCurrentPlatform(platform.key)}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg",
                  platform.color
                )}>
                  {platform.icon}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{platform.name}</span>
                    <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full text-primary">
                      {getPlatformCount(platform.key)}
                    </span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-2">
        {/* About */}
        <Button
          variant="ghost"
          className={cn(
            "w-full h-11 rounded-xl transition-all",
            sidebarCollapsed ? "justify-center" : "justify-start gap-3",
            currentPlatform === 'about'
              ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10"
              : "hover:bg-muted/50"
          )}
          onClick={() => setCurrentPlatform('about')}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
            currentPlatform === 'about'
              ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
              : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
          )}>
            <Info className={cn("w-4 h-4", currentPlatform === 'about' ? "text-white" : "text-purple-400")} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{t('sidebar.about')}</span>
              <span className="text-[10px] text-muted-foreground/60">About</span>
            </div>
          )}
        </Button>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full h-11 rounded-xl transition-all duration-300",
            sidebarCollapsed ? "justify-center" : "justify-start gap-3",
            "hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10",
            "bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/10"
          )}
          onClick={toggleLang}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
            "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
          )}>
            <Languages className="w-4 h-4 text-cyan-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {i18n.language === 'zh-CN' ? '中文' : 'English'}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {t('sidebar.clickToSwitch')}
              </span>
            </div>
          )}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full h-11 rounded-xl transition-all duration-300",
            sidebarCollapsed ? "justify-center" : "justify-start gap-3",
            "hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10",
            theme === 'light' && "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20",
            theme === 'system' && "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
          )}
          onClick={cycleTheme}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
            theme === 'dark' && "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
            theme === 'light' && "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30",
            theme === 'system' && "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          )}>
            <ThemeIcon className={cn(
              "w-4 h-4 transition-colors duration-300",
              theme === 'light' ? "text-white" : "text-amber-500"
            )} />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {themeLabel}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {t('sidebar.clickToSwitch')}
              </span>
            </div>
          )}
        </Button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full h-9 rounded-lg transition-all duration-200 text-muted-foreground",
            "hover:bg-muted/50 hover:text-foreground",
            sidebarCollapsed ? "justify-center" : "justify-start"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="ml-2 text-xs">{t('sidebar.collapse')}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
