<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import { spansTwoRegisters } from '~/types/plc'
import type { PlcTag } from '~/types/plc'

interface Props {
  items: PlcTag[]
  loading: boolean
  canUpdate: boolean
  canDelete: boolean
  /** Hidden when the list is already filtered to one device. */
  showDevice: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [tag: PlcTag]
  delete: [tag: PlcTag]
}>()

const columns = [
  { key: 'name', label: 'Tag' },
  { key: 'device', label: 'Device' },
  { key: 'address', label: 'Address', width: '170px' },
  { key: 'type', label: 'Type', width: '150px' },
  { key: 'scale', label: 'Scale', width: '110px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'actions', label: 'Actions', width: '110px' },
]

/** "holding register 100" reads better than "HOLDING_REGISTER". */
function registerLabel(tag: PlcTag) {
  return tag.registerType.replace('_', ' ').toLowerCase()
}
</script>

<template>
  <UiBaseCard padding="none">
    <UiBaseTable :columns="showDevice ? columns : columns.filter(c => c.key !== 'device')" :loading="loading">
      <tr v-if="!loading && items.length === 0">
        <td :colspan="columns.length" class="py-12 text-center text-slate-400">
          No tags yet
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

          <td v-if="showDevice" class="px-4 py-3 text-sm text-[#0F1F52]">
            {{ item.device?.name ?? '—' }}
          </td>

          <td class="px-4 py-3">
            <p class="font-mono text-sm text-[#0F1F52]">{{ item.address }}</p>
            <p class="text-xs text-slate-400">{{ registerLabel(item) }}</p>
          </td>

          <td class="px-4 py-3">
            <p class="text-sm text-[#0F1F52]">{{ item.dataType }}</p>
            <!-- Only shown where it has an effect: word order is
                 meaningless for a value that fits in one register. -->
            <p v-if="spansTwoRegisters(item.dataType)" class="text-xs text-slate-400">
              {{ item.wordOrder === 'BIG' ? 'high word first' : 'word-swapped' }}
            </p>
          </td>

          <td class="px-4 py-3 text-sm text-[#0F1F52]">
            ×{{ item.scale }}
            <span v-if="item.unit" class="text-xs text-slate-400">{{ item.unit }}</span>
          </td>

          <td class="px-4 py-3">
            <div class="flex flex-col gap-1">
              <span
                class="w-fit rounded-full px-2 py-0.5 text-xs font-medium"
                :class="item.isActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-500'"
              >
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </span>
              <span
                v-if="!item.logEnabled"
                class="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                title="Changes are not written to the history"
              >
                No history
              </span>
            </div>
          </td>

          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
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
