<script setup lang="ts">
import { Plus, RefreshCw } from 'lucide-vue-next'
import type { ProductionLineSortKey } from '~/components/production-lines/Table.vue'
import type { CreateProductionLineInput, ProductionLine } from '~/types/production-line'

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Production Lines — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchProductionLines,
  createProductionLine,
  updateProductionLine,
  deleteProductionLine,
  setFilters,
} = useProductionLines()
const { items: quarantineLines, fetchQuarantineLines } = useQuarantineLines()
const usersStore = useUsersStore()

// Backend list endpoint only supports search/sort — Quarantine Line, Operator,
// and Status are filtered client-side over the currently loaded page only.
const quarantineLineFilter = ref('All')
const operatorFilter = ref('All')
const statusFilter = ref<'All' | 'Active' | 'Inactive'>('All')

const filteredItems = computed(() => items.value.filter((item) => {
  const matchesQuarantineLine = quarantineLineFilter.value === 'All' || item.quarantineLineId === quarantineLineFilter.value
  const matchesOperator = operatorFilter.value === 'All' || item.operatorId === operatorFilter.value
  const matchesStatus = statusFilter.value === 'All'
    || (statusFilter.value === 'Active' ? item.isActive : !item.isActive)
  return matchesQuarantineLine && matchesOperator && matchesStatus
}))

// Quarantine Line, Operator, and Status aren't sortable server-side, so those
// columns are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: ProductionLineSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: ProductionLine) => string | number> = {
  quarantineLine: item => item.quarantineLine.name.toLowerCase(),
  operator: item => item.operator.username.toLowerCase(),
  isActive: item => (item.isActive ? 1 : 0),
}

const sortedItems = computed(() => {
  if (!clientSort.value) return filteredItems.value
  const { key, order } = clientSort.value
  const accessor = CLIENT_SORT_ACCESSORS[key]
  if (!accessor) return filteredItems.value
  const sorted = [...filteredItems.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
  return sorted
})

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingProductionLine = ref<ProductionLine | null>(null)
const deletingProductionLine = ref<ProductionLine | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchProductionLines()
  fetchQuarantineLines({ limit: 100 })
  usersStore.loadUsers()
})

function openCreate() {
  editingProductionLine.value = null
  showFormDialog.value = true
}

function openEdit(productionLine: ProductionLine) {
  editingProductionLine.value = productionLine
  showFormDialog.value = true
}

function openDelete(productionLine: ProductionLine) {
  deletingProductionLine.value = productionLine
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateProductionLineInput) {
  submitting.value = true
  const ok = editingProductionLine.value
    ? await updateProductionLine(editingProductionLine.value.id, input)
    : await createProductionLine(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingProductionLine.value) return
  deleting.value = true
  const ok = await deleteProductionLine(deletingProductionLine.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchProductionLines()
}

function handleSort(patch: { sortBy: ProductionLineSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchProductionLines()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchProductionLines()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Production Lines</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Production Lines</p>
      </div>

      <button
        v-if="hasPermission('production-line.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Production Line
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="quarantineLineFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Quarantine Lines</option>
        <option v-for="line in quarantineLines" :key="line.id" :value="line.id">{{ line.name }}</option>
      </select>

      <select
        v-model="operatorFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Operators</option>
        <option v-for="operator in usersStore.items" :key="operator.id" :value="operator.id">{{ operator.username }}</option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#0F1F52] transition-colors hover:border-slate-300"
        @click="fetchProductionLines()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <ProductionLinesTable
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
      item-label="production lines"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <ProductionLinesFormDialog
      v-model="showFormDialog"
      :production-line="editingProductionLine"
      :quarantine-lines="quarantineLines"
      :users="usersStore.items"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <ProductionLinesDeleteDialog
      v-model="showDeleteDialog"
      :production-line="deletingProductionLine"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
