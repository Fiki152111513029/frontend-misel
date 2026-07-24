<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { RequestBoxSortKey } from '~/components/request-boxes/Table.vue'
import type { CreateRequestBoxInput, RequestBox } from '~/types/request-box'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Request Box — Misel' })

const SERVER_SORT_KEYS = ['qty', 'createdAt'] as const

const { hasPermission } = useAuth()
const { items, meta, loading, fetchRequestBoxes, createRequestBox, deleteRequestBox, setFilters } =
  useRequestBoxes()
const { items: productionLines, fetchProductionLines } = useProductionLines()
const { items: boxTypes, fetchBoxTypes } = useBoxTypes()

// Only qty and createdAt are sortable server-side — the remaining columns
// are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: RequestBoxSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: RequestBox) => string> = {
  productionLine: item => item.productionLine.name.toLowerCase(),
  box: item => item.boxType.name.toLowerCase(),
  updatedAt: item => item.updatedAt,
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
const deletingRequestBox = ref<RequestBox | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchRequestBoxes()
  fetchProductionLines({ limit: 100 })
  fetchBoxTypes({ limit: 100 })
})

function openCreate() {
  showFormDialog.value = true
}

function openDelete(requestBox: RequestBox) {
  deletingRequestBox.value = requestBox
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateRequestBoxInput) {
  submitting.value = true
  const ok = await createRequestBox(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingRequestBox.value) return
  deleting.value = true
  const ok = await deleteRequestBox(deletingRequestBox.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function goToPage(page: number) {
  setFilters({ page })
  fetchRequestBoxes()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchRequestBoxes()
}

function handleSort(patch: { sortBy: RequestBoxSortKey, sortOrder: 'asc' | 'desc' }) {
  if ((SERVER_SORT_KEYS as readonly string[]).includes(patch.sortBy)) {
    clientSort.value = null
    setFilters(patch)
    fetchRequestBoxes()
  } else {
    clientSort.value = patch
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Request Box</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Request Box</p>
      </div>

      <button
        v-if="hasPermission('request-box.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Request Box
      </button>
    </div>

    <RequestBoxesTable
      :items="sortedItems"
      :loading="loading"
      :sort-by="clientSort?.key"
      :sort-order="clientSort?.order"
      @delete="openDelete"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="request boxes"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <RequestBoxesFormDialog
      v-model="showFormDialog"
      :production-lines="productionLines"
      :box-types="boxTypes"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <RequestBoxesDeleteDialog
      v-model="showDeleteDialog"
      :request-box="deletingRequestBox"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
