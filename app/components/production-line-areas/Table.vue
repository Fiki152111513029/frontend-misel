<script setup lang="ts">
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from 'lucide-vue-next'
import type {
  ProductionLineArea,
  ProductionLineAreaSortBy,
  ProductionLineAreaSortOrder,
} from '~/types/production-line-area'

export type ProductionLineAreaSortKey =
  | ProductionLineAreaSortBy
  | 'type'
  | 'iRaypleLocationCode'
  | 'productionLine'
  | 'eximLocation'
  | 'emptyPalletLocation'
  | 'modelCodeProcess'

interface Props {
  items: ProductionLineArea[]
  loading: boolean
  sortBy?: ProductionLineAreaSortKey
  sortOrder?: ProductionLineAreaSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [productionLineArea: ProductionLineArea]
  delete: [productionLineArea: ProductionLineArea]
  reorder: [items: ProductionLineArea[]]
  sort: [patch: { sortBy: ProductionLineAreaSortKey, sortOrder: ProductionLineAreaSortOrder }]
}>()

const { hasPermission } = useAuth()

const canReorder = computed(() => hasPermission('production-line-area.update'))

const columns = computed(() => [
  ...(canReorder.value ? [{ key: 'drag', label: '', width: '36px' }] : []),
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Jenis' },
  { key: 'iRaypleLocationCode', label: 'iRayple Location Code' },
  { key: 'productionLine', label: 'Production Line' },
  { key: 'eximLocation', label: 'EXIM Location' },
  { key: 'emptyPalletLocation', label: 'Empty Pallet Location' },
  { key: 'modelCodeProcess', label: 'Task Template' },
  { key: 'order', label: 'Order', width: '80px' },
  { key: 'actions', label: 'Actions', width: '120px' },
])

const sortableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Jenis' },
  { key: 'iRaypleLocationCode', label: 'iRayple Location Code' },
  { key: 'productionLine', label: 'Production Line' },
  { key: 'eximLocation', label: 'EXIM Location' },
  { key: 'emptyPalletLocation', label: 'Empty Pallet Location' },
  { key: 'modelCodeProcess', label: 'Task Template' },
  { key: 'order', label: 'Order', width: '80px' },
]

// Keeps its own sort indicator so header arrows stay correct regardless of
// whether the parent resolves a column server-side or re-sorts client-side.
const activeSort = ref<{ key: ProductionLineAreaSortKey, order: ProductionLineAreaSortOrder }>({
  key: props.sortBy ?? 'name',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: ProductionLineAreaSortKey) {
  const order: ProductionLineAreaSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragEnter(index: number) {
  overIndex.value = index
}

function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) {
    onDragEnd()
    return
  }
  const reordered = [...props.items]
  const [moved] = reordered.splice(dragIndex.value, 1)
  reordered.splice(targetIndex, 0, moved!)
  onDragEnd()
  emit('reorder', reordered)
}
</script>

<template>
  <UiBaseCard padding="none">
    <p v-if="canReorder"
      class="font-medium border-b border-[#E2E8F0] px-4 py-2 text-xs text-slate-400"
    >
      Drag <GripVertical class="inline h-3 w-3" /> to reorder rows
    </p>
    <UiBaseTable :columns="columns" :loading="loading">
      <template #header>
        <th v-if="canReorder" style="width: 36px" class="px-4 py-3" />
        <th
          v-for="col in sortableColumns"
          :key="col.key"
          :style="col.width ? `width: ${col.width}` : ''"
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as ProductionLineAreaSortKey)"
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
          No production line areas found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="(item, index) in items"
          :key="item.id"
          :draggable="canReorder"
          class="border-b border-[#E2E8F0] last:border-0"
          :class="{ 'opacity-40': dragIndex === index, 'bg-[#01ADEF]/5': overIndex === index }"
          @dragstart="onDragStart(index)"
          @dragenter.prevent="onDragEnter(index)"
          @dragover.prevent
          @drop="onDrop(index)"
          @dragend="onDragEnd"
        >
          <td v-if="canReorder" class="px-4 py-3 cursor-grab text-slate-400 active:cursor-grabbing">
            <GripVertical class="h-4 w-4" />
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.type === 'PRODUCTION' ? 'Production' : 'Stock' }}
          </td>
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.iRaypleLocationCode }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.productionLine.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.eximLocation.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.emptyPalletLocation.name }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.modelCodeProcess?.name ?? '—' }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.order }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('production-line-area.update')"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] hover:bg-slate-200 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('production-line-area.delete')"
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
