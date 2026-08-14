<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { TrolleyCategorySortKey } from '~/components/trolley-categories/Table.vue'
import type {
  CreateTrolleyCategoryInput,
  TrolleyCategory,
} from '~/types/trolley-category'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Trolley Categories — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchTrolleyCategories,
  createTrolleyCategory,
  updateTrolleyCategory,
  deleteTrolleyCategory,
  setFilters,
} = useTrolleyCategories()

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingTrolleyCategory = ref<TrolleyCategory | null>(null)
const deletingTrolleyCategory = ref<TrolleyCategory | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchTrolleyCategories()
})

function openCreate() {
  editingTrolleyCategory.value = null
  showFormDialog.value = true
}

function openEdit(trolleyCategory: TrolleyCategory) {
  editingTrolleyCategory.value = trolleyCategory
  showFormDialog.value = true
}

function openDelete(trolleyCategory: TrolleyCategory) {
  deletingTrolleyCategory.value = trolleyCategory
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateTrolleyCategoryInput) {
  submitting.value = true
  const ok = editingTrolleyCategory.value
    ? await updateTrolleyCategory(editingTrolleyCategory.value.id, input)
    : await createTrolleyCategory(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingTrolleyCategory.value) return
  deleting.value = true
  const ok = await deleteTrolleyCategory(deletingTrolleyCategory.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleSort(patch: { sortBy: TrolleyCategorySortKey, sortOrder: 'asc' | 'desc' }) {
  setFilters({ ...patch, page: 1 })
  fetchTrolleyCategories()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchTrolleyCategories()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchTrolleyCategories()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Trolley Categories</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Trolley Categories</p>
      </div>

      <button
        v-if="hasPermission('trolley-category.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Trolley Category
      </button>
    </div>

    <TrolleyCategoriesTable
      :items="items"
      :loading="loading"
      :sort-by="filters.sortBy"
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
      item-label="trolley categories"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <TrolleyCategoriesFormDialog
      v-model="showFormDialog"
      :trolley-category="editingTrolleyCategory"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <TrolleyCategoriesDeleteDialog
      v-model="showDeleteDialog"
      :trolley-category="deletingTrolleyCategory"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
