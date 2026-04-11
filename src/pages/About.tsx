import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Heart,
  Terminal,
  MessageSquare,
  Code2,
  Database,
  Palette,
  Layers,
  Monitor,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const platformKeys = ['claude', 'codex', 'opencode'] as const

const platformConfig = {
  claude: {
    name: 'Claude Code',
    icon: 'C',
    color: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500/30',
    bg: 'from-blue-500/10 to-indigo-500/10',
    command: 'claude --resume <session-id>',
    forkCommand: 'claude --resume <session-id> --fork-session',
    descKey: 'about.platforms.claudeDesc',
    dataPath: '~/.claude',
  },
  codex: {
    name: 'Codex CLI',
    icon: 'X',
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-500/30',
    bg: 'from-orange-500/10 to-red-500/10',
    command: 'codex resume <session-id>',
    forkCommand: null,
    descKey: 'about.platforms.codexDesc',
    dataPath: '~/.codex',
  },
  opencode: {
    name: 'OpenCode',
    icon: 'O',
    color: 'from-green-500 to-emerald-600',
    border: 'border-green-500/30',
    bg: 'from-green-500/10 to-emerald-500/10',
    command: 'opencode -s <session-id>',
    forkCommand: 'opencode -s <session-id> --fork',
    descKey: 'about.platforms.opencodeDesc',
    dataPath: '~/.local/share/opencode/opencode.db',
  },
}

const techStack = [
  { name: 'Python', category: 'Backend', icon: Code2 },
  { name: 'FastAPI', category: 'Backend', icon: Layers },
  { name: 'SQLModel', category: 'Backend', icon: Database },
  { name: 'React 19', category: 'Frontend', icon: Palette },
  { name: 'TypeScript', category: 'Frontend', icon: Code2 },
  { name: 'Vite', category: 'Frontend', icon: Layers },
  { name: 'Tailwind CSS', category: 'Frontend', icon: Palette },
  { name: 'Zustand', category: 'Frontend', icon: Database },
  { name: 'Tauri v2', category: 'Desktop', icon: Monitor },
]

const featureKeys = [
  'dashboard', 'multiPlatform', 'editMessage', 'editTrace',
  'sessionAlias', 'quickCopy', 'themeMode', 'localFirst',
] as const

export function About() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleCopy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopiedCmd(cmd)
      setTimeout(() => setCopiedCmd(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <span className="text-white font-bold text-4xl">M</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('app.name')}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">{t('app.nameEn')}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">v1.0.0</p>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </div>

        {/* Supported Platforms */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Terminal className="w-6 h-6 text-blue-500" />
              {t('about.supportedPlatforms')}
            </h2>
            <div className="space-y-4">
              {platformKeys.map((key) => {
                const platform = platformConfig[key]
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-2xl border p-5 bg-gradient-to-r transition-all duration-200",
                      platform.bg,
                      platform.border
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 bg-gradient-to-br",
                        platform.color
                      )}>
                        {platform.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{platform.name}</h3>
                          <Badge variant="outline" className="text-[10px]">{platform.dataPath}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{t(platform.descKey)}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-10 flex-shrink-0">Resume</span>
                            <code className="flex-1 text-xs bg-background/50 px-3 py-1.5 rounded-lg border border-border/30 font-mono truncate">
                              {platform.command}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={() => handleCopy(platform.command)}
                            >
                              {copiedCmd === platform.command ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          {platform.forkCommand && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider w-10 flex-shrink-0">Fork</span>
                              <code className="flex-1 text-xs bg-background/50 px-3 py-1.5 rounded-lg border border-border/30 font-mono truncate">
                                {platform.forkCommand}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => handleCopy(platform.forkCommand!)}
                              >
                                {copiedCmd === platform.forkCommand ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <Layers className="w-6 h-6 text-purple-500" />
              {t('about.techStack')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => {
                const Icon = tech.icon
                const categoryColor: Record<string, string> = {
                  Backend: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  Frontend: 'bg-green-500/10 text-green-400 border-green-500/20',
                  Desktop: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                }
                return (
                  <Badge
                    key={tech.name}
                    variant="outline"
                    className={cn("gap-1.5 px-3 py-1.5 text-sm", categoryColor[tech.category])}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tech.name}
                  </Badge>
                )
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-blue-400">3</p>
                <p className="text-xs text-muted-foreground">{t('about.stats.aiPlatforms')}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-green-400">0</p>
                <p className="text-xs text-muted-foreground">{t('about.stats.externalDeps')}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-purple-400">100%</p>
                <p className="text-xs text-muted-foreground">{t('about.stats.localRun')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-green-500" />
              {t('about.coreFeatures')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {featureKeys.map((key) => (
                <div
                  key={key}
                  className="p-3 rounded-xl border border-border/30 bg-muted/10"
                >
                  <p className="text-sm font-medium text-foreground">{t(`about.features.${key}.label`)}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{t(`about.features.${key}.desc`)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm">{t('about.footer.openSource')}</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://github.com/voidcraft-dev/memory-forge" target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/40">MIT License</p>
        </div>
      </div>
    </div>
  )
}
