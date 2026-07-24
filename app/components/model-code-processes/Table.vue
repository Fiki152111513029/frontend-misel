<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { ModelCodeProcess, ModelCodeProcessSortBy, ModelCodeProcessSortOrder } from '~/types/model-code-process'

export type ModelCodeProcessSortKey = ModelCodeProcessSortBy | 'fromSystem' | 'status'

interface Props {
  items: ModelCodeProcess[]
  loading: boolean
  sortBy?: ModelCodeProcessSortKey
  sortOrder?: ModelCodeProcessSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [modelCodeProcess: ModelCodeProcess]
  delete: [modelCodeProcess: ModelCodeProcess]
  sort: [patch: { sortBy: ModelCodeProcessSortKey, sortOrder: ModelCodeProcessSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'fromSystem', label: 'From System', width: '110px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'fromSystem', label: 'From System', width: '110px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'createdAt', label: 'Created' },
]

const activeSort = ref<{ key: ModelCodeProcessSortKey, order: ModelCodeProcessSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: ModelCodeProcessSortKey) {
  const order: ModelCodeProcessSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as ModelCodeProcessSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 120px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No model code processes found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium bg-[#01ADEF]/10 text-[#01ADEF]"
            >
              {{ item.fromSystem }}
            </span>
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="item.isActive
 ? 'bg-emerald-50 text-emerald-600 '
 : 'bg-slate-100 text-slate-500 '"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('model-code-process.update')"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('model-code-process.delete')"
                type="button"
                class="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
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
