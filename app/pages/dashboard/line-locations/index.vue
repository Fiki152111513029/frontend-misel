<script setup lang="ts">
import { Plus, RefreshCw } from 'lucide-vue-next'
import type { WarehouseLineLocationSortKey } from '~/components/warehouse-line-locations/Table.vue'
import type {
  CreateWarehouseLineLocationInput,
  WarehouseLineLocation,
} from '~/types/warehouse-line-location'

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Line Locations — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchWarehouseLineLocations,
  createWarehouseLineLocation,
  updateWarehouseLineLocation,
  deleteWarehouseLineLocation,
  setFilters,
} = useWarehouseLineLocations()

// Dropping/Picking Location Code aren't sortable server-side, so those
// columns are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: WarehouseLineLocationSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: WarehouseLineLocation) => string> = {
  droppingLocationCode: item => item.droppingLocationCode.toLowerCase(),
  pickingLocationCode: item => item.pickingLocationCode.toLowerCase(),
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
const editingWarehouseLineLocation = ref<WarehouseLineLocation | null>(null)
const deletingWarehouseLineLocation = ref<WarehouseLineLocation | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchWarehouseLineLocations()
})

function openCreate() {
  editingWarehouseLineLocation.value = null
  showFormDialog.value = true
}

function openEdit(warehouseLineLocation: WarehouseLineLocation) {
  editingWarehouseLineLocation.value = warehouseLineLocation
  showFormDialog.value = true
}

function openDelete(warehouseLineLocation: WarehouseLineLocation) {
  deletingWarehouseLineLocation.value = warehouseLineLocation
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateWarehouseLineLocationInput) {
  submitting.value = true
  const ok = editingWarehouseLineLocation.value
    ? await updateWarehouseLineLocation(editingWarehouseLineLocation.value.id, input)
    : await createWarehouseLineLocation(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingWarehouseLineLocation.value) return
  deleting.value = true
  const ok = await deleteWarehouseLineLocation(deletingWarehouseLineLocation.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchWarehouseLineLocations()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchWarehouseLineLocations()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchWarehouseLineLocations()
}

function handleSort(patch: { sortBy: WarehouseLineLocationSortKey, sortOrder: 'asc' | 'desc' }) {
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
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Line Locations</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Line Locations</p>
      </div>

      <button
        v-if="hasPermission('warehouse-line-location.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Line Location
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <WarehouseLineLocationsFilter :filters="filters" @change="handleFilterChange" />

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="fetchWarehouseLineLocations()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <WarehouseLineLocationsTable
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
      item-label="line locations"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <WarehouseLineLocationsFormDialog
      v-model="showFormDialog"
      :warehouse-line-location="editingWarehouseLineLocation"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <WarehouseLineLocationsDeleteDialog
      v-model="showDeleteDialog"
      :warehouse-line-location="deletingWarehouseLineLocation"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
