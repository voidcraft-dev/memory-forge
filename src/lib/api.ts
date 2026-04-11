import type { Session, SessionDetail, EditLogEntry, DashboardSummary } from '@/types'

// Dev mode: Vite proxies /api → localhost:8000
// Production / Tauri: backend serves both frontend and API on same port
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'http://localhost:8000/api'

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

}
