import axios, { type AxiosError } from 'axios'
import { ApiError, type ApiErrorShape } from '~/types/api'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const httpClient = axios.create({ baseURL: config.public.apiBase })

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
    (error: AxiosError<ApiErrorShape>) => {
      if (!error.response) {
        return Promise.reject(new ApiError('Network error — unable to reach the server', 0))
      }

      const { statusCode, path, message } = error.response.data
      const normalizedMessage = Array.isArray(message) ? message.join(', ') : message

      if (error.response.status === 401 && import.meta.client) {
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

      return Promise.reject(new ApiError(normalizedMessage, statusCode, path))
    },
  )

  return {
    provide: { http: httpClient },
  }
})
