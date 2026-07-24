<script setup lang="ts">
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-vue-next'
import type { HttpMethod, WebhookLog, WebhookLogSortBy, WebhookLogSortOrder } from '~/types/webhook-log'

interface Props {
  items: WebhookLog[]
  loading: boolean
  sortBy?: WebhookLogSortBy
  sortOrder?: WebhookLogSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [patch: { sortBy: WebhookLogSortBy, sortOrder: WebhookLogSortOrder }]
  viewPayload: [payload: Record<string, unknown>, title: string]
}>()

const columns = [
  { key: 'createdAt', label: 'Created At' },
  { key: 'method', label: 'Method', width: '100px' },
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'requestPayload', label: 'Request Payload', width: '140px' },
  { key: 'responsePayload', label: 'Response Payload', width: '140px' },
]

const sortableColumns = columns.filter(col => col.key === 'createdAt' || col.key === 'method' || col.key === 'endpoint')

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET: 'bg-emerald-50 text-emerald-600',
  POST: 'bg-[#01ADEF]/10 text-[#01ADEF]',
  PUT: 'bg-amber-50 text-amber-600',
  PATCH: 'bg-purple-50 text-purple-600',
  DELETE: 'bg-red-50 text-red-500',
}

const activeSort = ref<{ key: WebhookLogSortBy, order: WebhookLogSortOrder }>({
  key: props.sortBy ?? 'createdAt',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: WebhookLogSortBy) {
  const order: WebhookLogSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            v-if="sortableColumns.includes(col)"
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as WebhookLogSortBy)"
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
          <p class="text-lg font-semibold text-[#0F1F52]">No webhook logs found</p>
          <p class="font-medium mt-1.5 text-sm text-slate-500">
            No records match the selected time range.
          </p>
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="METHOD_STYLE[item.method]">
              {{ item.method }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.endpoint }}
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
