<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { BoxTypeSortKey } from '~/components/box-types/Table.vue'
import type { BoxType, BoxTypeQuery, CreateBoxTypeInput } from '~/types/box-type'

const SERVER_SORT_KEYS = ['name', 'ordering', 'createdAt'] as const

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Box Types — Misel' })

const {
  items,
  meta,
  loading,
  filters,
  fetchBoxTypes,
  createBoxType,
  updateBoxType,
  deleteBoxType,
  setFilters,
} = useBoxTypes()

// Color Preview and From System aren't sortable server-side, so those
// columns are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: BoxTypeSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: BoxType) => string> = {
  color: item => item.colorCode.toLowerCase(),
  fromSystem: item => item.fromSystem,
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
const editingBoxType = ref<BoxType | null>(null)
const deletingBoxType = ref<BoxType | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchBoxTypes()
})

function openCreate() {
  editingBoxType.value = null
  showFormDialog.value = true
}

function openEdit(boxType: BoxType) {
  editingBoxType.value = boxType
  showFormDialog.value = true
}

function openDelete(boxType: BoxType) {
  deletingBoxType.value = boxType
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateBoxTypeInput) {
  submitting.value = true
  const ok = editingBoxType.value
    ? await updateBoxType(editingBoxType.value.id, input)
    : await createBoxType(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingBoxType.value) return
  deleting.value = true
  const ok = await deleteBoxType(deletingBoxType.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleFilterChange(patch: Partial<BoxTypeQuery>) {
  setFilters({ ...patch, page: 1 })
  fetchBoxTypes()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchBoxTypes()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchBoxTypes()
}

function handleSort(patch: { sortBy: BoxTypeSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    handleFilterChange(patch as Partial<BoxTypeQuery>)
  } else {
    clientSort.value = { key: patch.sortBy, order: patch.sortOrder }
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Box Types</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Manage box type categories used across the warehouse
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Box Type
      </button>
    </div>

    <BoxTypesTable
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
      item-label="box types"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <BoxTypesFormDialog
      v-model="showFormDialog"
      :box-type="editingBoxType"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <BoxTypesDeleteDialog
      v-model="showDeleteDialog"
      :box-type="deletingBoxType"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
