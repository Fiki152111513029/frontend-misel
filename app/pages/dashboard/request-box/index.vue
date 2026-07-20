<script setup lang="ts">
import { Plus, RefreshCw, Search } from 'lucide-vue-next'
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

const search = ref('')
const productionLineFilter = ref('All')
const boxTypeFilter = ref('All')

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  return items.value.filter((item) => {
    const matchesProductionLine = productionLineFilter.value === 'All' || item.productionLineId === productionLineFilter.value
    const matchesBoxType = boxTypeFilter.value === 'All' || item.boxTypeId === boxTypeFilter.value
    const matchesSearch = !query
      || item.productionLine.name.toLowerCase().includes(query)
      || item.boxType.name.toLowerCase().includes(query)
    return matchesProductionLine && matchesBoxType && matchesSearch
  })
})

// Only qty and createdAt are sortable server-side — the remaining columns
// are sorted client-side over the currently loaded page only.
const clientSort = ref<{ key: RequestBoxSortKey, order: 'asc' | 'desc' } | null>(null)

const CLIENT_SORT_ACCESSORS: Record<string, (item: RequestBox) => string> = {
  productionLine: item => item.productionLine.name.toLowerCase(),
  box: item => item.boxType.name.toLowerCase(),
  updatedAt: item => item.updatedAt,
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
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Request Box</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage all Request Box</p>
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

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search production line, box type..."
          class="w-full rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] placeholder-slate-400 outline-none transition-colors focus:border-[#01ADEF]"
        />
      </div>

      <select
        v-model="productionLineFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Production Lines</option>
        <option v-for="line in productionLines" :key="line.id" :value="line.id">{{ line.name }}</option>
      </select>

      <select
        v-model="boxTypeFilter"
        class="rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Box Types</option>
        <option v-for="box in boxTypes" :key="box.id" :value="box.id">{{ box.name }}</option>
      </select>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="fetchRequestBoxes()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
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
