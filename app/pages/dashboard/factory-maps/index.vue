<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { FactoryMap, FactoryMapQuery, UpdateFactoryMapInput } from '~/types/factory-map'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Factory Maps — Misel' })

const {
  items,
  meta,
  loading,
  filters,
  fetchFactoryMaps,
  createFactoryMap,
  updateFactoryMap,
  deleteFactoryMap,
  setFilters,
} = useFactoryMaps()

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingFactoryMap = ref<FactoryMap | null>(null)
const deletingFactoryMap = ref<FactoryMap | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchFactoryMaps()
})

function openCreate() {
  editingFactoryMap.value = null
  showFormDialog.value = true
}

function openEdit(factoryMap: FactoryMap) {
  editingFactoryMap.value = factoryMap
  showFormDialog.value = true
}

function openDelete(factoryMap: FactoryMap) {
  deletingFactoryMap.value = factoryMap
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: UpdateFactoryMapInput) {
  submitting.value = true
  // The dialog's own validation guarantees name/areaNumber/topologyFile are
  // present when creating (they're only optional in edit mode, to keep the
  // existing values/files when not replaced). imageFile stays optional in
  // both modes — some maps have no floor-plan raster.
  const ok = editingFactoryMap.value
    ? await updateFactoryMap(editingFactoryMap.value.id, input)
    : await createFactoryMap({
        name: input.name!,
        areaNumber: input.areaNumber!,
        imageFile: input.imageFile,
        topologyFile: input.topologyFile!,
      })
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingFactoryMap.value) return
  deleting.value = true
  const ok = await deleteFactoryMap(deletingFactoryMap.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleSort(patch: { sortBy: 'name' | 'createdAt', sortOrder: 'asc' | 'desc' }) {
  setFilters({ ...patch, page: 1 })
  fetchFactoryMaps()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchFactoryMaps()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchFactoryMaps()
}

function handleFilterChange(patch: Partial<FactoryMapQuery>) {
  setFilters({ ...patch, page: 1 })
  fetchFactoryMaps()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Factory Maps</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Manage the floor-plan images shown on the Dashboard's Factory Map card
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Factory Map
      </button>
    </div>

    <FactoryMapsFilter class="mb-4" :filters="filters" @change="handleFilterChange" />

    <FactoryMapsTable
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
      item-label="factory maps"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <FactoryMapsFormDialog
      v-model="showFormDialog"
      :factory-map="editingFactoryMap"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <FactoryMapsDeleteDialog
      v-model="showDeleteDialog"
      :factory-map="deletingFactoryMap"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
