<script setup lang="ts">
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-vue-next'
import type { RequestBox, RequestBoxSortBy, RequestBoxSortOrder } from '~/types/request-box'

export type RequestBoxSortKey = RequestBoxSortBy | 'productionLine' | 'box' | 'updatedAt'

interface Props {
  items: RequestBox[]
  loading: boolean
  sortBy?: RequestBoxSortKey
  sortOrder?: RequestBoxSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  delete: [requestBox: RequestBox]
  sort: [patch: { sortBy: RequestBoxSortKey, sortOrder: RequestBoxSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'productionLine', label: 'Production Line' },
  { key: 'box', label: 'Box' },
  { key: 'qty', label: 'Qty', width: '80px' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
  { key: 'actions', label: 'Actions', width: '80px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: RequestBoxSortKey, order: RequestBoxSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: RequestBoxSortKey) {
  const order: RequestBoxSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <UiBaseCard padding="none">
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th
          v-for="col in sortableColumns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as RequestBoxSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 80px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No request boxes found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.productionLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            <span class="inline-flex items-center gap-1.5">
              <span
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: item.boxType.colorCode }"
              />
              {{ item.boxType.name }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.qty }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.updatedAt) }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('request-box.delete')"
                type="button"
                class="rounded-lg bg-red-50 dark:bg-red-900/15 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors"
                aria-label="Delete"
                @click="emit('delete', item)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
