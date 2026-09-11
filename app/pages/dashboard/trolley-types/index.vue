<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import type { TrolleyTypeSortKey } from '~/components/trolley-types/Table.vue'
import type {
  TrolleyType,
  CreateTrolleyTypeInput,
} from '~/types/trolley-type'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolley Types — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchTrolleyTypes,
  createTrolleyType,
  updateTrolleyType,
  deleteTrolleyType,
  setFilters,
} = useTrolleyTypes()

const searchText = ref(filters.value.search ?? '')
const emitSearch = useDebounceFn(() => {
  setFilters({ search: searchText.value, page: 1 })
  fetchTrolleyTypes()
}, 400)
watch(searchText, emitSearch)

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingTrolleyType = ref<TrolleyType | null>(null)
const deletingTrolleyType = ref<TrolleyType | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchTrolleyTypes()
})

function openCreate() {
  editingTrolleyType.value = null
  showFormDialog.value = true
}

function openEdit(trolleyType: TrolleyType) {
  editingTrolleyType.value = trolleyType
  showFormDialog.value = true
}

function openDelete(trolleyType: TrolleyType) {
  deletingTrolleyType.value = trolleyType
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateTrolleyTypeInput) {
  submitting.value = true
  const ok = editingTrolleyType.value
    ? await updateTrolleyType(editingTrolleyType.value.id, input)
    : await createTrolleyType(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingTrolleyType.value) return
  deleting.value = true
  const ok = await deleteTrolleyType(deletingTrolleyType.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleSort(patch: { sortBy: TrolleyTypeSortKey, sortOrder: 'asc' | 'desc' }) {
  setFilters({ ...patch, page: 1 })
  fetchTrolleyTypes()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchTrolleyTypes()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchTrolleyTypes()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Trolley Types</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Trolley Types</p>
      </div>

      <button
        v-if="hasPermission('trolley-type.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Trolley Type
      </button>
    </div>

    <div class="mb-4 w-full min-w-[200px] sm:max-w-xs">
      <UiBaseInput v-model="searchText" placeholder="Search by name..." />
    </div>

    <TrolleyTypesTable
      :items="items"
      :loading="loading"
      :sort-by="(filters.sortBy as TrolleyTypeSortKey)"
      :sort-order="filters.sortOrder"
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
      item-label="trolley types"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <TrolleyTypesFormDialog
      v-model="showFormDialog"
      :trolley-type="editingTrolleyType"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <TrolleyTypesDeleteDialog
      v-model="showDeleteDialog"
      :trolley-type="deletingTrolleyType"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
