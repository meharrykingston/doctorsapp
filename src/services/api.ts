const RAW_BASE = import.meta.env.VITE_API_BASE_URL
const DEFAULT_BASE = 'https://astikan-backend-production.up.railway.app/api'
const API_BASE_URL =
  typeof RAW_BASE === 'string' && RAW_BASE.trim() && RAW_BASE !== 'undefined' && RAW_BASE !== 'null'
    ? RAW_BASE.replace(/\/+$/, '')
    : DEFAULT_BASE

type ApiEnvelope<T> = {
  status: 'ok' | 'error'
  data?: T
  message?: string
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const raw = await response.text()
  if (!raw.trim()) {
    return null
  }

  try {
    return JSON.parse(raw) as ApiEnvelope<T>
  } catch {
    return null
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })

  const payload = await parseEnvelope<T>(response)
  if (!response.ok) {
    throw new Error(payload?.message || response.statusText || `Request failed: ${response.status}`)
  }
  if (!payload || payload.status !== 'ok' || typeof payload.data === 'undefined') {
    throw new Error('Service temporarily unavailable. Please retry.')
  }

  return payload.data
}

export function apiGet<T>(path: string) {
  return request<T>(path, { method: 'GET' })
}

export function apiPost<T, B>(path: string, body: B) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPut<T, B>(path: string, body: B) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}
