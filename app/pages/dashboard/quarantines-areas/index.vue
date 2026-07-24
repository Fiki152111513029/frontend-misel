<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { QuarantineAreaSortKey } from '~/components/quarantine-areas/Table.vue'
import type { CreateQuarantineAreaInput, QuarantineArea } from '~/types/quarantine-area'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Quarantine Areas — Misel' })

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchQuarantineAreas,
  createQuarantineArea,
  updateQuarantineArea,
  deleteQuarantineArea,
  setFilters,
} = useQuarantineAreas()
const { items: quarantineLines, fetchQuarantineLines } = useQuarantineLines()

const quarantineLineFilter = ref('All')

const filteredItems = computed(() => items.value.filter((item) => {
  return quarantineLineFilter.value === 'All' || item.quarantineLineId === quarantineLineFilter.value
}))

// iRayple Location Code and Quarantine Line aren't sortable server-side, so
// those columns are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: QuarantineAreaSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: QuarantineArea) => string> = {
  iRaypleLocationCode: item => item.iRaypleLocationCode.toLowerCase(),
  quarantineLine: item => item.quarantineLine.name.toLowerCase(),
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
const editingQuarantineArea = ref<QuarantineArea | null>(null)
const deletingQuarantineArea = ref<QuarantineArea | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchQuarantineAreas()
  fetchQuarantineLines({ limit: 100 })
})

function openCreate() {
  editingQuarantineArea.value = null
  showFormDialog.value = true
}

function openEdit(quarantineArea: QuarantineArea) {
  editingQuarantineArea.value = quarantineArea
  showFormDialog.value = true
}

function openDelete(quarantineArea: QuarantineArea) {
  deletingQuarantineArea.value = quarantineArea
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateQuarantineAreaInput) {
  submitting.value = true
  const ok = editingQuarantineArea.value
    ? await updateQuarantineArea(editingQuarantineArea.value.id, input)
    : await createQuarantineArea(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingQuarantineArea.value) return
  deleting.value = true
  const ok = await deleteQuarantineArea(deletingQuarantineArea.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchQuarantineAreas()
}

function handleSort(patch: { sortBy: QuarantineAreaSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchQuarantineAreas()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchQuarantineAreas()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Quarantines Areas</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Quarantines Areas</p>
      </div>

      <button
        v-if="hasPermission('quarantine-area.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Quarantine Area
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
    </div>

    <QuarantineAreasTable
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
      item-label="quarantine areas"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <QuarantineAreasFormDialog
      v-model="showFormDialog"
      :quarantine-area="editingQuarantineArea"
      :quarantine-lines="quarantineLines"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <QuarantineAreasDeleteDialog
      v-model="showDeleteDialog"
      :quarantine-area="deletingQuarantineArea"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
