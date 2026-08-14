<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { WarehouseLocationSortKey } from '~/components/warehouse-locations/Table.vue'
import type {
  CreateWarehouseLocationInput,
  WarehouseLocation,
} from '~/types/warehouse-location'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Warehouse Locations — Misel' })

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchWarehouseLocations,
  createWarehouseLocation,
  updateWarehouseLocation,
  deleteWarehouseLocation,
  setFilters,
} = useWarehouseLocations()

// iRayple Location Code and Status aren't sortable server-side, so those
// columns are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: WarehouseLocationSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: WarehouseLocation) => string | number> = {
  iRaypleLocationCode: item => item.iRaypleLocationCode.toLowerCase(),
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
const editingWarehouseLocation = ref<WarehouseLocation | null>(null)
const deletingWarehouseLocation = ref<WarehouseLocation | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchWarehouseLocations()
})

function openCreate() {
  editingWarehouseLocation.value = null
  showFormDialog.value = true
}

function openEdit(warehouseLocation: WarehouseLocation) {
  editingWarehouseLocation.value = warehouseLocation
  showFormDialog.value = true
}

function openDelete(warehouseLocation: WarehouseLocation) {
  deletingWarehouseLocation.value = warehouseLocation
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateWarehouseLocationInput) {
  submitting.value = true
  const ok = editingWarehouseLocation.value
    ? await updateWarehouseLocation(editingWarehouseLocation.value.id, input)
    : await createWarehouseLocation(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingWarehouseLocation.value) return
  deleting.value = true
  const ok = await deleteWarehouseLocation(deletingWarehouseLocation.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchWarehouseLocations()
}

function handleSort(patch: { sortBy: WarehouseLocationSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchWarehouseLocations()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchWarehouseLocations()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Warehouse Locations</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Warehouse Locations</p>
      </div>

      <button
        v-if="hasPermission('warehouse-location.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Warehouse Location
      </button>
    </div>

    <WarehouseLocationsTable
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
      item-label="warehouse locations"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <WarehouseLocationsFormDialog
      v-model="showFormDialog"
      :warehouse-location="editingWarehouseLocation"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <WarehouseLocationsDeleteDialog
      v-model="showDeleteDialog"
      :warehouse-location="deletingWarehouseLocation"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
