<script setup lang="ts">
import { Ban, ChevronDown, ChevronUp, Clock, Route as RouteIcon } from 'lucide-vue-next'
import { ApiError } from '~/types/api'
import { fetchMyControlTasks } from '~/services/custom-task.service'
import { raiseLineStatus } from '~/services/line-status.service'
import { taskStatusLabel } from '~/utils/taskStatus'
import {
  LINE_STATUS_KINDS,
  lineStatusButtonLabel,
  lineStatusColor,
} from '~/utils/lineStatus'
import type { CustomTaskPreview, MyControlTask } from '~/types/custom-task'
import type { LineStatusKind } from '~/types/line-status'

// Two steps: pick one of the tasks registered to you, confirm what it
// resolves to, send it.
//
// There is deliberately no QR path. Every Control Task an operator may run
// is already registered to them and shown as a button, so scanning was a
// second way to reach the same place — one that needed a working camera or
// a handheld, and that could reach a task the button list would not offer.
//
// The lookup is read-only; submit is the single call that reaches RCS
// (/ics/taskOrder/addTask).
const toast = useToast()
const { lookupCustomTask, releaseCustomTask, cancelReleasedTask } = useCustomTasks()
const { hasPermission } = useAuth()
const queue = useCustomTaskQueueStore()

// The Current Queue cards follow the RCS task-status webhook rather than a
// timer of their own — see useRealtime.
useRealtime(['tasks', 'custom-tasks'], () => queue.refreshAll())

type Step = 'pick' | 'ready'

const step = ref<Step>('pick')
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
const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

/**
 * Only a #RRGGBB value is let through.
 *
 * It is interpolated into a style attribute, and the field is free text on
 * the admin side — the server validates it too, but a row stored before
 * that validation existed must not be able to inject anything here.
 */
function safeColor(value: string | null | undefined): string | null {
  const hex = value?.trim() ?? ''
  return HEX_PATTERN.test(hex) ? hex : null
}

function taskColor(task: MyControlTask): string {
  return safeColor(task.colorCode) ?? DEFAULT_TASK_COLOR
}

/**
 * Black or white text, whichever stays readable on `hex`.
 *
 * The heading is filled with a colour an admin picked freely, so a fixed
 * text colour would be unreadable half the time — white on yellow, black
 * on navy. Weighted the way the eye responds rather than by a plain
 * average, which would call yellow and blue equally bright.
 */
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0F1F52' : '#FFFFFF'
}

interface TaskGroup {
  /** What the heading reads. Ungrouped tasks collect under "Other". */
  name: string
  /**
   * The group as the server knows it, or null for the "Other" bucket.
   * The line-status buttons key off this: "Other" is not a line, so a
   * stray task with the flag on must not be able to announce for it.
   */
  rawName: string | null
  color: string
  /** Any member switching the four line buttons on turns them on here. */
  lineStatus: boolean
  tasks: MyControlTask[]
}

const groupedTasks = computed(() => {
  const groups: TaskGroup[] = []
  for (const task of myTasks.value) {
    const rawName = task.groupName?.trim() || null
    const name = rawName || 'Other'
    const last = groups[groups.length - 1]
    if (last && last.name === name) {
      last.tasks.push(task)
      last.lineStatus = last.lineStatus || task.lineStatusEnabled
      // First one wins: the colour is stored on every task in the group
      // (there is no group row to hang it off), so a later member leaving
      // it blank must not blank out a heading already coloured.
      last.color = last.color === DEFAULT_TASK_COLOR
        ? safeColor(task.groupColor) ?? DEFAULT_TASK_COLOR
        : last.color
    } else {
      groups.push({
        name,
        rawName,
        color: safeColor(task.groupColor) ?? DEFAULT_TASK_COLOR,
        lineStatus: task.lineStatusEnabled,
        tasks: [task],
      })
    }
  }
  return groups
})

/**
 * Headings the operator has opened or shut by hand, by group name.
 *
 * Only the first group is open to begin with: the groups are stations, an
 * operator works at one of them, and three open lids is a scroll past two
 * stations' worth of buttons to reach the third. An absent entry means
 * "never touched", which is why this is open/closed rather than a set of
 * folded names — the default has to be able to differ per group.
 */
const groupOpen = ref<Record<string, boolean>>({})

function isGroupOpen(name: string, index: number): boolean {
  return groupOpen.value[name] ?? index === 0
}

function toggleGroup(name: string, index: number) {
  groupOpen.value = {
    ...groupOpen.value,
    [name]: !isGroupOpen(name, index),
  }
}
const submitting = ref(false)

