<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { ProductionLineAreaSortKey } from '~/components/production-line-areas/Table.vue'
import type {
  CreateProductionLineAreaInput,
  ProductionLineArea,
} from '~/types/production-line-area'

const SERVER_SORT_KEYS = ['name', 'order', 'createdAt'] as const

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Production Line Areas — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchProductionLineAreas,
  createProductionLineArea,
  updateProductionLineArea,
  deleteProductionLineArea,
  reorderProductionLineAreas,
  setFilters,
} = useProductionLineAreas()
const { items: productionLines, fetchProductionLines } = useProductionLines()
const { items: eximLocations, fetchEximLocations } = useEximLocations()
const { items: emptyPalletLocations, fetchEmptyPalletLocations } = useEmptyPalletLocations()
const { items: modelCodeProcesses, fetchModelCodeProcesses } = useModelCodeProcesses()

// Backend list endpoint only supports search/sort — Type, Production Line,
// EXIM Location, and Empty Pallet Location are filtered client-side over the
// currently loaded page only.
const typeFilter = ref('All')
const productionLineFilter = ref('All')
const eximLocationFilter = ref('All')
const emptyPalletLocationFilter = ref('All')

const filteredItems = computed(() => items.value.filter((item) => {
  const matchesType = typeFilter.value === 'All' || item.type === typeFilter.value
  const matchesProductionLine = productionLineFilter.value === 'All' || item.productionLineId === productionLineFilter.value
  const matchesEximLocation = eximLocationFilter.value === 'All' || item.eximLocationId === eximLocationFilter.value
  const matchesEmptyPalletLocation = emptyPalletLocationFilter.value === 'All' || item.emptyPalletLocationId === emptyPalletLocationFilter.value
  return matchesType && matchesProductionLine && matchesEximLocation && matchesEmptyPalletLocation
}))

// Type, iRayple Location Code, Production Line, EXIM Location, and Empty
// Pallet Location aren't sortable server-side, so those columns are sorted
// client-side over the currently loaded page only.
const clientSort = ref<{ key: ProductionLineAreaSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: ProductionLineArea) => string> = {
  type: item => item.type,
  iRaypleLocationCode: item => item.iRaypleLocationCode.toLowerCase(),
  productionLine: item => item.productionLine.name.toLowerCase(),
  eximLocation: item => item.eximLocation.name.toLowerCase(),
  emptyPalletLocation: item => item.emptyPalletLocation.name.toLowerCase(),
  modelCodeProcess: item => (item.modelCodeProcess?.name ?? '').toLowerCase(),
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
const editingProductionLineArea = ref<ProductionLineArea | null>(null)
const deletingProductionLineArea = ref<ProductionLineArea | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchProductionLineAreas()
  fetchProductionLines({ limit: 100 })
  fetchEximLocations({ limit: 100 })
  fetchEmptyPalletLocations({ limit: 100 })
  fetchModelCodeProcesses({ limit: 100 })
})

function openCreate() {
  editingProductionLineArea.value = null
  showFormDialog.value = true
}

function openEdit(productionLineArea: ProductionLineArea) {
  editingProductionLineArea.value = productionLineArea
  showFormDialog.value = true
}

function openDelete(productionLineArea: ProductionLineArea) {
  deletingProductionLineArea.value = productionLineArea
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateProductionLineAreaInput) {
  submitting.value = true
  const ok = editingProductionLineArea.value
    ? await updateProductionLineArea(editingProductionLineArea.value.id, input)
    : await createProductionLineArea(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingProductionLineArea.value) return
  deleting.value = true
  const ok = await deleteProductionLineArea(deletingProductionLineArea.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchProductionLineAreas()
}

function handleSort(patch: { sortBy: ProductionLineAreaSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchProductionLineAreas()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchProductionLineAreas()
}

function handleReorder(reorderedItems: ProductionLineArea[]) {
  reorderProductionLineAreas(reorderedItems)
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Production Line Areas</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Production Line Areas</p>
      </div>

      <button
        v-if="hasPermission('production-line-area.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Production Line Area
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="typeFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Types</option>
        <option value="PRODUCTION">Production</option>
        <option value="STOCK">Stock</option>
      </select>

      <select
        v-model="productionLineFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Production Lines</option>
        <option v-for="line in productionLines" :key="line.id" :value="line.id">{{ line.name }}</option>
      </select>

      <select
        v-model="eximLocationFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All EXIM Locations</option>
        <option v-for="location in eximLocations" :key="location.id" :value="location.id">{{ location.name }}</option>
      </select>

      <select
        v-model="emptyPalletLocationFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Empty Pallet Locations</option>
        <option v-for="location in emptyPalletLocations" :key="location.id" :value="location.id">{{ location.name }}</option>
      </select>
    </div>

    <ProductionLineAreasTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key ?? filters.sortBy"
      :sort-order="clientSort?.order ?? filters.sortOrder"
      @edit="openEdit"
      @delete="openDelete"
      @reorder="handleReorder"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="production line areas"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <ProductionLineAreasFormDialog
      v-model="showFormDialog"
      :production-line-area="editingProductionLineArea"
      :production-lines="productionLines"
      :exim-locations="eximLocations"
      :empty-pallet-locations="emptyPalletLocations"
      :model-code-processes="modelCodeProcesses"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <ProductionLineAreasDeleteDialog
      v-model="showDeleteDialog"
      :production-line-area="deletingProductionLineArea"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
