export interface ApiErrorShape {
  statusCode: number
  path?: string
  timestamp?: string
  message: string | string[]
}

export class ApiError extends Error {
  statusCode: number
  path?: string

  constructor(message: string, statusCode: number, path?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.path = path
  }
}
