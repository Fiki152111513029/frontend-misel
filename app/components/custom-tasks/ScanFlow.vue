<script setup lang="ts">
import { Ban, Camera, Clock, List, QrCode, Route as RouteIcon } from 'lucide-vue-next'
import { fetchMyControlTasks } from '~/services/custom-task.service'
import { taskStatusLabel } from '~/utils/taskStatus'
import type { CustomTaskPreview, MyControlTask } from '~/types/custom-task'

// The same shape as the Trolley Task scan flow, minus the Take/Drop choice:
// a Custom Task has nothing to pick, so it opens straight on the scanner.
// Two steps only — scan the code on a Control Task QR label, confirm the
// task order it resolves to, submit. The lookup is read-only; submit is the
// single call that reaches RCS (/ics/taskOrder/addTask), and nothing is
// written to our own tables either way.
const toast = useToast()
const { lookupCustomTask, releaseCustomTask, cancelReleasedTask } = useCustomTasks()
const { hasPermission } = useAuth()
const queue = useCustomTaskQueueStore()

// The Current Queue cards follow the RCS task-status webhook rather than a
// timer of their own — see useRealtime.
useRealtime(['tasks', 'custom-tasks'], () => queue.refreshAll())

// Two ways in, one way out. Both 'scan' and 'pick' resolve a Control Task
// code and land on the same 'ready' screen, so the confirm-and-send step
// cannot drift between them.
type Step = 'menu' | 'scan' | 'pick' | 'ready'

const step = ref<Step>('menu')
const myTasks = ref<MyControlTask[]>([])
const loadingTasks = ref(false)

/**
 * The picker, split into the headings an admin set on each Control Task.
 *
 * Grouped here rather than flattened with a label on every row: the whole
 * point is that WRL23L and WRL23R are different stations, and a mixed list
 * invites dispatching the right task at the wrong one.
 *
 * The server already orders by group then name, so walking the list once
 * and starting a section whenever the group changes keeps that order —
 * including nulls last, which is what puts "Other" at the bottom.
 */
const DEFAULT_TASK_COLOR = '#01ADEF'

/**
 * Only a #RRGGBB value is let through.
 *
 * It is interpolated into a style attribute, and the field is free text on
 * the admin side — the server validates it too, but a row stored before
 * that validation existed must not be able to inject anything here.
 */
function taskColor(task: MyControlTask): string {
  const value = task.colorCode?.trim() ?? ''
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_TASK_COLOR
}

const groupedTasks = computed(() => {
  const groups: { name: string, tasks: MyControlTask[] }[] = []
  for (const task of myTasks.value) {
    const name = task.groupName?.trim() || 'Other'
    const last = groups[groups.length - 1]
    if (last && last.name === name) last.tasks.push(task)
    else groups.push({ name, tasks: [task] })
  }
  return groups
})
const scanValue = ref('')
const SCAN_INPUT_ID = 'custom-task-scan-input'
const submitting = ref(false)
const showScanner = ref(false)

const preview = ref<CustomTaskPreview | null>(null)

const SUBTITLES: Record<Step, string> = {
  menu: 'Choose how to start the task',
  scan: 'Scan a Control Task to run it',
  pick: 'Pick one of the tasks registered to you',
  ready: 'Check the details, then send the task',
}
const subtitle = computed(() => SUBTITLES[step.value])

function focusScanInput() {
  nextTick(() => {
    document.getElementById(SCAN_INPUT_ID)?.focus()
  })
}

function resetFlow() {
  step.value = 'menu'
  preview.value = null
  scanValue.value = ''
}

function startScan() {
  step.value = 'scan'
  focusScanInput()
}

async function startPick() {
  step.value = 'pick'
  loadingTasks.value = true
  try {
    myTasks.value = await fetchMyControlTasks()
  } catch {
    myTasks.value = []
  }
  loadingTasks.value = false
}

