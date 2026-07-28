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
// Confirmed mapping: 3 Canceled, 5 Sending failed, 6 Running, 7 Execution
// failed, 8 Completed, 9 Assigned, 10 Wait for acknowledgment, 20 Picking,
// 21 Picked, 22 Placing, 23 Placed. 1/2/4 are inferred (not yet confirmed).
const RCS_STATUS_LABEL: Record<string, string> = {
  '1': 'Not sent',
  '2': 'Canceling',
  '3': 'Canceled',
  '4': 'Sending',
  '5': 'Sending failed',
  '6': 'Running',
  '7': 'Execution failed',
  '8': 'Completed',
  '9': 'Assigned',
  '10': 'Wait for acknowledgment',
  '20': 'Picking',
  '21': 'Picked',
  '22': 'Placing',
  '23': 'Placed',
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
  '10': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '20': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '21': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '22': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  '23': 'bg-[#01ADEF]/10 text-[#01ADEF]',
}

// A task has reached a terminal state (RCS won't move it further) once it's
// either our own COMPLETED/FAILED, or the matching RCS codes: 8 = success,
// 3/5/7 = stopped/failed.
const RCS_COMPLETED_STATUS = '8'
const RCS_FAILED_STATUSES = ['3', '5', '7']
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', RCS_COMPLETED_STATUS, ...RCS_FAILED_STATUSES]

export function taskActionLabel(action: TaskAction) {
  return TASK_ACTION_LABEL[action]
}

export function taskStatusLabel(status: string) {
  return RCS_STATUS_LABEL[status] ?? status
}

export function taskStatusStyle(status: string) {
  return RCS_STATUS_STYLE[status] ?? STATUS_STYLE[status as TaskStatus] ?? DEFAULT_STATUS_STYLE
}

export function isTaskTerminal(status: string) {
  return TERMINAL_STATUSES.includes(status)
}

export function isTaskCompleted(status: string) {
  return status === 'COMPLETED' || status === RCS_COMPLETED_STATUS
}
