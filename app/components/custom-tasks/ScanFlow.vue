<script setup lang="ts">
import { Camera, Route as RouteIcon } from 'lucide-vue-next'
import { taskStatusLabel } from '~/utils/taskStatus'
import type { CustomTaskPreview } from '~/types/custom-task'

// The same shape as the Trolley Task scan flow, minus the Take/Drop choice:
// a Custom Task has nothing to pick, so it opens straight on the scanner.
// Two steps only — scan the abjad on a Control Task QR label, confirm the
// task order it resolves to, submit. The lookup is read-only; submit is the
// single call that reaches RCS (/ics/taskOrder/addTask), and nothing is
// written to our own tables either way.
const toast = useToast()
const { lookupCustomTask, releaseCustomTask } = useCustomTasks()
const queue = useCustomTaskQueueStore()

type Step = 'scan' | 'ready'

const step = ref<Step>('scan')
const scanValue = ref('')
const SCAN_INPUT_ID = 'custom-task-scan-input'
const submitting = ref(false)
const showScanner = ref(false)

const preview = ref<CustomTaskPreview | null>(null)

const subtitle = computed(() =>
  step.value === 'scan'
    ? 'Scan a Control Task to run it'
    : 'Check the details, then send the task',
)

function focusScanInput() {
  nextTick(() => {
    document.getElementById(SCAN_INPUT_ID)?.focus()
  })
}

function resetFlow() {
  step.value = 'scan'
  preview.value = null
  scanValue.value = ''
}

onMounted(focusScanInput)

async function handleScanSubmit() {
  const value = scanValue.value.trim()
  if (!value) return

  const result = await lookupCustomTask(value)
  if (!result) return

  preview.value = result
  step.value = 'ready'
  scanValue.value = ''
}

async function handleCameraScanned(value: string) {
  scanValue.value = value
  await handleScanSubmit()
}

function changeTask() {
  resetFlow()
  focusScanInput()
}

async function handleSubmit() {
  if (!preview.value) return
  submitting.value = true
  const released = await releaseCustomTask(preview.value.abjad)
  submitting.value = false
  if (!released) return

  toast.success(`Custom task ${released.abjad} submitted`)

  queue.addTask({
    orderId: released.orderId,
    abjad: released.abjad,
    name: released.name,
    taskPath: released.taskPath,
  })

  // Free the scanner right away — like the Trolley Task pages, several
  // Custom Tasks can be in flight at once, each card clearing on its own.
  changeTask()
}
</script>

<template>
  <div class="mx-auto w-full max-w-md space-y-4 px-4 py-6 sm:px-0">
    <div>
      <h1 class="text-xl font-extrabold text-[#0F1F52] sm:text-2xl">Custom Task</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        {{ subtitle }}
      </p>
    </div>

    <!-- Confirmed scan, re-scannable -->
    <div v-if="preview" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeTask"
      >
        Task: {{ preview.abjad }} · Change
      </button>
    </div>

    <!-- Scan step — a real form element so Enter submits natively, which is
         what the Enter terminator on a handheld scanner sends. -->
    <UiBaseCard v-if="step === 'scan'">
      <form class="space-y-3" @submit.prevent="handleScanSubmit">
        <span class="inline-flex items-center rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-[#0F1F52]">
          Custom Task
        </span>
        <UiBaseInput
          :id="SCAN_INPUT_ID"
          v-model="scanValue"
          label="Control Task Code"
          placeholder="Waiting for scan…"
        />
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#01ADEF]/40 bg-white px-6 py-3 text-sm font-semibold text-[#01ADEF] transition-all hover:bg-[#01ADEF]/5 active:scale-[0.99]"
          @click="showScanner = true"
        >
          <Camera class="h-4 w-4" />
          Scan with camera
        </button>
        <UiBaseButton type="submit" full-width variant="gradient">
          Confirm
        </UiBaseButton>
      </form>
    </UiBaseCard>

    <!-- Review + submit -->
    <UiBaseCard v-else-if="preview" class="space-y-4">
      <span class="inline-flex items-center rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-[#0F1F52]">
        Custom Task
      </span>
      <UiBaseInput :model-value="preview.abjad" label="Abjad" disabled />
      <UiBaseInput :model-value="preview.name" label="Name" disabled />
      <UiBaseInput :model-value="preview.modelProcessCode" label="Model Process Code" disabled />

      <div class="space-y-1.5">
        <p class="block text-sm font-medium text-slate-700">Route</p>
        <div class="flex flex-wrap items-center gap-1 rounded-xl border border-[#E2E8F0] bg-slate-50/60 px-3 py-2.5">
          <template v-for="(code, index) in preview.route" :key="`${code}-${index}`">
            <span v-if="index > 0" class="text-xs text-slate-300">→</span>
            <span class="rounded-md bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-[#0F1F52]">
              {{ code }}
            </span>
          </template>
        </div>
      </div>

      <div class="rounded-xl bg-slate-900 px-3 py-2">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Task Path</p>
        <p class="break-all font-mono text-xs text-emerald-300">{{ preview.taskPath }}</p>
      </div>

      <UiBaseButton full-width variant="gradient" :loading="submitting" @click="handleSubmit">
        Send Task
      </UiBaseButton>
    </UiBaseCard>

    <UiQrScannerModal
      v-model="showScanner"
      title="Scan Control Task QR"
      hint="Point the camera at the Control Task QR label"
      @scanned="handleCameraScanned"
    />

    <!-- Current Queue — one card per released task still in flight, cleared
         a few seconds after its status goes terminal. -->
    <div
      v-for="item in queue.items"
      :key="item.orderId"
      class="flex items-center gap-4 rounded-2xl border border-[#01ADEF]/20 bg-gradient-to-r from-[#01ADEF]/10 to-transparent px-5 py-4"
    >
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
        <RouteIcon class="h-5 w-5" />
      </div>
      <div class="flex-1 space-y-1 text-sm">
        <p class="font-semibold uppercase tracking-wide text-[#01ADEF]">Current Queue</p>
        <p class="font-medium text-slate-500">
          Task :
          <span class="font-medium text-[#0F1F52]">{{ item.name }} ({{ item.abjad }})</span>
        </p>
        <p class="font-medium text-slate-500">
          Order ID :
          <span class="font-medium text-[#0F1F52]">{{ item.orderId }}</span>
        </p>
        <p class="break-all font-medium text-slate-500">
          Task Path :
          <span class="font-mono text-xs font-medium text-[#0F1F52]">{{ item.taskPath }}</span>
        </p>
        <p class="font-medium text-slate-500">
          Status :
          <span class="font-semibold text-[#01ADEF]">
            {{ item.webhookStatus?.status ? taskStatusLabel(item.webhookStatus.status) : '-' }}
          </span>
        </p>
        <p class="font-medium text-slate-500">
          subTaskSeq :
          <span class="font-medium text-[#0F1F52]">
            {{ item.webhookStatus?.subTaskSeq ?? '-' }}
            <template v-if="item.webhookStatus?.statusComment"> — {{ item.webhookStatus.statusComment }}</template>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>
