<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { TrolleySortKey } from '~/components/trolleys/Table.vue'
import type {
  CreateTrolleyInput,
  Trolley,
} from '~/types/trolley'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolleys — Misel' })

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
  setFilters,
} = useTrolleys()

// Code and Status aren't sortable server-side, so those columns are sorted
// client-side over the currently loaded page only.
const clientSort = ref<{ key: TrolleySortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: Trolley) => string | number> = {
  code: item => item.code.toLowerCase(),
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
  deletingTrolley.value = trolley
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
  if (!deletingTrolley.value) return
  deleting.value = true
  const ok = await deleteTrolley(deletingTrolley.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<typeof filters.value>) {
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

    <TrolleysTable
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
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
