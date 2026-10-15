export interface Toast {
  id: number
  // 'info' is for an outcome that is neither a win nor a failure — a task
  // accepted but parked, say. Showing those in green overstates them and
  // in red alarms the operator into retrying something already handled.
  type: 'success' | 'error' | 'info'
  message: string
}

let counter = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(type: Toast['type'], message: string) {
    const id = ++counter
    toasts.value = [...toasts.value, { id, type, message }]
    setTimeout(() => dismiss(id), 4000)
  }

  return {
    toasts,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    dismiss,
  }
}