const preview = ref<CustomTaskPreview | null>(null)

const SUBTITLES: Record<Step, string> = {
  pick: 'Pick one of the tasks registered to you',
  ready: 'Check the details, then send the task',
}
const subtitle = computed(() => SUBTITLES[step.value])

function resetFlow() {
  step.value = 'pick'
  preview.value = null
}

async function loadMyTasks() {
  // Reopened fresh each time, so a group folded shut on the last task does
  // not hide the one being looked for now.
  groupOpen.value = {}
  loadingTasks.value = true
  try {
    myTasks.value = await fetchMyControlTasks()
  } catch {
    myTasks.value = []
  }
  loadingTasks.value = false
}

// The picker is the landing screen now, so its list has to be there before
// the operator looks at it rather than after a tap.
onMounted(loadMyTasks)

/**
 * Picking resolves through a fresh lookup rather than trusting the list it
 * came from — the preview the operator confirms is then guaranteed to be
 * what the server would actually send.
 */
async function pickTask(task: MyControlTask) {
  const result = await lookupCustomTask(task.code)
  if (!result) return
  preview.value = result
  step.value = 'ready'
}

function changeTask() {
  resetFlow()
}

/**
 * One of the four buttons at the foot of a registered group.
 *
 * No confirm step, unlike dispatching a task: this announces a fact on a
 * board, and the fix for a mis-press is pressing the right one a second
 * later. A task gets a confirm screen because it sends an AMR somewhere.
 *
 * Only one in flight at a time so a double tap cannot race two presses
 * into the same row — the server takes the last writer, and losing that
 * race would leave the board saying the opposite of the last button hit.
 */
const pendingLineStatus = ref<string | null>(null)

async function pressLineStatus(
  // Nullable because the caller is a v-for row whose group may be the
  // "Other" bucket. Guarded here rather than relying on the template's
  // v-if to narrow it, which it does not do through an event handler.
  groupName: string | null,
  kind: LineStatusKind,
) {
  if (!groupName || pendingLineStatus.value) return
  pendingLineStatus.value = `${groupName}:${kind}`
  try {
    await raiseLineStatus({ groupName, kind })
    toast.success(`${groupName} — ${lineStatusButtonLabel(kind)}`)
  } catch (e) {
    toast.error(
      e instanceof ApiError ? e.message : 'Gagal mengirim status line',
    )
  } finally {
    pendingLineStatus.value = null
  }
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
    // Two different reasons to be held, and telling the operator the wrong
    // one sends them to check the wrong rack.
    toast.info(
      released.waitingFor === 'drop'
        ? `Rak tujuan masih terisi — ${released.code} ditampung dulu, otomatis jalan begitu rak ${released.waitingForCode} kosong`
        : `Rak belum ready — ${released.code} ditampung dulu, otomatis jalan begitu rak ${released.waitingForCode} terisi`,
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
    waitingFor: released.waitingFor,
  })

  // Straight back to the list — several Custom Tasks can be in flight at
  // once, each queue card clearing on its own.
  changeTask()
}
</script>

