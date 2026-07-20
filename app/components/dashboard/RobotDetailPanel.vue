<script setup lang="ts">
import { Bot, Gauge, Package } from 'lucide-vue-next'
import type { RobotUnit } from '~/composables/useRobotFleet'

defineProps<{ robot: RobotUnit }>()

defineEmits<{
  pause: []
  charge: []
  override: []
}>()

const STATUS_LABEL: Record<RobotUnit['status'], string> = {
  'en-route': 'En Route',
  charging: 'Charging',
  idle: 'Idle',
  error: 'Error',
}

const STATUS_DOT: Record<RobotUnit['status'], string> = {
  'en-route': 'bg-[#01ADEF]',
  charging: 'bg-amber-400',
  idle: 'bg-slate-400',
  error: 'bg-red-500',
}

const SPEC_LABELS: Record<string, string> = {
  locomotion: 'Locomotion',
  sensorArray: 'Sensor Array',
  lastCalibration: 'Last Calibration',
  uptime: 'Uptime',
}
</script>

<template>
  <UiBaseCard padding="none" class="flex flex-col overflow-hidden">
    <div
      class="relative flex h-32 items-end bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#01ADEF]/40 px-4 py-3"
    >
      <span
        v-if="robot.isCritical"
        class="absolute left-3 top-3 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      >
        Critical Asset
      </span>
      <Bot class="absolute right-4 top-4 h-14 w-14 text-white/15" />
      <p class="relative text-lg font-bold text-white">{{ robot.name }}</p>
    </div>

    <div class="space-y-4 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Serial ID</p>
          <p class="font-mono text-sm text-[#0F1F52] dark:text-[#F8FAFC]">{{ robot.serialId }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
          <p class="flex items-center gap-1.5 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">
            <span class="h-2 w-2 rounded-full" :class="STATUS_DOT[robot.status]" />
            {{ STATUS_LABEL[robot.status] }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-[#E2E8F0] p-3 dark:border-[#1E293B]">
          <p class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Package class="h-3 w-3" /> Payload
          </p>
          <p class="mt-1 font-mono text-base font-bold text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ robot.payload }} <span class="text-xs font-normal text-slate-400">/ {{ robot.payloadCapacity }}kg</span>
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              class="h-full rounded-full bg-[#01ADEF]"
              :style="{ width: `${Math.min(100, (robot.payload / robot.payloadCapacity) * 100)}%` }"
            />
          </div>
        </div>

        <div class="rounded-xl border border-[#E2E8F0] p-3 dark:border-[#1E293B]">
          <p class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Gauge class="h-3 w-3" /> Battery
          </p>
          <p class="mt-1 font-mono text-base font-bold text-[#0F1F52] dark:text-[#F8FAFC]">
            {{ robot.battery }}%
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              class="h-full rounded-full"
              :class="robot.battery > 30 ? 'bg-emerald-500' : 'bg-red-500'"
              :style="{ width: `${robot.battery}%` }"
            />
          </div>
        </div>
      </div>

      <div v-if="robot.mission" class="rounded-xl border border-[#E2E8F0] p-3 dark:border-[#1E293B]">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current Mission</p>
        <p class="mt-1 text-sm font-semibold text-[#0F1F52] dark:text-[#F8FAFC]">{{ robot.mission.name }}</p>
        <p class="font-medium text-xs text-slate-500 dark:text-slate-400">{{ robot.mission.route }}</p>
        <div class="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <span>Progress</span>
          <span>{{ robot.mission.stepLabel }}</span>
        </div>
        <div class="mt-1 flex gap-1">
          <div
            v-for="step in robot.mission.totalSteps"
            :key="step"
            class="h-1.5 flex-1 rounded-full"
            :class="step <= robot.mission.currentStep ? 'bg-[#01ADEF]' : 'bg-slate-100 dark:bg-slate-800'"
          />
        </div>
      </div>
      <p v-else class="font-medium rounded-xl border border-dashed border-[#E2E8F0] p-3 text-center text-xs text-slate-400 dark:border-[#1E293B]">
        No active mission
      </p>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-[#01ADEF]">Technical Specifications</p>
        <dl class="mt-2 divide-y divide-[#E2E8F0] text-sm dark:divide-[#1E293B]">
          <div
            v-for="(value, key) in robot.specs"
            :key="key"
            class="flex items-center justify-between py-1.5"
          >
            <dt class="text-slate-500 dark:text-slate-400">{{ SPEC_LABELS[key] }}</dt>
            <dd class="font-mono text-[#0F1F52] dark:text-[#F8FAFC]">{{ value }}</dd>
          </div>
        </dl>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <UiBaseButton variant="secondary" @click="$emit('pause')">Pause Unit</UiBaseButton>
        <UiBaseButton variant="secondary" @click="$emit('charge')">Request Charge</UiBaseButton>
      </div>
      <button
        type="button"
        class="w-full rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 active:scale-[0.98]"
        @click="$emit('override')"
      >
        Force Manual Override
      </button>
    </div>
  </UiBaseCard>
</template>
