<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next'
import type { TrolleySortKey } from '~/components/trolleys/Table.vue'
import type {
  CreateTrolleyInput,
  Trolley,
} from '~/types/trolley'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolleys — YAZAKI' })

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchTrolleys,
  createTrolley,
  updateTrolley,
  deleteTrolley,
  bulkDeleteTrolleys,
  setFilters,
} = useTrolleys()

// Code, Category, Dropping Location Code, and Status aren't sortable
// server-side, so those columns are sorted client-side over the currently
// loaded page only.
const clientSort = ref<{ key: TrolleySortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: Trolley) => string | number> = {
  code: item => item.code.toLowerCase(),
  category: item => (item.category?.name ?? '').toLowerCase(),
  droppingLocationCode: item => (item.droppingLocationCode ?? '').toLowerCase(),
  modelCodeProcess: item => (item.modelCodeProcess?.name ?? '').toLowerCase(),
  status: item => (item.status === 'FULL' ? 1 : 0),
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
const editingTrolley = ref<Trolley | null>(null)
const deletingTrolley = ref<Trolley | null>(null)
const submitting = ref(false)
const deleting = ref(false)

// Ids ticked in the table, kept across pages. Cleared once a delete goes
// through, and whenever the filter changes - a selection made against one
// search is not a selection against the next one.
const selectedIds = ref<string[]>([])
// Set while the dialog is confirming a selection rather than one row; the
// two share a dialog, and this is what tells them apart on confirm.
const bulkDeleting = ref(false)

onMounted(() => {
  fetchTrolleys()
})

function openCreate() {
  editingTrolley.value = null
  showFormDialog.value = true
}

function openEdit(trolley: Trolley) {
  editingTrolley.value = trolley
  showFormDialog.value = true
}

function openDelete(trolley: Trolley) {
  bulkDeleting.value = false
  deletingTrolley.value = trolley
  showDeleteDialog.value = true
}

function openBulkDelete() {
  if (selectedIds.value.length === 0) return
  bulkDeleting.value = true
  deletingTrolley.value = null
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateTrolleyInput) {
  submitting.value = true
  const ok = editingTrolley.value
    ? await updateTrolley(editingTrolley.value.id, input)
    : await createTrolley(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  deleting.value = true
  let ok = false
  if (bulkDeleting.value) {
    ok = await bulkDeleteTrolleys(selectedIds.value)
    // Cleared on success only: a failure leaves the ticks where they were
    // so the admin can retry without picking everything again.
    if (ok) selectedIds.value = []
  } else if (deletingTrolley.value) {
    const id = deletingTrolley.value.id
    ok = await deleteTrolley(id)
    if (ok) selectedIds.value = selectedIds.value.filter(selected => selected !== id)
  }
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  // The ticks were made against the previous result set. Carrying them
  // into a different one means deleting rows nobody can see.
  selectedIds.value = []
  setFilters({ ...patch, page: 1 })
  fetchTrolleys()
}

function handleSort(patch: { sortBy: TrolleySortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchTrolleys()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchTrolleys()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Trolleys</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Trolleys</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiImportExportToolbar
          base-path="/trolleys"
          filename-stem="trolleys"
          entity-label="Trolleys"
          :can-export="hasPermission('trolley.read')"
          :can-import="hasPermission('trolley.create')"
          @imported="fetchTrolleys()"
        />
        <button
          v-if="hasPermission('trolley.create')"
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" />
          Add Trolley
        </button>
      </div>
    </div>

    <!-- Only here when something is ticked: a toolbar that is permanently
         on screen but usually inert reads as part of the furniture, and
         this one deletes things. -->
    <div
      v-if="selectedIds.length > 0"
      class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#01ADEF]/30 bg-[#01ADEF]/5 px-4 py-2.5"
    >
      <p class="text-sm font-semibold text-[#0F1F52]">
        {{ selectedIds.length }} selected
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300"
          @click="selectedIds = []"
        >
          <X class="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          v-if="hasPermission('trolley.delete')"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
          @click="openBulkDelete"
        >
          <Trash2 class="h-3.5 w-3.5" />
          Delete selected
        </button>
      </div>
    </div>

    <TrolleysTable
      v-model:selected="selectedIds"
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
      item-label="trolleys"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <TrolleysFormDialog
      v-model="showFormDialog"
      :trolley="editingTrolley"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <TrolleysDeleteDialog
      v-model="showDeleteDialog"
      :trolley="deletingTrolley"
      :count="bulkDeleting ? selectedIds.length : null"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
