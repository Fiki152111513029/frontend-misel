<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { BoxType, BoxTypeSortBy, BoxTypeSortOrder } from '~/types/box-type'

export type BoxTypeSortKey = BoxTypeSortBy | 'color' | 'fromSystem'

interface Props {
  items: BoxType[]
  loading: boolean
  sortBy?: BoxTypeSortKey
  sortOrder?: BoxTypeSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [boxType: BoxType]
  delete: [boxType: BoxType]
  sort: [patch: { sortBy: BoxTypeSortKey, sortOrder: BoxTypeSortOrder }]
}>()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'ordering', label: 'Ordering', width: '100px' },
  { key: 'color', label: 'Color Preview' },
  { key: 'fromSystem', label: 'From System', width: '110px' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: BoxTypeSortKey, order: BoxTypeSortOrder }>({
  key: props.sortBy ?? 'ordering',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: BoxTypeSortKey) {
  const order: BoxTypeSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
            @click="toggleSort(col.key as BoxTypeSortKey)"
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
          No box types found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ item.name }}</td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ item.ordering }}</td>
          <td class="px-4 py-3">
            <BoxTypesColorPreview :color-code="item.colorCode" />
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium bg-[#01ADEF]/10 text-[#01ADEF]"
            >
              {{ item.fromSystem }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ formatDate(item.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
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
