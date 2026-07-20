export interface LoginCredentials {
  identifier: string
  password: string
  rememberMe: boolean
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  token: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginResponse {
  success: boolean
  user?: AuthUser
  message?: string
}

export interface ValidationError {
  field: string
  message: string
}
