<script setup lang="ts">
import { Pencil, PlugZap, Tags, Trash2, Wifi, WifiOff } from 'lucide-vue-next'
import type { PlcDevice } from '~/types/plc'

interface Props {
  items: PlcDevice[]
  loading: boolean
  canUpdate: boolean
  canDelete: boolean
  /** Id of the device whose connection test is in flight. */
  testingId: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [device: PlcDevice]
  delete: [device: PlcDevice]
  test: [device: PlcDevice]
  tags: [device: PlcDevice]
}>()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address', width: '180px' },
  { key: 'poll', label: 'Poll', width: '90px' },
  { key: 'tags', label: 'Tags', width: '80px' },
  { key: 'status', label: 'Status', width: '150px' },
  { key: 'actions', label: 'Actions', width: '170px' },
]
</script>

<template>
  <UiBaseCard padding="none">
    <UiBaseTable :columns="columns" :loading="loading">
      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No PLC devices yet
        </td>
      </tr>

      <template v-if="!loading">
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-b border-[#E2E8F0] last:border-0"
        >
          <td class="px-4 py-3">
            <p class="text-sm font-medium text-[#0F1F52]">{{ item.name }}</p>
            <p v-if="item.description" class="text-xs text-slate-400">
              {{ item.description }}
            </p>
          </td>

          <td class="px-4 py-3 font-mono text-sm text-[#0F1F52]">
            {{ item.host }}:{{ item.port }}
            <span class="text-xs text-slate-400">· unit {{ item.unitId }}</span>
          </td>

          <td class="px-4 py-3 text-sm text-[#0F1F52]">{{ item.pollIntervalMs }} ms</td>

          <td class="px-4 py-3 text-sm text-[#0F1F52]">{{ item.tags.length }}</td>

          <td class="px-4 py-3">
            <!-- Inactive is said separately from offline: one is a choice,
                 the other is a fault, and they need different reactions. -->
            <span
              v-if="!item.isActive"
              class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
            >
              Inactive
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="item.connection.connected
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'"
              :title="item.connection.lastError ?? ''"
            >
              <component :is="item.connection.connected ? Wifi : WifiOff" class="h-3 w-3" />
              {{ item.connection.connected ? 'Connected' : 'Offline' }}
            </span>
          </td>

          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#0F1F52] transition-colors hover:bg-slate-200"
                aria-label="Tags"
                title="Tags"
                @click="emit('tags', item)"
              >
                <Tags class="h-4 w-4" />
              </button>
              <button
                v-if="canUpdate"
                type="button"
                :disabled="testingId !== null"
                class="rounded-lg bg-amber-50 p-1.5 text-amber-600 transition-colors hover:bg-amber-100 disabled:opacity-40"
                aria-label="Test connection"
                title="Test connection"
                @click="emit('test', item)"
              >
                <PlugZap class="h-4 w-4" :class="testingId === item.id ? 'animate-pulse' : ''" />
              </button>
              <button
                v-if="canUpdate"
                type="button"
                class="rounded-lg bg-slate-100 p-1.5 text-[#01ADEF] transition-colors hover:bg-slate-200"
                aria-label="Edit"
                @click="emit('edit', item)"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                v-if="canDelete"
                type="button"
                class="rounded-lg bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100"
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
