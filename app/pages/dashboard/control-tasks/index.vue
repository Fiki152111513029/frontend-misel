<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import type { ControlTaskSortKey } from '~/components/control-tasks/Table.vue'
import type {
  ControlTask,
  CreateControlTaskInput,
  TypeOfGoods,
} from '~/types/control-task'
import { TYPE_OF_GOODS_OPTIONS } from '~/types/control-task'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Customize Control Task — Misel' })

const SERVER_SORT_KEYS = ['abjad', 'name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchControlTasks,
  createControlTask,
  updateControlTask,
  deleteControlTask,
  setFilters,
} = useControlTasks()

// Type of Goods and Active aren't sortable server-side, so those columns are
// sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: ControlTaskSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: ControlTask) => string | number> = {
  typeOfGoods: item => item.typeOfGoods,
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
const editingControlTask = ref<ControlTask | null>(null)
const deletingControlTask = ref<ControlTask | null>(null)
const submitting = ref(false)
const deleting = ref(false)

const search = ref('')
const typeOfGoodsFilter = ref<TypeOfGoods | ''>('')

onMounted(() => {
  fetchControlTasks()
})

function openCreate() {
  editingControlTask.value = null
  showFormDialog.value = true
}

function openEdit(controlTask: ControlTask) {
  editingControlTask.value = controlTask
  showFormDialog.value = true
}

function openDelete(controlTask: ControlTask) {
  deletingControlTask.value = controlTask
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateControlTaskInput) {
  submitting.value = true
  const ok = editingControlTask.value
    ? await updateControlTask(editingControlTask.value.id, input)
    : await createControlTask(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingControlTask.value) return
  deleting.value = true
  const ok = await deleteControlTask(deletingControlTask.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchControlTasks()
}

function applyFilters() {
  handleFilterChange({
    search: search.value.trim() || undefined,
    typeOfGoods: typeOfGoodsFilter.value || undefined,
  })
}

function handleSort(patch: { sortBy: ControlTaskSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchControlTasks()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchControlTasks()
}

const controlClass
  = 'rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Customize Control Task</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Define the reusable routes an operator can dispatch — the task path is built
          from the stops you pick here
        </p>
      </div>

      <button
        v-if="hasPermission('control-task.create')"
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Control Task
      </button>
    </div>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by abjad, name or route code"
          :class="`w-full pl-9 ${controlClass}`"
          @keyup.enter="applyFilters"
          @search="applyFilters"
        >
      </div>
      <select v-model="typeOfGoodsFilter" :class="controlClass" @change="applyFilters">
        <option value="">All Types of Goods</option>
        <option v-for="option in TYPE_OF_GOODS_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <ControlTasksTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key ?? filters.sortBy"
      :sort-order="clientSort?.order ?? filters.sortOrder"
      @edit="openEdit"
      @delete="openDelete"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="control tasks"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <ControlTasksFormDialog
      v-model="showFormDialog"
      :control-task="editingControlTask"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <ControlTasksDeleteDialog
      v-model="showDeleteDialog"
      :control-task="deletingControlTask"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
