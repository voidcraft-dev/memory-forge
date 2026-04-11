import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/stores/appStore'
import { api } from '@/lib/api'
import { Save, Clock, Pencil, Check, X, User, Bot, Lightbulb, RefreshCw, Terminal, FileText, CheckCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

export function SessionDetail() {
  const currentPlatform = useAppStore((s) => s.currentPlatform)
  const sessionDetail = useAppStore((s) => s.sessionDetail)
  const setSessionDetail = useAppStore((s) => s.setSessionDetail)
  const updateSession = useAppStore((s) => s.updateSession)
  const roleFilter = useAppStore((s) => s.roleFilter)
  const setRoleFilter = useAppStore((s) => s.setRoleFilter)
  const editingBlock = useAppStore((s) => s.editingBlock)
  const setEditingBlock = useAppStore((s) => s.setEditingBlock)
  const selectedSessionKey = useAppStore((s) => s.selectedSessionKey)
  const setSessions = useAppStore((s) => s.setSessions)
  const showEditLog = useAppStore((s) => s.showEditLog)
  const setShowEditLog = useAppStore((s) => s.setShowEditLog)
  const setEditLog = useAppStore((s) => s.setEditLog)

  const [aliasTitle, setAliasTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingAlias, setSavingAlias] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshDone, setRefreshDone] = useState(false)
  const { t } = useTranslation()

  // Sync alias title when session detail changes
  useEffect(() => {
    setAliasTitle(sessionDetail?.aliasTitle || '')
  }, [sessionDetail?.sessionKey, sessionDetail?.aliasTitle])

  if (currentPlatform === 'dashboard' || !sessionDetail) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium mb-2">{t('session.selectToView')}</p>
          <p className="text-sm">{t('session.selectFromList')}</p>
        </div>
      </div>
    )
  }

  const filteredBlocks = roleFilter === 'all' 
    ? sessionDetail.blocks 
    : sessionDetail.blocks.filter(b => b.role === roleFilter)

  const handleSaveAlias = async () => {
    setSavingAlias(true)
    try {
      await api.setAlias(currentPlatform, sessionDetail.sessionKey, aliasTitle)
      const newTitle = aliasTitle || sessionDetail.sessionId
      setSessionDetail({ ...sessionDetail, aliasTitle, title: newTitle })
      // Update session list
      updateSession(sessionDetail.sessionKey, { 
        displayTitle: newTitle,
        aliasTitle 
      })
    } catch (err) {
      console.error('Failed to save alias:', err)
    }
    setSavingAlias(false)
  }

  const handleEditBlock = (block: typeof sessionDetail.blocks[0]) => {
    setEditingBlock({
      id: block.editTarget || block.id,
      content: block.content,
      role: block.role,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingBlock) return
    setSaving(true)
    try {
      await api.editMessage(currentPlatform, editingBlock.id, editingBlock.content, sessionDetail.sessionKey)
      // Refresh detail and edit log
      const [updated, logs] = await Promise.all([
        api.getSessionDetail(currentPlatform, sessionDetail.sessionKey),
        api.getEditLog(currentPlatform, sessionDetail.sessionKey),
      ])
      setSessionDetail(updated)
      setEditLog(logs)
      setEditingBlock(null)
    } catch (err) {
      console.error('Failed to save edit:', err)
      alert(t('session.saveFailed'))
    }
    setSaving(false)
  }

  const handleRefresh = async () => {
    if (!selectedSessionKey) return
    setRefreshing(true)
    setRefreshDone(false)
    try {
      const [detail, sessions] = await Promise.all([
        api.getSessionDetail(currentPlatform, selectedSessionKey),
        api.getSessions(currentPlatform)
      ])
      setSessionDetail(detail)
      setSessions(sessions)
      setRefreshDone(true)
      setTimeout(() => setRefreshDone(false), 1500)
    } catch (err) {
      console.error('Failed to refresh:', err)
    }
    setRefreshing(false)
  }

  const handleCopyCommand = async (label: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedKey(label)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">
            {sessionDetail.title || sessionDetail.sessionId}
          </h2>
          {sessionDetail.aliasTitle && (
            <Badge variant="outline" className="text-xs">
              {sessionDetail.aliasTitle}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2 transition-all duration-300",
              refreshDone ? "bg-green-500/10 text-green-400" : "hover:bg-blue-500/10"
            )}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshDone ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            )}
            <span className="hidden sm:inline">{refreshDone ? t('session.refreshed') : t('session.refresh')}</span>
          </Button>
          {/* Command chips - one button per command type (resume / fork) */}
          {Object.entries(sessionDetail.commands || {}).map(([label, command]) => (
            <Button
              key={label}
              variant={copiedKey === label ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 transition-all duration-300 font-mono text-xs",
                copiedKey === label 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "hover:bg-blue-500/10 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleCopyCommand(label, command)}
            >
              <Terminal className="w-3.5 h-3.5" />
              {copiedKey === label ? (
                <><Check className="w-3.5 h-3.5" /> {t('session.copied')}</>
              ) : (
                label
              )}
            </Button>
          ))}
          <Button 
            variant={showEditLog ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "gap-2 transition-all duration-300",
              showEditLog && "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            )}
            onClick={() => {
              const next = !showEditLog
              setShowEditLog(next)
              if (next && selectedSessionKey) {
                api.getEditLog(currentPlatform, selectedSessionKey).then(setEditLog).catch(console.error)
              }
            }}
          >
            <FileText className={cn("w-4 h-4", showEditLog && "text-amber-400")} />
            <span className="hidden sm:inline">{t('session.editLog')}</span>
          </Button>
        </div>
      </header>
      <div className="px-6 py-3 border-b bg-card/30 flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-medium">{t('session.alias')}:</span>
        <Input
          value={aliasTitle}
          onChange={(e) => setAliasTitle(e.target.value)}
          className="flex-1 max-w-md bg-background/50"
          placeholder={t('session.setAlias')}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
        />
        <Button 
          size="sm" 
          onClick={handleSaveAlias} 
          disabled={savingAlias}
          className="gap-1"
        >
          {savingAlias ? (
            <Clock className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          {t('session.save')}
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b bg-card/30 flex items-center gap-2">
        {(['all', 'user', 'assistant', 'thinking'] as const).map((filter) => {
          const isActive = roleFilter === filter
          const filterConfig = {
            all: { label: t('session.filter.all'), icon: null, gradient: 'from-slate-500/20 to-slate-600/20', textColor: 'text-slate-400', borderColor: 'border-slate-500/30' },
            user: { label: t('session.filter.user'), icon: User, gradient: 'from-blue-500/20 to-blue-600/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/40' },
            assistant: { label: t('session.filter.assistant'), icon: Bot, gradient: 'from-green-500/20 to-green-600/20', textColor: 'text-green-400', borderColor: 'border-green-500/40' },
            thinking: { label: t('session.filter.thinking'), icon: Lightbulb, gradient: 'from-orange-500/20 to-orange-600/20', textColor: 'text-orange-400', borderColor: 'border-orange-500/40' },
          }
          const config = filterConfig[filter]
          const Icon = config.icon
          
          return (
            <Button
              key={filter}
              variant="ghost"
              size="sm"
              onClick={() => setRoleFilter(filter)}
              className={cn(
                "gap-1.5 h-8 px-4 rounded-lg font-medium transition-all duration-200",
                isActive 
                  ? cn(
                      "bg-gradient-to-r shadow-lg",
                      config.gradient,
                      config.textColor,
                      "border border-opacity-50",
                      config.borderColor
                    )
                  : "hover:bg-muted/50 text-muted-foreground"
              )}
            >
              {Icon && <Icon className={cn("w-3.5 h-3.5", isActive && config.textColor)} />}
              <span>{config.label}</span>
              {isActive && (
                <span className={cn(
                  "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-background/30",
                  config.textColor
                )}>
                  {filteredBlocks.length}
                </span>
              )}
            </Button>
          )
        })}
        <span className="ml-auto text-xs text-muted-foreground/60">
          {t('session.totalMessages', { count: sessionDetail.blocks.length })}
        </span>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-6 max-w-5xl mx-auto">
          {filteredBlocks.map((block, index) => (
            <MessageBlock
              key={block.id}
              block={block}
              index={index}
              onEdit={() => handleEditBlock(block)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Edit Modal */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Badge 
                variant={editingBlock?.role as 'user' | 'assistant' | 'thinking'}
                className="text-sm px-3 py-1"
              >
                {editingBlock?.role === 'user' ? `👤 ${t('session.filter.user')}` : editingBlock?.role === 'assistant' ? `🤖 ${t('session.filter.assistant')}` : `💭 ${t('session.filter.thinking')}`}
              </Badge>
              <span className="text-base">{t('session.editMessage')}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="overflow-auto">
            <Textarea
              value={editingBlock?.content || ''}
              onChange={(e) => setEditingBlock(editingBlock ? { ...editingBlock, content: e.target.value } : null)}
              className="min-h-[400px] font-mono text-sm bg-muted/30"
              placeholder={t('session.enterContent')}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('session.editWarning')}
            </p>
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingBlock(null)}
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              {t('session.cancel')}
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={saving}
              className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {saving ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('session.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MessageBlock({ 
  block, 
  index,
  onEdit 
}: { 
  block: { role: string; content: string; id: string; editable?: boolean }
  index: number
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const roleConfig = {
    user: { 
      label: t('session.filter.user'), 
      icon: User, 
      bgGradient: 'from-blue-500/10 to-blue-500/5',
      borderColor: 'border-l-blue-500',
      iconBg: 'bg-blue-500/20 text-blue-400',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    assistant: { 
      label: t('session.filter.assistant'), 
      icon: Bot, 
      bgGradient: 'from-green-500/10 to-green-500/5',
      borderColor: 'border-l-green-500',
      iconBg: 'bg-green-500/20 text-green-400',
      badgeClass: 'bg-green-500/15 text-green-400 border-green-500/30',
    },
    thinking: { 
      label: t('session.filter.thinking'), 
      icon: Lightbulb, 
      bgGradient: 'from-orange-500/10 to-orange-500/5',
      borderColor: 'border-l-orange-500',
      iconBg: 'bg-orange-500/20 text-orange-400',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
  }

  const config = roleConfig[block.role as keyof typeof roleConfig] || roleConfig.assistant
  const Icon = config.icon

  return (
    <div 
      className={cn(
        "group animate-in fade-in slide-in-from-bottom-2 duration-300",
        `border-l-4 ${config.borderColor} rounded-r-2xl`
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={cn(
        "bg-gradient-to-r rounded-2xl rounded-l-none p-5 ml-0",
        `bg-gradient-to-b ${config.bgGradient}`,
        "border border-border/50"
      )}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
            config.iconBg
          )}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cn("text-xs", config.badgeClass)}>
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground/50">
                #{index + 1}
              </span>
            </div>
            
            <div className="rounded-xl p-4 bg-background/50 border border-border/30">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                {block.content}
              </pre>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
            >
              <Pencil className="w-3 h-3" />
              {t('session.editThisMessage')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
