<script setup lang="ts">
import { ChevronDown, ChevronUp, ImageIcon, Pencil, Trash2 } from 'lucide-vue-next'
import type { FactoryMap, FactoryMapSortBy, FactoryMapSortOrder } from '~/types/factory-map'

interface Props {
  items: FactoryMap[]
  loading: boolean
  sortBy?: FactoryMapSortBy
  sortOrder?: FactoryMapSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [factoryMap: FactoryMap]
  delete: [factoryMap: FactoryMap]
  sort: [patch: { sortBy: FactoryMapSortBy, sortOrder: FactoryMapSortOrder }]
}>()

const columns = [
  { key: 'image', label: 'Image', width: '96px' },
  { key: 'name', label: 'Name' },
  { key: 'areaNumber', label: 'Area Number', width: '120px' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions' && col.key !== 'image')

const activeSort = ref<{ key: FactoryMapSortBy, order: FactoryMapSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: FactoryMapSortBy) {
  const order: FactoryMapSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
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
        <th style="width: 96px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          Image
        </th>
        <th
          v-for="col in sortableColumns"
          :key="col.key"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as FactoryMapSortBy)"
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
          No factory maps found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="h-12 w-16 rounded-lg border border-[#E2E8F0] object-cover"
            />
            <div
              v-else
              class="flex h-12 w-16 items-center justify-center rounded-lg border border-[#E2E8F0] bg-slate-50"
            >
              <ImageIcon class="h-4 w-4 text-slate-300" />
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ item.name }}</td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.areaNumber ?? '-' }}
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
