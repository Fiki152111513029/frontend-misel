import {
  lookupCustomTask as lookupCustomTaskSvc,
  releaseCustomTask as releaseCustomTaskSvc,
} from '~/services/custom-task.service'
import { ApiError } from '~/types/api'

export function useCustomTasks() {
  const toast = useToast()

  async function lookupCustomTask(abjad: string) {
    try {
      return await lookupCustomTaskSvc(abjad)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to look up that code')
      return null
    }
  }

  async function releaseCustomTask(abjad: string) {
    try {
      return await releaseCustomTaskSvc(abjad)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to submit the task')
      return null
    }
  }

  return { lookupCustomTask, releaseCustomTask }
}
