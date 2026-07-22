<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { QuarantineLineSortKey } from '~/components/quarantine-lines/Table.vue'
import type { CreateQuarantineLineInput, QuarantineLine } from '~/types/quarantine-line'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Quarantine Lines — Misel' })

const SERVER_SORT_KEYS = ['name', 'createdAt'] as const

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchQuarantineLines,
  createQuarantineLine,
  updateQuarantineLine,
  deleteQuarantineLine,
  setFilters,
} = useQuarantineLines()

// Status and Task Template aren't sortable server-side, so those columns are
// sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: QuarantineLineSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: QuarantineLine) => string | number> = {
  status: item => (item.isActive ? 1 : 0),
  modelCodeProcess: item => (item.modelCodeProcess?.name ?? '').toLowerCase(),
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
const editingQuarantineLine = ref<QuarantineLine | null>(null)
const deletingQuarantineLine = ref<QuarantineLine | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchQuarantineLines()
})

function openCreate() {
  editingQuarantineLine.value = null
  showFormDialog.value = true
}

function openEdit(quarantineLine: QuarantineLine) {
  editingQuarantineLine.value = quarantineLine
  showFormDialog.value = true
}

function openDelete(quarantineLine: QuarantineLine) {
  deletingQuarantineLine.value = quarantineLine
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateQuarantineLineInput) {
  submitting.value = true
  const ok = editingQuarantineLine.value
    ? await updateQuarantineLine(editingQuarantineLine.value.id, input)
    : await createQuarantineLine(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingQuarantineLine.value) return
  deleting.value = true
  const ok = await deleteQuarantineLine(deletingQuarantineLine.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
  setFilters({ ...patch, page: 1 })
  fetchQuarantineLines()
}

function handleSort(patch: { sortBy: QuarantineLineSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<typeof filters.value>)
  } else {
    clientSort.value = patch
  }
}

function goToPage(page: number) {
  setFilters({ page })
  fetchQuarantineLines()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchQuarantineLines()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Quarantines Lines</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Quarantines Lines</p>
      </div>

      <button
        v-if="hasPermission('quarantine-line.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Quarantine Line
      </button>
    </div>

    <QuarantineLinesTable
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
      item-label="quarantine lines"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <QuarantineLinesFormDialog
      v-model="showFormDialog"
      :quarantine-line="editingQuarantineLine"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <QuarantineLinesDeleteDialog
      v-model="showDeleteDialog"
      :quarantine-line="deletingQuarantineLine"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
