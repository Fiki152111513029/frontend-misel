import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, type ApiErrorShape } from '~/types/api'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const httpClient = axios.create({ baseURL: config.public.apiBase })

  function getStorage() {
    return localStorage.getItem(AUTH_TOKEN_KEY) ? localStorage : sessionStorage
  }

  function getRefreshToken() {
    return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) || sessionStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
  }

  function clearAuthAndRedirect() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
    sessionStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)

    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  // Dedupes concurrent 401s (this app polls several things in parallel —
  // Factory Map, Current Queue, etc. — so more than one request can expire
  // at almost the same moment) into a single /auth/refresh call. Everything
  // that hits a 401 while one is already in flight just waits on this same
  // promise instead of firing its own.
  let refreshPromise: Promise<string | null> | null = null

  function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return null
        try {
          // Plain axios, not httpClient — this must never carry an
          // Authorization header or re-enter this same 401 handler.
          const response = await axios.post(`${config.public.apiBase}/auth/refresh`, { refreshToken })
          const { accessToken, refreshToken: newRefreshToken } = response.data as {
            accessToken: string
            refreshToken: string
          }
          const storage = getStorage()
          storage.setItem(AUTH_TOKEN_KEY, accessToken)
          storage.setItem(AUTH_REFRESH_TOKEN_KEY, newRefreshToken)
          return accessToken
        } catch {
          return null
        } finally {
          refreshPromise = null
        }
      })()
    }
    return refreshPromise
  }

  httpClient.interceptors.request.use((requestConfig) => {
    const token =
      import.meta.client &&
      (localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY))

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }

    return requestConfig
  })

  httpClient.interceptors.response.use(
    (response) => {
      const body = response.data as unknown
      // Some endpoints (e.g. box-types) wrap responses as { success, message, data }.
      // Others (e.g. auth) return the payload directly. Only unwrap when it's actually enveloped.
      if (
        body &&
        typeof body === 'object' &&
        'success' in body &&
        'data' in body
      ) {
        return (body as { data: unknown }).data
      }
      return body
    },
    async (error: AxiosError<ApiErrorShape>) => {
      if (!error.response) {
        return Promise.reject(new ApiError('Network error — unable to reach the server', 0))
      }

      const originalRequest = error.config as RetriableRequestConfig | undefined
      const isAuthEndpoint =
        originalRequest?.url === '/auth/login' || originalRequest?.url === '/auth/refresh'

      // A stale access token (the normal 15-minute expiry, not a genuine
      // auth failure) — try a silent refresh once, then replay the original
      // request with the new token, instead of immediately logging out.
      if (
        error.response.status === 401 &&
        import.meta.client &&
        originalRequest &&
        !originalRequest._retriedAfterRefresh &&
        !isAuthEndpoint
      ) {
        originalRequest._retriedAfterRefresh = true
        const newAccessToken = await refreshAccessToken()
        if (newAccessToken) {
          return httpClient(originalRequest)
        }
      }

      if (error.response.status === 401 && import.meta.client) {
        clearAuthAndRedirect()
      }

      const { statusCode, path, message } = error.response.data
      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message

      return Promise.reject(new ApiError(normalizedMessage, statusCode, path))
    },
  )

  return {
    provide: { http: httpClient },
  }
})