<template>
  <!-- Narrow everywhere except the picker: the confirm screen is one
       column of fields and reads badly stretched, but three groups side by
       side need the room. -->
  <div
    class="mx-auto w-full space-y-4 px-4 py-6 sm:px-0"
    :class="step === 'pick' ? 'max-w-5xl' : 'max-w-md'"
  >
    <div>
      <h1 class="text-xl font-extrabold text-[#0F1F52] sm:text-2xl">Custom Task</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">
        {{ subtitle }}
      </p>
    </div>

    <!-- The task now confirmed, with a way back to the list. -->
    <div v-if="preview" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
        @click="changeTask"
      >
        Task: {{ preview.code }} · Change
      </button>
    </div>

    <!-- Only the tasks this operator was registered to. -->
    <UiBaseCard v-if="step === 'pick'" class="space-y-3">
      <p v-if="loadingTasks" class="py-6 text-center text-sm text-slate-400">
        Loading…
      </p>
      <p
        v-else-if="myTasks.length === 0"
        class="rounded-xl border border-dashed border-[#E2E8F0] py-8 text-center text-sm text-slate-400"
      >
        No Control Task is registered to your account yet.<br>
        Ask an administrator to assign one to you.
      </p>
      <!-- One column per group, side by side where there is room. Stations
           are worked at separately, so keeping each one whole beats a
           single mixed list where the wrong task is one row away. -->
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <section v-for="(group, index) in groupedTasks" :key="group.name" class="space-y-2.5">
          <!-- Filled while open, outlined while folded, so the state reads
               from across the line without having to look for a chevron. -->
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 text-left shadow-sm transition-all active:scale-[0.99]"
            :style="isGroupOpen(group.name, index)
              ? { borderColor: group.color, backgroundColor: group.color, color: contrastText(group.color) }
              : { borderColor: group.color, color: group.color, backgroundColor: '#FFFFFF' }"
            :aria-expanded="isGroupOpen(group.name, index)"
            @click="toggleGroup(group.name, index)"
          >
            <span class="min-w-0 flex-1 break-words text-center text-sm font-extrabold uppercase leading-tight tracking-wide">
              {{ group.name }}
            </span>
            <span class="flex shrink-0 items-center gap-1 text-xs font-bold opacity-80">
              {{ group.tasks.length }}
              <component :is="isGroupOpen(group.name, index) ? ChevronUp : ChevronDown" class="h-4 w-4" />
            </span>
          </button>

          <!-- The code chip sits above the name rather than beside it: on a
               phone a row layout leaves the name only a sliver of width, and
               the name is the one thing the operator picks by. Nothing is
               truncated — a long name wraps onto as many lines as it needs. -->
          <!-- The task's own colour is carried by a left bar and the code
               chip, not by flooding the whole button: the name has to stay
               readable whatever colour an admin picks, and white-on-yellow
               or black-on-navy would not be. -->
          <!-- Two to a row on a phone, where each group gets the full
               width; one per row from sm up, where the groups themselves
               have become columns and a second would be too narrow. -->
          <div
            v-if="isGroupOpen(group.name, index)"
            class="grid grid-cols-2 gap-2 sm:grid-cols-1"
          >
            <button
              v-for="task in group.tasks"
              :key="task.id"
              type="button"
              class="flex w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-[#E2E8F0] border-l-[6px] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50"
              :style="{ borderLeftColor: taskColor(task) }"
              @click="pickTask(task)"
            >
              <span class="flex items-start gap-2">
                <!-- Hidden on a phone: at two buttons to a row the chip
                     takes a third of the width and pushes the name, which
                     is what the operator reads, into a narrow column. The
                     task's colour still shows on the left bar, and the
                     code is on the confirm screen. -->
                <span
                  class="mt-0.5 hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold leading-tight sm:block"
                  :style="{ backgroundColor: taskColor(task), color: contrastText(taskColor(task)) }"
                >
                  {{ task.code }}
                </span>
                <!-- Deliberately below the body size: at two buttons to a
                     row on a phone, 16px wraps a name like "Empty WRL31_LH"
                     onto three lines and the button grows taller than the
                     thumb that has to hit it. -->
                <span class="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug text-[#0F1F52] sm:text-sm">
                  {{ task.name }}
                </span>
              </span>
              <!-- Hidden in the two-column phone layout: a six-leg route
                   wraps to four lines there and buries the name, which is
                   what the operator picks by. The confirm screen shows the
                   full route before anything is sent. -->
              <span class="hidden break-all font-mono text-[11px] leading-snug text-slate-500 sm:block">
                {{ task.route.join(' → ') }}
              </span>
            </button>
          </div>

          <!-- The four line-status buttons, only for a group an admin
               registered them on. Below the tasks and separated by a rule,
               because they are a different act: a task sends an AMR, these
               only tell the warehouse board what this line is doing.
               Kept two to a row at every width — the labels are short and
               the pairs read as LH beside RH, which is how the line thinks
               about them. -->
          <div
            v-if="isGroupOpen(group.name, index) && group.lineStatus && group.rawName"
            class="space-y-2 border-t border-dashed border-[#E2E8F0] pt-2.5"
          >
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="kind in LINE_STATUS_KINDS"
                :key="kind"
                type="button"
                class="rounded-xl px-3 py-3 text-center text-[13px] font-extrabold uppercase leading-tight tracking-wide text-white shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                :style="{ backgroundColor: lineStatusColor(kind) }"
                :disabled="pendingLineStatus !== null"
                @click="pressLineStatus(group.rawName, kind)"
              >
                {{ lineStatusButtonLabel(kind) }}
              </button>
            </div>
          </div>
        </section>
      </div>
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
              {{ item.waitingFor === 'drop'
                ? `Rak tujuan ${item.waitingForCode} masih terisi`
                : `Rak ${item.waitingForCode} belum ready` }}
            </span>
          </p>
          <p class="font-medium text-amber-700">
            {{ item.waitingFor === 'drop'
              ? 'Task otomatis jalan begitu rak tujuan dikosongkan — tidak perlu kirim ulang.'
              : 'Task otomatis jalan begitu rak terisi — tidak perlu kirim ulang.' }}
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
