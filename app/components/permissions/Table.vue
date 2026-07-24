<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { Permission } from '~/types/permission'

export type PermissionSortKey = 'code' | 'name' | 'description'
export type PermissionSortOrder = 'asc' | 'desc'

interface Props {
  items: Permission[]
  loading: boolean
  sortBy?: PermissionSortKey
  sortOrder?: PermissionSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [permission: Permission]
  delete: [permission: Permission]
  sort: [patch: { sortBy: PermissionSortKey, sortOrder: PermissionSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: PermissionSortKey, order: PermissionSortOrder }>({
  key: props.sortBy ?? 'code',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: PermissionSortKey) {
  const order: PermissionSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
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
            @click="toggleSort(col.key as PermissionSortKey)"
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
          No permissions found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-mono font-medium text-[#0F1F52]">
            {{ item.code }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">{{ item.name }}</td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52]">
            {{ item.description || '—' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('permission.update')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('permission.delete')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
