<script setup lang="ts">
import type { RobotUnit } from '~/composables/useRobotFleet'

defineProps<{
  robots: RobotUnit[]
  selectedId: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const STATUS_DOT: Record<RobotUnit['status'], string> = {
  'en-route': 'bg-[#01ADEF]',
  charging: 'bg-amber-400',
  idle: 'bg-slate-400',
  error: 'bg-red-500',
}
</script>

<template>
  <UiBaseCard padding="none">
    <div class="border-b border-[#E2E8F0] px-4 py-3 dark:border-[#1E293B]">
      <p class="text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">Fleet Units</p>
    </div>
    <div class="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
      <button
        v-for="robot in robots"
        :key="robot.id"
        type="button"
        class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors"
        :class="
          robot.id === selectedId
            ? 'bg-[#01ADEF]/10 text-[#01ADEF]'
            : 'text-[#0F1F52] hover:bg-slate-50 dark:text-[#F8FAFC] dark:hover:bg-slate-800/60'
        "
        @click="emit('select', robot.id)"
      >
        <span class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" :class="STATUS_DOT[robot.status]" />
          {{ robot.name }}
        </span>
        <span class="font-mono text-xs opacity-70">{{ robot.battery }}%</span>
      </button>
    </div>
  </UiBaseCard>
</template>
