import { controlRobot as controlRobotSvc, fetchRobot as fetchRobotSvc } from '~/services/robot.service'
import { ApiError } from '~/types/api'
import type { CreateRobotInput, Robot, RobotQuery, UpdateRobotInput } from '~/types/robot'

export function useRobots() {
  const store = useRobotsStore()
  const toast = useToast()

  async function fetchRobots(query?: Partial<RobotQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadRobots()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load robots')
    }
  }

  async function fetchRobot(id: string) {
    try {
      return await fetchRobotSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load robot')
      return null
    }
  }

  async function createRobot(input: CreateRobotInput) {
    try {
      await store.addRobot(input)
      toast.success('Robot created successfully')
      await fetchRobots()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create robot')
      return false
    }
  }

  async function updateRobot(id: string, input: UpdateRobotInput) {
    try {
      await store.editRobot(id, input)
      toast.success('Robot updated successfully')
      await fetchRobots()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update robot')
      return false
    }
  }

  async function deleteRobot(id: string) {
    try {
      await store.removeRobot(id)
      toast.success('Robot deleted successfully')
      await fetchRobots()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete robot')
      return false
    }
  }

  function pollRobots() {
    return store.pollRobots()
  }

  // Susp/Rest call the external AMR fleet's controlDevice API directly
  // (controlWay 0 = suspend, 1 = restore). ("Act" navigates to the real
  // Robot Activity page instead.)
  async function suspendRobot(robot: Robot) {
    try {
      await controlRobotSvc(robot.id, 0)
      toast.success(`Suspend command sent to ${robot.name}`)
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to suspend robot')
      return false
    }
  }

  async function resetRobot(robot: Robot) {
    try {
      await controlRobotSvc(robot.id, 1)
      toast.success(`Restore command sent to ${robot.name}`)
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to restore robot')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchRobots,
    fetchRobot,
    pollRobots,
    createRobot,
    updateRobot,
    deleteRobot,
    resetRobot,
    suspendRobot,
    setFilters: store.setFilters,
  }
}
