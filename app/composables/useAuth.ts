import type { LoginCredentials, AuthState, LoginResponse, AuthUser } from '~/types/auth'
import { ApiError } from '~/types/api'
import { clearAllTrolleyTaskQueues } from '~/stores/trolley-task-queue'
import { useCustomTaskQueueStore } from '~/stores/custom-task-queue'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token'

interface LoginApiResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    email: string | null
    fullName: string
    role: string
    permissions: string[]
  }
}

export function useAuth() {
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }))

  const isLoading = computed(() => state.value.isLoading)
  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const user = computed(() => state.value.user)

  async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { $http } = useNuxtApp()
    state.value.isLoading = true

    try {
      const response = (await $http.post('/auth/login', {
        identifier: credentials.identifier,
        password: credentials.password,
      })) as LoginApiResponse

      const authUser: AuthUser = {
        id: response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
        permissions: response.user.permissions,
        token: response.accessToken,
      }

      state.value.user = authUser
      state.value.isAuthenticated = true

      const storage = credentials.rememberMe ? localStorage : sessionStorage
      storage.setItem(AUTH_TOKEN_KEY, response.accessToken)
      storage.setItem(AUTH_USER_KEY, JSON.stringify(authUser))
      storage.setItem(AUTH_REFRESH_TOKEN_KEY, response.refreshToken)

      return { success: true, user: authUser }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Terjadi kesalahan. Coba lagi nanti.'
      return { success: false, message }
    } finally {
      state.value.isLoading = false
    }
  }

  async function logout(): Promise<void> {
    const { $http } = useNuxtApp()
    const refreshToken =
      localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(AUTH_REFRESH_TOKEN_KEY)

    if (refreshToken) {
      // Must be awaited *before* the token storage below is cleared — the
      // $http request interceptor reads the access token from storage, but
      // only as a microtask once this call actually dispatches, not
      // synchronously here. Clearing storage first (as this used to do)
      // meant the interceptor found nothing, so this went out
      // unauthenticated, never reached LogoutUseCase, and the user's
      // User.isOnline flag stayed stuck `true` server-side. Capped at 3s so
      // an unreachable server can't hang the Logout button — local logout
      // below still always proceeds.
      const LOGOUT_REQUEST_TIMEOUT_MS = 3000
      await Promise.race([
        $http.post('/auth/logout', { refreshToken }).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, LOGOUT_REQUEST_TIMEOUT_MS)),
      ])
    }

    state.value.user = null
    state.value.isAuthenticated = false
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
    sessionStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    clearAllTrolleyTaskQueues()
    useCustomTaskQueueStore().clear()
    navigateTo('/login')
  }

  function hasPermission(code: string): boolean {
    return state.value.user?.permissions.includes(code) ?? false
  }

  function restoreSession(): void {
    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      sessionStorage.getItem(AUTH_TOKEN_KEY)
    const userRaw =
      localStorage.getItem(AUTH_USER_KEY) ||
      sessionStorage.getItem(AUTH_USER_KEY)

    if (token && userRaw) {
      try {
        state.value.user = JSON.parse(userRaw) as AuthUser
        state.value.isAuthenticated = true
      } catch {
        logout()
      }
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    restoreSession,
    hasPermission,
  }
}
