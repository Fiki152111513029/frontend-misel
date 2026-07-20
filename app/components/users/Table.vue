<script setup lang="ts">
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next'
import type { Role } from '~/types/role'
import type { User } from '~/types/user'

export type UserSortKey = 'username' | 'email' | 'fullName' | 'role' | 'priority' | 'isActive'
export type UserSortOrder = 'asc' | 'desc'

interface Props {
  items: User[]
  loading: boolean
  roles: Role[]
  sortBy?: UserSortKey
  sortOrder?: UserSortOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [user: User]
  delete: [user: User]
  sort: [patch: { sortBy: UserSortKey, sortOrder: UserSortOrder }]
}>()

const { hasPermission } = useAuth()

const columns = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'role', label: 'Role' },
  { key: 'priority', label: 'Priority', width: '90px' },
  { key: 'isActive', label: 'Active', width: '90px' },
  { key: 'actions', label: 'Actions', width: '120px' },
]

const sortableColumns = columns.filter(col => col.key !== 'actions')

const activeSort = ref<{ key: UserSortKey, order: UserSortOrder }>({
  key: props.sortBy ?? 'username',
  order: props.sortOrder ?? 'asc',
})

function toggleSort(key: UserSortKey) {
  const order: UserSortOrder = activeSort.value.key === key && activeSort.value.order === 'asc' ? 'desc' : 'asc'
  activeSort.value = { key, order }
  emit('sort', { sortBy: key, sortOrder: order })
}

function roleName(roleId: string) {
  return props.roles.find((r) => r.id === roleId)?.name ?? '—'
}

const PRIORITY_LABEL: Record<User['priority'], string> = {
  4: 'High',
  6: 'Medium',
  8: 'Low',
}

const PRIORITY_STYLE: Record<User['priority'], string> = {
  4: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
  6: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  8: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
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
            @click="toggleSort(col.key as UserSortKey)"
          >
            {{ col.label }}
            <ChevronUp v-if="activeSort.key === col.key && activeSort.order === 'asc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else-if="activeSort.key === col.key && activeSort.order === 'desc'" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5 opacity-30" />
          </button>
        </th>
        <th style="width: 120px" class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Actions
        </th>
      </template>

      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No users found
        </td>
      </tr>
      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0"
        >
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.username }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">{{ item.email }}</td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ item.fullName }}
          </td>
          <td class="px-4 py-3 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ roleName(item.roleId) }}
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="PRIORITY_STYLE[item.priority]"
            >
              {{ PRIORITY_LABEL[item.priority] }}
            </span>
          </td>
          <td class="px-4 py-3">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                item.isActive
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              "
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                v-if="hasPermission('user.update')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#01ADEF] dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="hasPermission('user.delete')"
                type="button"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/15 transition-colors"
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
