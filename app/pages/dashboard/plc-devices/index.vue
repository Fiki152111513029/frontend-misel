<script setup lang="ts">
import { CheckCircle2, Plus, XCircle } from 'lucide-vue-next'
import type { CreatePlcDeviceInput, PlcDevice, PlcTestResult } from '~/types/plc'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'PLC Devices — YAZAKI' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  fetchDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  testDevice,
} = usePlcDevices()

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editing = ref<PlcDevice | null>(null)
const deletingDevice = ref<PlcDevice | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => fetchDevices())

// The connection pill is runtime state the poller owns, so it changes
// without anything on this page having acted — re-read on the same signal
// the monitor uses.
useRealtime('plc', () => fetchDevices())

function openCreate() {
  editing.value = null
  showFormDialog.value = true
}

function openEdit(device: PlcDevice) {
  editing.value = device
  showFormDialog.value = true
}

function openDelete(device: PlcDevice) {
  deletingDevice.value = device
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreatePlcDeviceInput) {
  submitting.value = true
  const ok = editing.value
    ? await updateDevice(editing.value.id, input)
    : await createDevice(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingDevice.value) return
  deleting.value = true
  const ok = await deleteDevice(deletingDevice.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

// ---- Connection test ----------------------------------------------------
// Shown on the page rather than as a toast: it is the thing the operator
// is reading while they correct the address, and a toast disappears while
// they are still typing.
const testingId = ref<string | null>(null)
const testResult = ref<{ device: string, result: PlcTestResult } | null>(null)

async function handleTest(device: PlcDevice) {
  if (testingId.value) return
  testingId.value = device.id
  testResult.value = null
  const result = await testDevice(device.id)
  testingId.value = null
  if (result) testResult.value = { device: device.name, result }
  // The attempt itself changes the stored connection state.
  await fetchDevices()
}

function openTags(device: PlcDevice) {
  navigateTo({ path: '/dashboard/plc-tags', query: { deviceId: device.id } })
}

function goToPage(page: number) {
  fetchDevices({ page })
}

function handleLimitChange(limit: number) {
  fetchDevices({ limit, page: 1 })
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">PLC Devices</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">
          Modbus TCP endpoints this system reads from
        </p>
      </div>

      <button
        v-if="hasPermission('plc.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Device
      </button>
    </div>

    <!-- Read-only is a property of the system, not a setting, so it is
         stated where someone configuring a PLC will see it. -->
    <p class="mb-4 rounded-2xl border border-[#E2E8F0] bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
      This system only ever reads from a PLC. There is no write path, so
      nothing configured here can change what a machine is doing.
    </p>

    <div
      v-if="testResult"
      class="mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3"
      :class="testResult.result.ok
        ? 'border-emerald-300 bg-emerald-50'
        : 'border-red-300 bg-red-50'"
    >
      <component
        :is="testResult.result.ok ? CheckCircle2 : XCircle"
        class="mt-0.5 h-4 w-4 shrink-0"
        :class="testResult.result.ok ? 'text-emerald-600' : 'text-red-500'"
      />
      <div class="min-w-0 flex-1">
        <p
          class="text-sm font-semibold"
          :class="testResult.result.ok ? 'text-emerald-900' : 'text-red-900'"
        >
          {{ testResult.device }} — {{ testResult.result.message }}
        </p>
        <p v-if="testResult.result.ok" class="mt-0.5 text-xs text-emerald-700">
          Raw value {{ testResult.result.raw }} in {{ testResult.result.durationMs }} ms.
          A value here means the address answers; whether it is the right
          number depends on the data type and word order of the tag.
        </p>
        <p v-else-if="testResult.result.error" class="mt-0.5 font-mono text-xs text-red-600">
          {{ testResult.result.error }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Dismiss"
        @click="testResult = null"
      >
        ✕
      </button>
    </div>

    <PlcDevicesTable
      :items="items"
      :loading="loading"
      :can-update="hasPermission('plc.update')"
      :can-delete="hasPermission('plc.delete')"
      :testing-id="testingId"
      @edit="openEdit"
      @delete="openDelete"
      @test="handleTest"
      @tags="openTags"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="devices"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <PlcDevicesFormDialog
      v-model="showFormDialog"
      :device="editing"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <PlcDevicesDeleteDialog
      v-model="showDeleteDialog"
      :device="deletingDevice"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
