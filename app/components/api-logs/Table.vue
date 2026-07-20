<script setup lang="ts">
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-vue-next'
import type { ApiLog, ApiLogSortBy, ApiLogSortOrder, HttpMethod } from '~/types/api-log'

interface Props {
  items: ApiLog[]
  loading: boolean
  sortBy?: ApiLogSortBy
  sortOrder?: ApiLogSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [patch: { sortBy: ApiLogSortBy, sortOrder: ApiLogSortOrder }]
  viewPayload: [payload: Record<string, unknown>, title: string]
}>()

const columns = [
  { key: 'createdAt', label: 'Created At' },
  { key: 'method', label: 'Method', width: '90px' },
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'statusCode', label: 'Status', width: '90px' },
  { key: 'durationMs', label: 'Duration', width: '100px' },
  { key: 'requestPayload', label: 'Request Payload', width: '140px' },
  { key: 'responsePayload', label: 'Response Payload', width: '140px' },
]

const sortableKeys: ApiLogSortBy[] = ['createdAt', 'method', 'endpoint', 'statusCode', 'durationMs']

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  POST: 'bg-[#01ADEF]/10 text-[#01ADEF]',
  PUT: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  PATCH: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  DELETE: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}

function statusStyle(statusCode: number) {
  if (statusCode >= 500) return 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
  if (statusCode >= 400) return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
  return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
}

const activeSort = ref<{ key: ApiLogSortBy, order: ApiLogSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: ApiLogSortBy) {
  const order: ApiLogSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div>
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th
          v-for="col in columns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <button
            v-if="sortableKeys.includes(col.key as ApiLogSortBy)"
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as ApiLogSortBy)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
          <template v-else>{{ col.label }}</template>
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-16 text-center">
          <p class="text-lg font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">No API logs found</p>
          <p class="font-medium mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            No records match the selected time range.
          </p>
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="METHOD_STYLE[item.method]">
              {{ item.method }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.endpoint }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusStyle(item.statusCode)">
              {{ item.statusCode }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.durationMs }} ms
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-sm font-medium text-[#2F6FED] hover:text-[#1D4FD8] transition-colors"
              @click="emit('viewPayload', item.requestPayload, `Request Payload — ${item.id}`)"
            >
              <ChevronRight class="h-3.5 w-3.5" />
              View
            </button>
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="inline-flex items-center gap-1 text-sm font-medium text-[#2F6FED] hover:text-[#1D4FD8] transition-colors"
              @click="emit('viewPayload', item.responsePayload, `Response Payload — ${item.id}`)"
            >
              <ChevronRight class="h-3.5 w-3.5" />
              View
            </button>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </div>
</template>
