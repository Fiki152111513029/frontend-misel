import type { TaskAction, TaskStatus } from '~/types/task'

export const TASK_ACTION_LABEL: Record<TaskAction, string> = {
  AMBIL_FG: 'Ambil FG',
  NOT_STANDARD: 'Not Standard',
}

const STATUS_STYLE: Partial<Record<TaskStatus, string>> = {
  PENDING: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  IN_PROGRESS: 'bg-[#01ADEF]/10 text-[#01ADEF]',
  COMPLETED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  FAILED: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}
const DEFAULT_STATUS_STYLE = 'bg-[#01ADEF]/10 text-[#01ADEF]'

// Once a task's taskId matches a live OrderId from the RCS, status arrives as
// this numeric order-status code instead of our own PENDING/IN_PROGRESS/etc.
const RCS_STATUS_LABEL: Record<string, string> = {
  '1': 'Not sent',
  '2': 'Canceling',
  '3': 'Canceled',
  '4': 'Sending',
  '5': 'Sending failed',
  '6': 'Executing',
  '7': 'Execution failed',
  '8': 'Completed',
  '9': 'Assigned',
}

const RCS_STATUS_STYLE: Record<string, string> = {
  '1': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  '2': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  '3': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  '4': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '5': 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
  '6': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '7': 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
  '8': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  '9': 'bg-[#01ADEF]/10 text-[#01ADEF]',
}

export function taskActionLabel(action: TaskAction) {
  return TASK_ACTION_LABEL[action]
}

export function taskStatusLabel(status: string) {
  return RCS_STATUS_LABEL[status] ?? status
}

export function taskStatusStyle(status: string) {
  return RCS_STATUS_STYLE[status] ?? STATUS_STYLE[status as TaskStatus] ?? DEFAULT_STATUS_STYLE
}
