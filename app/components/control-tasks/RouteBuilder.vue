<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-vue-next'
import type { RouteOption } from '~/types/control-task'

// Builds the ordered list of iRayple Location Codes that becomes taskPath.
// Two things make this more than a multi-select: order is meaningful, and the
// same code may appear more than once (a route can come back to where it
// started, e.g. L3CPA,FGA,EPA,L3CPA). So legs are appended one at a time and
// reordered by hand, with no cap on how many there are.
interface Props {
  modelValue: string[]
  production: RouteOption[]
  warehouse: RouteOption[]
  error?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const pending = ref('')

const labelByCode = computed(() => {
  const map = new Map<string, RouteOption>()
  for (const option of [...props.production, ...props.warehouse]) {
    map.set(option.iRaypleLocationCode, option)
  }
  return map
})

function labelFor(code: string) {
  return labelByCode.value.get(code)?.name ?? null
}

function sourceFor(code: string) {
  return labelByCode.value.get(code)?.source ?? null
}

function addLeg() {
  if (!pending.value) return
  emit('update:modelValue', [...props.modelValue, pending.value])
  pending.value = ''
}

function removeLeg(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function moveLeg(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= props.modelValue.length) return
  const next = [...props.modelValue]
  const [leg] = next.splice(index, 1)
  next.splice(target, 0, leg as string)
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', [])
}

const taskPath = computed(() => props.modelValue.join(','))

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-slate-700">
        Route
        <span class="ml-0.5 text-[#01ADEF]">*</span>
      </label>
      <button
        v-if="modelValue.length > 0"
        type="button"
        class="text-xs font-medium text-slate-400 hover:text-slate-600"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>

    <div class="flex items-start gap-2">
      <select v-model="pending" :class="selectClass">
        <option value="">Select a location to add…</option>
        <optgroup v-if="production.length" label="Production Location">
          <option
            v-for="option in production"
            :key="`p-${option.iRaypleLocationCode}`"
            :value="option.iRaypleLocationCode"
          >
            {{ option.name }} ({{ option.iRaypleLocationCode }})
          </option>
        </optgroup>
        <optgroup v-if="warehouse.length" label="Warehouse Location">
          <option
            v-for="option in warehouse"
            :key="`w-${option.iRaypleLocationCode}`"
            :value="option.iRaypleLocationCode"
          >
            {{ option.name }} ({{ option.iRaypleLocationCode }})
          </option>
        </optgroup>
      </select>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0F1F52] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1B2F6E] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!pending"
        @click="addLeg"
      >
        <Plus class="h-4 w-4" />
        Add
      </button>
    </div>

    <p class="font-medium text-xs text-slate-400">
      Add as many stops as you need, in the order the AMR should visit them. The
      same location may be used more than once.
    </p>

    <ol v-if="modelValue.length > 0" class="space-y-1.5 pt-1">
      <li
        v-for="(code, index) in modelValue"
        :key="`${code}-${index}`"
        class="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50/60 px-3 py-2"
      >
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F1F52] text-xs font-bold text-white">
          {{ index + 1 }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-mono font-semibold text-[#0F1F52]">{{ code }}</p>
          <p v-if="labelFor(code)" class="truncate text-xs font-medium text-slate-400">
            {{ labelFor(code) }} · {{ sourceFor(code) === 'PRODUCTION' ? 'Production' : 'Warehouse' }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-30"
          aria-label="Move up"
          :disabled="index === 0"
          @click="moveLeg(index, -1)"
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded-lg bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-30"
          aria-label="Move down"
          :disabled="index === modelValue.length - 1"
          @click="moveLeg(index, 1)"
        >
          <ArrowDown class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded-lg bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100"
          aria-label="Remove"
          @click="removeLeg(index)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </li>
    </ol>

    <div v-if="modelValue.length > 0" class="rounded-xl bg-slate-900 px-3 py-2">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Task Path</p>
      <p class="break-all font-mono text-xs text-emerald-300">{{ taskPath }}</p>
    </div>

    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
