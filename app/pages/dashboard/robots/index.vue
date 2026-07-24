<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { Plus } from 'lucide-vue-next'
import type { RobotSortKey } from '~/components/robots/Table.vue'
import type { CreateRobotInput, Robot } from '~/types/robot'

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Robots — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchRobots,
  pollRobots,
  createRobot,
  updateRobot,
  deleteRobot,
  resetRobot,
  suspendRobot,
  setFilters,
} = useRobots()

// Only name and createdAt are sortable server-side — the remaining columns
// are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: RobotSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: Robot) => string | number> = {
  amrDeviceSerialNo: item => item.amrDeviceSerialNo.toLowerCase(),
  amrDeviceNo: item => item.amrDeviceNo.toLowerCase(),
  areaId: item => item.areaId,
  speed: item => item.speed ?? -1,
  battery: item => item.battery ?? -1,
  state: item => (item.state ?? '').toLowerCase(),
  lastUpdate: item => item.lastUpdate ?? '',
  isActive: item => (item.isActive ? 1 : 0),
}

const sortedItems = computed(() => {
  if (!clientSort.value) return items.value
  const { key, order } = clientSort.value
  const accessor = CLIENT_SORT_ACCESSORS[key]
  if (!accessor) return items.value
  return [...items.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
})

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingRobot = ref<Robot | null>(null)
const deletingRobot = ref<Robot | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchRobots()
})

// Live Speed/Battery/State/Last Update come from the AMR telemetry API — poll for updates.
useIntervalFn(() => pollRobots(), 5000)

function openCreate() {
  editingRobot.value = null
  showFormDialog.value = true
}

function openEdit(robot: Robot) {
  editingRobot.value = robot
  showFormDialog.value = true
}

function openDelete(robot: Robot) {
  deletingRobot.value = robot
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateRobotInput) {
  submitting.value = true
  const ok = editingRobot.value
    ? await updateRobot(editingRobot.value.id, input)
    : await createRobot(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingRobot.value) return
  deleting.value = true
  const ok = await deleteRobot(deletingRobot.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchRobots()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchRobots()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchRobots()
}

function handleSort(patch: { sortBy: RobotSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Robots</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Robots</p>
      </div>

      <button
        v-if="hasPermission('robot.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Robot
      </button>
    </div>

    <RobotsTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key ?? filters.sortBy"
      :sort-order="clientSort?.order ?? filters.sortOrder"
      @edit="openEdit"
      @delete="openDelete"
      @reset="resetRobot"
      @suspend="suspendRobot"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="robots"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <RobotsFormDialog
      v-model="showFormDialog"
      :robot="editingRobot"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <RobotsDeleteDialog
      v-model="showDeleteDialog"
      :robot="deletingRobot"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
