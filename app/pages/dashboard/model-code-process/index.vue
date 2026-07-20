<script setup lang="ts">
import { Plus, RefreshCw } from 'lucide-vue-next'
import type { ModelCodeProcessSortKey } from '~/components/model-code-processes/Table.vue'
import type { CreateModelCodeProcessInput, ModelCodeProcess } from '~/types/model-code-process'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Model Code Process — Misel' })

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchModelCodeProcesses,
  createModelCodeProcess,
  updateModelCodeProcess,
  deleteModelCodeProcess,
  setFilters,
} = useModelCodeProcesses()

const fromSystemFilter = ref<'All' | 'MES' | 'WMS'>('All')
const statusFilter = ref<'All' | 'Active' | 'Inactive'>('All')

const filteredItems = computed(() => items.value.filter((item) => {
  const matchesFromSystem = fromSystemFilter.value === 'All' || item.fromSystem === fromSystemFilter.value
  const matchesStatus = statusFilter.value === 'All' || (statusFilter.value === 'Active' ? item.isActive : !item.isActive)
  return matchesFromSystem && matchesStatus
}))

// From System and Status aren't sortable server-side, so those columns are
// sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: ModelCodeProcessSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: ModelCodeProcess) => string | number> = {
  fromSystem: item => item.fromSystem,
  status: item => (item.isActive ? 1 : 0),
}

const sortedItems = computed(() => {
  if (!clientSort.value) return filteredItems.value
  const { key, order } = clientSort.value
  const accessor = CLIENT_SORT_ACCESSORS[key]
  if (!accessor) return filteredItems.value
  return [...filteredItems.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
})

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingModelCodeProcess = ref<ModelCodeProcess | null>(null)
const deletingModelCodeProcess = ref<ModelCodeProcess | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchModelCodeProcesses()
})

function openCreate() {
  editingModelCodeProcess.value = null
  showFormDialog.value = true
}

function openEdit(modelCodeProcess: ModelCodeProcess) {
  editingModelCodeProcess.value = modelCodeProcess
  showFormDialog.value = true
}

function openDelete(modelCodeProcess: ModelCodeProcess) {
  deletingModelCodeProcess.value = modelCodeProcess
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateModelCodeProcessInput) {
  submitting.value = true
  const ok = editingModelCodeProcess.value
    ? await updateModelCodeProcess(editingModelCodeProcess.value.id, input)
    : await createModelCodeProcess(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingModelCodeProcess.value) return
  deleting.value = true
  const ok = await deleteModelCodeProcess(deletingModelCodeProcess.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchModelCodeProcesses()
}

function handleSort(patch: { sortBy: ModelCodeProcessSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchModelCodeProcesses()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchModelCodeProcesses()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Model Code Process</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and manage all Model Code Processes
        </p>
      </div>

      <button
        v-if="hasPermission('model-code-process.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Model Code Process
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <ModelCodeProcessesFilter :filters="filters" @change="handleFilterChange" />

      <select
        v-model="fromSystemFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All From System</option>
        <option value="MES">MES</option>
        <option value="WMS">WMS</option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="fetchModelCodeProcesses()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <ModelCodeProcessesTable
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
      item-label="model code processes"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <ModelCodeProcessesFormDialog
      v-model="showFormDialog"
      :model-code-process="editingModelCodeProcess"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <ModelCodeProcessesDeleteDialog
      v-model="showDeleteDialog"
      :model-code-process="deletingModelCodeProcess"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
