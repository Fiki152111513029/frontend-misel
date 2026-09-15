<script setup lang="ts">
import type { RobotAlarmDetailData } from '~/types/robot-alarm'

interface Props {
  modelValue: boolean
  retrying?: boolean
  deviceLabel?: string
  detail: RobotAlarmDetailData | null
  fetchedAt?: string | null
}

withDefaults(defineProps<Props>(), {
  retrying: false,
  deviceLabel: '',
  fetchedAt: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  retry: []
}>()

const FIELDS: { key: keyof RobotAlarmDetailData, label: string }[] = [
  { key: 'alarmMsg', label: 'Alarm Message' },
  { key: 'advice', label: 'Advice' },
  { key: 'remark', label: 'Remark' },
  { key: 'taskId', label: 'Task ID' },
  { key: 'taskTypeName', label: 'Task Type' },
  { key: 'taskTemplateName', label: 'Task Template' },
  { key: 'outOrderId', label: 'Out Order ID' },
  { key: 'startPositionName', label: 'Start Position Name' },
  { key: 'startPosition', label: 'Start Position' },
  { key: 'targetPositionName', label: 'Target Position Name' },
  { key: 'targetPosition', label: 'Target Position' },
  { key: 'shelfNumber', label: 'Shelf Number' },
  { key: 'alarmFlag', label: 'Alarm Flag' },
  { key: 'state', label: 'State' },
]

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function formatFetchedAt(value: string | null | undefined) {
  if (!value) return null
  return new Date(value).toLocaleString()
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="deviceLabel ? `Alarm Detail — ${deviceLabel}` : 'Alarm Detail'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="!detail" class="py-10 text-center">
      <p class="text-sm font-medium text-slate-500">
        No detail available yet for this alarm.
      </p>
      <p class="mt-1 text-xs text-slate-400">
        The backend fetches this automatically when the alarm is received — it may not have
        succeeded yet, or the third-party lookup wasn't reachable at the time.
      </p>
      <UiBaseButton
        variant="secondary"
        class="mt-4"
        :loading="retrying"
        @click="emit('retry')"
      >
        Retry Now
      </UiBaseButton>
    </div>

    <div v-else class="space-y-5">
      <p v-if="formatFetchedAt(fetchedAt)" class="text-xs font-medium text-slate-400">
        Fetched {{ formatFetchedAt(fetchedAt) }}
      </p>

      <div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <div v-for="field in FIELDS" :key="field.key">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ field.label }}</p>
          <p class="mt-0.5 break-words text-sm font-medium text-[#0F1F52]">
            {{ displayValue(detail[field.key]) }}
          </p>
        </div>
      </div>

      <div v-if="detail.materiel.length > 0">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Materiel</p>
        <div class="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-2">Materiel Num</th>
                <th class="px-4 py-2">Materiel Name</th>
                <th class="px-4 py-2">Materiel Account</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="(item, index) in detail.materiel" :key="index">
                <td class="px-4 py-2 text-slate-600">{{ displayValue(item.materielNum) }}</td>
                <td class="px-4 py-2 text-slate-600">{{ displayValue(item.materielName) }}</td>
                <td class="px-4 py-2 text-slate-600">{{ displayValue(item.materielAccount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <UiBaseButton
        v-if="detail"
        variant="ghost"
        :loading="retrying"
        @click="emit('retry')"
      >
        Refresh
      </UiBaseButton>
      <UiBaseButton variant="secondary" @click="emit('update:modelValue', false)">Close</UiBaseButton>
    </template>
  </UiBaseModal>
</template>
