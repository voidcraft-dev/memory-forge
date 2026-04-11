import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import { FileText, ArrowRight, Clock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { EditLogEntry } from '@/types'

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const [expanded, setExpanded] = useState(false)

  // Truncate for collapsed view
  const maxLen = 120
  const oldPreview = oldText.length > maxLen && !expanded ? oldText.slice(0, maxLen) + '...' : oldText
  const newPreview = newText.length > maxLen && !expanded ? newText.slice(0, maxLen) + '...' : newText

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-medium text-red-400/80 uppercase tracking-wider">修改前</span>
          {!expanded && oldText.length > maxLen && (
            <button onClick={() => setExpanded(true)} className="text-[10px] text-muted-foreground/50 hover:text-foreground">
              展开
            </button>
          )}
        </div>
        <pre className="text-xs text-red-300/80 whitespace-pre-wrap font-mono leading-relaxed">{oldPreview}</pre>
      </div>
      <div className="flex justify-center">
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30" />
      </div>
      <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-medium text-green-400/80 uppercase tracking-wider">修改后</span>
          {!expanded && newText.length > maxLen && (
            <button onClick={() => setExpanded(true)} className="text-[10px] text-muted-foreground/50 hover:text-foreground">
              展开
            </button>
          )}
        </div>
        <pre className="text-xs text-green-300/80 whitespace-pre-wrap font-mono leading-relaxed">{newPreview}</pre>
      </div>
    </div>
  )
}

export function EditLogPanel() {
  const currentPlatform = useAppStore((s) => s.currentPlatform)
  const editLog = useAppStore((s) => s.editLog)
  const selectedSessionKey = useAppStore((s) => s.selectedSessionKey)
  const showEditLog = useAppStore((s) => s.showEditLog)
  const setShowEditLog = useAppStore((s) => s.setShowEditLog)

  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (currentPlatform === 'dashboard' || !selectedSessionKey) {
    return null
  }

  if (!showEditLog) {
    return null
  }

  return (
    <div className="w-80 flex-shrink-0 bg-gradient-to-b from-card to-card/50 border-l border-border/50 flex flex-col backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            修改记录
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowEditLog(false)}
          >
            收起
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-1">
          只读追溯，不可恢复
        </p>
      </div>

      {/* Log List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {editLog.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-amber-400/60" />
              </div>
              <p className="text-sm font-medium text-foreground/70">暂无修改记录</p>
              <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
                编辑消息后<br/>修改记录会自动出现在这里
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground/60 mb-2">
                {editLog.length} 条记录
              </div>
              {editLog.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all duration-300",
                    "bg-gradient-to-r from-amber-500/5 to-orange-500/5",
                    "border-border/30 hover:border-amber-500/30",
                    "hover:shadow-lg hover:shadow-amber-500/10",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/60">
                      {new Date(entry.createdAt).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>

                  <Badge variant="outline" className="text-[10px] mb-3 block w-fit">
                    {entry.editTarget.length > 40 ? entry.editTarget.slice(0, 40) + '...' : entry.editTarget}
                  </Badge>

                  {expandedId === entry.id ? (
                    <>
                      <DiffView oldText={entry.oldContent} newText={entry.newContent} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={() => setExpandedId(null)}
                      >
                        <EyeOff className="w-3 h-3 mr-1" />
                        收起
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-red-300/60 line-clamp-1 font-mono mb-1">
                        - {entry.oldContent.slice(0, 80)}
                      </p>
                      <p className="text-xs text-green-300/60 line-clamp-1 font-mono mb-2">
                        + {entry.newContent.slice(0, 80)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30"
                        onClick={() => setExpandedId(entry.id)}
                      >
                        <Eye className="w-3 h-3" />
                        查看详情
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <div className="flex items-start gap-2 text-[10px] text-muted-foreground/80">
          <FileText className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-medium text-foreground/70">修改追溯</p>
            <p className="mt-1 leading-relaxed">
              记录所有编辑操作，仅供查看追溯，不提供恢复功能。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
