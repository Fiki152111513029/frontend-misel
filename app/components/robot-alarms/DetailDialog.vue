<script setup lang="ts">
import type { RobotAlarmDetailResponse } from '~/types/robot-alarm'

interface Props {
  modelValue: boolean
  loading?: boolean
  deviceLabel?: string
  detail: RobotAlarmDetailResponse | null
}

withDefaults(defineProps<Props>(), {
  loading: false,
  deviceLabel: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const FIELDS: { key: keyof NonNullable<Props['detail']>['data'], label: string }[] = [
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
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="deviceLabel ? `Alarm Detail — ${deviceLabel}` : 'Alarm Detail'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="loading" class="flex items-center justify-center py-16">
      <svg class="h-6 w-6 animate-spin text-[#01ADEF]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else-if="!detail" class="py-12 text-center">
      <p class="text-sm font-medium text-slate-500">No detail available.</p>
    </div>

    <div v-else class="space-y-5">
      <div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <div v-for="field in FIELDS" :key="field.key">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ field.label }}</p>
          <p class="mt-0.5 break-words text-sm font-medium text-[#0F1F52]">
            {{ displayValue(detail.data[field.key]) }}
          </p>
        </div>
      </div>

      <div v-if="detail.data.materiel.length > 0">
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
              <tr v-for="(item, index) in detail.data.materiel" :key="index">
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
      <UiBaseButton variant="secondary" @click="emit('update:modelValue', false)">Close</UiBaseButton>
    </template>
  </UiBaseModal>
</template>
