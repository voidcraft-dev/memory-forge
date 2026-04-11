import type { Session, SessionDetail, EditLogEntry, DashboardSummary, PromptItem } from '@/types'

// Dev mode: Vite proxies /api → localhost:8000
// Production / Tauri: window navigates to http://127.0.0.1:8000 (same-origin)
// Both cases use relative /api path
const API_BASE = '/api'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
  return data.data ?? data
}

export const api = {
  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    return fetchJSON<DashboardSummary>(`${API_BASE}/dashboard/summary`)
  },

  // Platform
  async getPlatformConfig(platform: string) {
    return fetchJSON(`${API_BASE}/platforms/${platform}/config`)
  },

  // Sessions
  async getSessions(platform: string, q: string = ''): Promise<Session[]> {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    return fetchJSON<Session[]>(`${API_BASE}/platforms/${platform}/sessions${params}`)
  },

  async getPageData(platform: string, q: string = '') {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    return fetchJSON(`${API_BASE}/platforms/${platform}/page-data${params}`)
  },

  async getSessionDetail(platform: string, sessionKey: string): Promise<SessionDetail> {
    const encodedKey = encodeURIComponent(sessionKey)
    const data = await fetchJSON<{ detail: SessionDetail }>(
      `${API_BASE}/platforms/${platform}/session-detail/${encodedKey}`
    )
    return data.detail
  },

  // Alias
  async setAlias(platform: string, sessionKey: string, title: string) {
    const encodedKey = encodeURIComponent(sessionKey)
    return fetchJSON(`${API_BASE}/platforms/${platform}/sessions/${encodedKey}/alias`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
  },

  // Edit message
  async editMessage(platform: string, messageId: string, content: string, sessionKey: string) {
    return fetchJSON(`${API_BASE}/platforms/${platform}/messages/${encodeURIComponent(messageId)}/edit`, {
      method: 'POST',
      body: JSON.stringify({ content, sessionKey }),
    })
  },

  // Edit log
  async getEditLog(platform: string, sessionKey: string): Promise<EditLogEntry[]> {
    const encodedKey = encodeURIComponent(sessionKey)
    return fetchJSON<EditLogEntry[]>(`${API_BASE}/platforms/${platform}/sessions/${encodedKey}/edit-log`)
  },

  // Prompts
  async getPrompts(q: string = '', tag: string = ''): Promise<{ prompts: PromptItem[]; presetTags: string[] }> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`${API_BASE}/prompts${qs}`)
    const json = await res.json()
    return {
      prompts: json.data ?? [],
      presetTags: json.presetTags ?? [],
    }
  },

  async createPrompt(name: string, content: string, tags: string[]): Promise<PromptItem> {
    return fetchJSON<PromptItem>(`${API_BASE}/prompts`, {
      method: 'POST',
      body: JSON.stringify({ name, content, tags }),
    })
  },

  async updatePrompt(id: number, data: { name?: string; content?: string; tags?: string[] }): Promise<PromptItem> {
    return fetchJSON<PromptItem>(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deletePrompt(id: number): Promise<void> {
    await fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' })
  },

  async incrementPromptUse(id: number): Promise<void> {
    await fetch(`${API_BASE}/prompts/${id}/use`, { method: 'POST' })
  },

  async exportPrompts(): Promise<PromptItem[]> {
    return fetchJSON<PromptItem[]>(`${API_BASE}/prompts/export`)
  },

  async importPrompts(prompts: Partial<PromptItem>[]): Promise<{ imported: number }> {
    return fetchJSON<{ imported: number }>(`${API_BASE}/prompts/import`, {
      method: 'POST',
      body: JSON.stringify({ prompts }),
    })
  },
}
