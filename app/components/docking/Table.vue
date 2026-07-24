<script setup lang="ts">
import { Bot, Check, ChevronDown, ChevronUp, Copy, Eye } from 'lucide-vue-next'
import type { Docking, DockingStatus } from '~/composables/useDockings'

export type DockingSortKey = 'noUrut' | 'taskId' | 'timeCreated' | 'boxType' | 'from' | 'to' | 'amrCode' | 'amrName' | 'status'
export type DockingSortOrder = 'asc' | 'desc'

interface Props {
  items: Docking[]
  loading: boolean
  sortBy?: DockingSortKey
  sortOrder?: DockingSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  view: [docking: Docking]
  sort: [patch: { sortBy: DockingSortKey, sortOrder: DockingSortOrder }]
}>()

const copiedId = ref<string | null>(null)

async function copyTaskId(id: string, taskId: string) {
  try {
    await navigator.clipboard.writeText(taskId)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id)
        copiedId.value = null
    }, 1500)
  }
  catch {}
}

function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const columns = [
  { key: 'noUrut', label: 'No Urut', width: '90px' },
  { key: 'taskId', label: 'Task ID' },
  { key: 'timeCreated', label: 'Time Created' },
  { key: 'boxType', label: 'Box Type' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'amrCode', label: 'AMR Code' },
  { key: 'amrName', label: 'AMR Name' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'actions', label: 'Action', width: '80px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: DockingSortKey, order: DockingSortOrder }>({
  key: props.sortBy ?? 'timeCreated',
  order: props.sortOrder ?? 'desc',
})

function toggleSort(key: DockingSortKey) {
  const order: DockingSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

const STATUS_STYLE: Record<DockingStatus, string> = {
  Pending: 'bg-slate-100 text-slate-500',
  'In Progress': 'bg-[#01ADEF]/10 text-[#01ADEF]',
  Completed: 'bg-emerald-50 text-emerald-600',
  Failed: 'bg-red-50 text-red-500',
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
          class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-[#01ADEF]"
            @click="toggleSort(col.key as DockingSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 80px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          Action
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No docking tasks found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {{ item.noUrut }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-bold text-[#0F1F52]">{{ item.taskId }}</span>
              <button
                type="button"
                class="text-slate-300 transition-colors hover:text-[#01ADEF]"
                aria-label="Copy Task ID"
                @click="copyTaskId(item.id, item.taskId)"
              >
                <Check v-if="copiedId === item.id" class="h-3.5 w-3.5 text-emerald-500" />
                <Copy v-else class="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            <p>{{ formatDate(item.timeCreated) }}</p>
            <p class="font-medium text-xs text-slate-400">{{ timeAgo(item.timeCreated) }}</p>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            <span class="inline-flex items-center gap-1.5">
              <span
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: item.boxType.colorCode }"
              />
              {{ item.boxType.name }}
            </span>
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.from }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.to }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.amrCode }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            <span class="inline-flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#01ADEF]/10 text-[#01ADEF]">
                <Bot class="h-3.5 w-3.5" />
              </span>
              {{ item.amrName }}
            </span>
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="STATUS_STYLE[item.status]"
            >
              {{ item.status }}
            </span>
          </td>
          <td class="px-4 py-3">
            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] transition-colors"
              aria-label="View"
              @click="emit('view', item)"
            >
              <Eye class="h-4 w-4" />
            </button>
          </td>
        </tr>
      </template>
    </UiBaseTable>
  </UiBaseCard>
</template>
