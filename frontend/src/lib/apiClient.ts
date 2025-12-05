const DEFAULT_API_PORT = 8082
const DEV_PROXY_PREFIX = (import.meta.env.VITE_DEV_PROXY_PREFIX as string | undefined) || '/api'

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const resolveFromWindow = () => {
  if (typeof window === 'undefined') return null

  const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol
  const hostname = window.location.hostname || 'localhost'

  // In dev the frontend often runs on localhost:5173 while the API lives on 8082.
  // On mobile devices hitting the dev server via LAN IP, hostname becomes that IP
  // so we reuse it and only swap the port.
  return `${protocol}//${hostname}:${DEFAULT_API_PORT}`
}

const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const windowBaseUrl = resolveFromWindow()
const fallbackBaseUrl = `http://localhost:${DEFAULT_API_PORT}`

export const API_BASE_URL = stripTrailingSlash(envBaseUrl || windowBaseUrl || fallbackBaseUrl)

const shouldUseDevProxy =
  import.meta.env.DEV &&
  !envBaseUrl &&
  DEV_PROXY_PREFIX &&
  (import.meta.env.VITE_USE_DEV_PROXY ?? 'true') !== 'false'

export const buildApiUrl = (path: string) => {
  if (isAbsoluteUrl(path)) {
    return stripTrailingSlash(path)
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (shouldUseDevProxy) {
    return `${DEV_PROXY_PREFIX}${normalizedPath}`
  }

  return `${API_BASE_URL}${normalizedPath}`
}

export const apiFetch = (path: string, init?: RequestInit) => {
  const url = buildApiUrl(path)
  return fetch(url, init)
}

// Helper to make authenticated API calls with automatic token injection
// Note: This function expects to be called from a context where getSupabase is available
// Pass the token explicitly to avoid circular dependencies
export const apiFetchAuth = async (path: string, token: string, init?: RequestInit) => {
  if (!token) {
    throw new Error('No authentication token provided')
  }
  
  const headers = {
    ...init?.headers,
    'Authorization': `Bearer ${token}`
  }
  
  const url = buildApiUrl(path)
  return fetch(url, { ...init, headers })
}

