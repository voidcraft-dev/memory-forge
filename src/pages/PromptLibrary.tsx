import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { PromptItem } from '@/types'
import {
  Search,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  Download,
  Upload,
  BookOpen,
  RefreshCw,
  X,
  Tag,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const tagColors: Record<string, string> = {
  '代码': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Code': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '写作': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Writing': 'bg-green-500/10 text-green-400 border-green-500/20',
  '翻译': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Translation': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '分析': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Analysis': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  '设计': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Design': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  '优化': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Optimization': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  '学习': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Learning': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

function getTagColor(tag: string): string {
  return tagColors[tag] || 'bg-muted/30 text-muted-foreground border-border/30'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString()
}

export function PromptLibrary() {
  const { t } = useTranslation()
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [modalTags, setModalTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')

  // Import/Export
  const [showImportExport, setShowImportExport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const { prompts: data, presetTags: tags } = await api.getPrompts(searchQuery, activeTag)
      setPrompts(data)
      setPresetTags(tags)
    } catch (err) {
      console.error('Failed to load prompts:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPrompts()
  }, [searchQuery, activeTag])

  const handleCopy = async (prompt: PromptItem) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      await api.incrementPromptUse(prompt.id)
      // Update local use count
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, useCount: p.useCount + 1 } : p))
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deletePrompt(id)
      setPrompts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete prompt:', err)
    }
  }

  const openCreateModal = () => {
    setEditingPrompt(null)
    setModalName('')
    setModalContent('')
    setModalTags([])
    setShowModal(true)
  }

  const openEditModal = (prompt: PromptItem) => {
    setEditingPrompt(prompt)
    setModalName(prompt.name)
    setModalContent(prompt.content)
    setModalTags([...prompt.tags])
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPrompt(null)
  }

  const togglePresetTag = (tag: string) => {
    setModalTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const tag = customTagInput.trim()
    if (tag && !modalTags.includes(tag)) {
      setModalTags(prev => [...prev, tag])
    }
    setCustomTagInput('')
  }

  const removeTag = (tag: string) => {
    setModalTags(prev => prev.filter(t => t !== tag))
  }

  const handleSave = async () => {
    if (!modalName.trim() || !modalContent.trim()) return

    try {
      if (editingPrompt) {
        const updated = await api.updatePrompt(editingPrompt.id, {
          name: modalName,
          content: modalContent,
          tags: modalTags,
        })
        setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? updated : p))
      } else {
        const created = await api.createPrompt(modalName, modalContent, modalTags)
        setPrompts(prev => [created, ...prev])
      }
      closeModal()
    } catch (err) {
      console.error('Failed to save prompt:', err)
    }
  }

  const handleExport = async () => {
    try {
      const data = await api.exportPrompts()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memory-forge-prompts-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export:', err)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const promptsToImport = Array.isArray(data) ? data : data.data ?? []
      const result = await api.importPrompts(promptsToImport)
      await loadPrompts()
      alert(t('prompts.importSuccess', { count: result.imported }))
    } catch (err) {
      console.error('Failed to import:', err)
      alert(t('prompts.importFailed'))
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Get all unique tags from prompts for filter bar
  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)))

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t('prompts.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('prompts.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={loadPrompts} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowImportExport(!showImportExport)}
              >
                <Download className="w-4 h-4" />
                {t('prompts.importExport')}
              </Button>
              {showImportExport && (
                <div className="absolute right-0 top-full mt-2 bg-card border border-border/50 rounded-xl p-2 min-w-[160px] shadow-xl z-50">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    onClick={() => { handleExport(); setShowImportExport(false) }}
                  >
                    <Download className="w-4 h-4" />
                    {t('prompts.exportJSON')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                    onClick={() => { fileInputRef.current?.click(); setShowImportExport(false) }}
                  >
                    <Upload className="w-4 h-4" />
                    {t('prompts.importJSON')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
              )}
            </div>
            <Button className="gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              {t('prompts.createNew')}
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder={t('prompts.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-all px-3 py-1.5",
                !activeTag
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTag('')}
            >
              {t('prompts.allTags')}
            </Badge>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all px-3 py-1.5",
                  activeTag === tag ? getTagColor(tag) : "hover:bg-muted/50"
                )}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prompts.length}</p>
                <p className="text-xs text-muted-foreground">{t('prompts.totalPrompts')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <Copy className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prompts.reduce((sum, p) => sum + p.useCount, 0)}</p>
                <p className="text-xs text-muted-foreground">{t('prompts.totalUses')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allTags.length}</p>
                <p className="text-xs text-muted-foreground">{t('prompts.totalTags')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 gap-4">
            <BookOpen className="w-16 h-16" />
            <p className="text-lg font-medium">{t('prompts.empty')}</p>
            <p className="text-sm">{t('prompts.emptyHint')}</p>
            <Button className="gap-2 mt-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              {t('prompts.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {prompts.map(prompt => (
              <Card
                key={prompt.id}
                className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border bg-gradient-to-br from-card to-card/50 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/5"
              >
                <CardContent className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{prompt.name}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditModal(prompt)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-red-500"
                        onClick={() => handleDelete(prompt.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {prompt.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {prompt.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5", getTagColor(tag))}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="font-mono text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg max-h-[100px] overflow-hidden relative">
                    {prompt.content}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/30 to-transparent" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground/50">
                      {t('prompts.usedCount', { count: prompt.useCount })} · {formatTime(prompt.updatedAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 gap-1.5 text-xs transition-all",
                        copiedId === prompt.id
                          ? "text-green-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleCopy(prompt)}
                    >
                      {copiedId === prompt.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          {t('prompts.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {t('prompts.copy')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div
            className="bg-card border border-border/50 rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h2 className="text-lg font-semibold">
                {editingPrompt ? t('prompts.editPrompt') : t('prompts.createNew')}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <ScrollArea className="max-h-[calc(90vh-130px)]">
              <div className="p-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('prompts.promptName')} *
                  </label>
                  <Input
                    value={modalName}
                    onChange={e => setModalName(e.target.value)}
                    placeholder={t('prompts.namePlaceholder')}
                    className="bg-muted/30 border-border/50"
                  />
                </div>

                {/* Preset Tags */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('prompts.presetTags')}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {presetTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all px-3 py-1.5",
                          modalTags.includes(tag) ? getTagColor(tag) : "hover:bg-muted/50"
                        )}
                        onClick={() => togglePresetTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selected Tags + Custom */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('prompts.selectedTags')}
                  </label>
                  <div className="flex gap-2 flex-wrap p-3 bg-muted/30 border border-border/50 rounded-lg min-h-[44px] items-center">
                    {modalTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn("gap-1 px-2 py-1", getTagColor(tag))}
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                      placeholder={t('prompts.customTagPlaceholder')}
                      className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('prompts.promptContent')} *
                  </label>
                  <Textarea
                    value={modalContent}
                    onChange={e => setModalContent(e.target.value)}
                    placeholder={t('prompts.contentPlaceholder')}
                    className="bg-muted/30 border-border/50 font-mono min-h-[160px] resize-y"
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-border/50">
              <Button variant="outline" onClick={closeModal}>{t('prompts.cancel')}</Button>
              <Button
                onClick={handleSave}
                disabled={!modalName.trim() || !modalContent.trim()}
              >
                {editingPrompt ? t('prompts.save') : t('prompts.create')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