/**
 * Picking resolves through the same lookup the scanner uses, rather than
 * trusting the list it came from — the preview the operator confirms is
 * then guaranteed to be what the server would actually send.
 */
async function pickTask(task: MyControlTask) {
  const result = await lookupCustomTask(task.code)
  if (!result) return
  preview.value = result
  step.value = 'ready'
}

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

// Only one cancel at a time, so a double tap cannot fire two requests at
// the same card.
const cancellingOrderId = ref<string | null>(null)

async function cancelQueued(item: { orderId: string, runId: string | null }) {
  if (!item.runId || cancellingOrderId.value) return
  cancellingOrderId.value = item.orderId
  const ok = await cancelReleasedTask(item.runId)
  cancellingOrderId.value = null
  if (ok) queue.removeTask(item.orderId)
}

async function handleSubmit() {
  if (!preview.value) return
  submitting.value = true
  const released = await releaseCustomTask(preview.value.code)
  submitting.value = false
  if (!released) return

  // Held rather than sent: the rack was empty, so the server parked it and
  // will dispatch it itself once the rack is filled. Deliberately not an
  // error — the operator does not need to come back and retry.
  if (released.queued) {
    toast.info(
      `Rak belum ready — ${released.code} ditampung dulu, otomatis jalan begitu rak ${released.waitingForCode} terisi`,
    )
  } else {
    toast.success(`Custom task ${released.code} submitted`)
  }

  queue.addTask({
    orderId: released.orderId,
    runId: released.runId,
    code: released.code,
    name: released.name,
    taskPath: released.taskPath,
    waitingForCode: released.waitingForCode,
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
        Task: {{ preview.code }} · Change
      </button>
    </div>

    <!-- Entry choice. Both routes end on the same confirm screen. -->
    <UiBaseCard v-if="step === 'menu'" class="space-y-3">
      <button
        type="button"
        class="flex w-full items-center gap-4 rounded-2xl border border-[#E2E8F0] px-5 py-4 text-left transition-colors hover:border-[#01ADEF] hover:bg-[#01ADEF]/5"
        @click="startScan"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#01ADEF]/10 text-[#01ADEF]">
          <QrCode class="h-5 w-5" />
        </span>
        <span>
          <span class="block font-semibold text-[#0F1F52]">Scan QR</span>
          <span class="block text-xs text-slate-500">Scan the Control Task label</span>
        </span>
      </button>

      <button
        type="button"
        class="flex w-full items-center gap-4 rounded-2xl border border-[#E2E8F0] px-5 py-4 text-left transition-colors hover:border-[#01ADEF] hover:bg-[#01ADEF]/5"
        @click="startPick"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#01ADEF]/10 text-[#01ADEF]">
          <List class="h-5 w-5" />
        </span>
        <span>
          <span class="block font-semibold text-[#0F1F52]">Pilih Task</span>
          <span class="block text-xs text-slate-500">Choose from the tasks registered to you</span>
        </span>
      </button>
    </UiBaseCard>

    <!-- Picker — only the tasks this operator was registered to. -->
    <UiBaseCard v-else-if="step === 'pick'" class="space-y-3">
      <p v-if="loadingTasks" class="py-6 text-center text-sm text-slate-400">
        Loading…
      </p>
      <p
        v-else-if="myTasks.length === 0"
        class="rounded-xl border border-dashed border-[#E2E8F0] py-8 text-center text-sm text-slate-400"
      >
        No Control Task is registered to your account yet.<br>
        Ask an administrator to assign one, or scan its QR label instead.
      </p>
      <div v-for="group in groupedTasks" v-else :key="group.name" class="space-y-2">
        <p class="sticky top-0 bg-white pt-1 text-xs font-bold uppercase tracking-wide text-[#01ADEF]">
          {{ group.name }}
        </p>
        <!-- The code chip sits above the name rather than beside it: on a
             phone a row layout leaves the name only a sliver of width, and
             the name is the one thing the operator picks by. Nothing is
             truncated — a long name wraps onto as many lines as it needs. -->
        <!-- The task's own colour is carried by a left bar and the code
             chip, not by flooding the whole button: the name has to stay
             readable whatever colour an admin picks, and white-on-yellow
             or black-on-navy would not be. -->
        <button
          v-for="task in group.tasks"
          :key="task.id"
          type="button"
          class="flex w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-[#E2E8F0] border-l-[6px] px-4 py-3 text-left transition-colors hover:bg-slate-50"
          :style="{ borderLeftColor: taskColor(task) }"
          @click="pickTask(task)"
        >
          <span class="flex items-start gap-2">
            <span
              class="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
              :style="{ backgroundColor: taskColor(task) }"
            >
              {{ task.code }}
            </span>
            <span class="min-w-0 flex-1 break-words font-semibold leading-snug text-[#0F1F52]">
              {{ task.name }}
            </span>
          </span>
          <span class="break-all font-mono text-xs leading-snug text-slate-500">
            {{ task.route.join(' → ') }}
          </span>
        </button>
      </div>

      <button
        type="button"
        class="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200"
        @click="resetFlow"
      >
        Back
      </button>
    </UiBaseCard>

    <!-- Scan step — a real form element so Enter submits natively, which is
         what the Enter terminator on a handheld scanner sends. -->
    <UiBaseCard v-else-if="step === 'scan'">
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
      <UiBaseInput :model-value="preview.code" label="Code" disabled />
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
      class="flex items-center gap-4 rounded-2xl border px-5 py-4"
      :class="item.waitingForCode
        ? 'border-amber-300/60 bg-gradient-to-r from-amber-100/70 to-transparent'
        : 'border-[#01ADEF]/20 bg-gradient-to-r from-[#01ADEF]/10 to-transparent'"
    >
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        :class="item.waitingForCode
          ? 'bg-gradient-to-br from-amber-400 to-amber-600'
          : 'bg-gradient-to-br from-blue-400 to-blue-600'"
      >
        <Clock v-if="item.waitingForCode" class="h-5 w-5" />
        <RouteIcon v-else class="h-5 w-5" />
      </div>
      <div class="flex-1 space-y-1 text-sm">
        <p
          class="font-semibold uppercase tracking-wide"
          :class="item.waitingForCode ? 'text-amber-600' : 'text-[#01ADEF]'"
        >
          {{ item.waitingForCode ? 'Menunggu Rak' : 'Current Queue' }}
        </p>
        <p class="font-medium text-slate-500">
          Task :
          <span class="font-medium text-[#0F1F52]">{{ item.name }} ({{ item.code }})</span>
        </p>
        <p class="font-medium text-slate-500">
          Order ID :
          <span class="font-medium text-[#0F1F52]">{{ item.orderId }}</span>
        </p>
        <p class="break-all font-medium text-slate-500">
          Task Path :
          <span class="font-mono text-xs font-medium text-[#0F1F52]">{{ item.taskPath }}</span>
        </p>
        <template v-if="item.waitingForCode">
          <p class="font-medium text-slate-500">
            Status :
            <span class="font-semibold text-amber-600">
              Rak {{ item.waitingForCode }} belum ready
            </span>
          </p>
          <p class="font-medium text-amber-700">
            Task otomatis jalan begitu rak terisi — tidak perlu kirim ulang.
          </p>
        </template>
        <template v-else>
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
        </template>

        <!-- Cancelling here saves walking over to All Tasks > Task Custom
             to undo a task that was only just sent by mistake. Hidden when
             the history row could not be saved, since there is nothing to
             cancel through in that case. -->
        <button
          v-if="item.runId && hasPermission('custom-task.update')"
          type="button"
          :disabled="cancellingOrderId !== null"
          class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          @click="cancelQueued(item)"
        >
          <Ban class="h-3.5 w-3.5" />
          {{ cancellingOrderId === item.orderId ? 'Cancelling…' : 'Cancel Task' }}
        </button>
      </div>
    </div>
  </div>
</template>
