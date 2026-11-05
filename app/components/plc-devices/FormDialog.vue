<script setup lang="ts">
import type { CreatePlcDeviceInput, PlcDevice } from '~/types/plc'

interface Props {
  modelValue: boolean
  device?: PlcDevice | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  device: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreatePlcDeviceInput]
  cancel: []
}>()

const name = ref('')
const host = ref('')
const port = ref(501)
const unitId = ref(1)
const pollIntervalMs = ref(1000)
const timeoutMs = ref(2000)
const description = ref('')
const isActive = ref(true)

const errors = reactive<{
  name?: string
  host?: string
  port?: string
  unitId?: string
  pollIntervalMs?: string
  timeoutMs?: string
}>({})

function resetFields() {
  name.value = props.device?.name ?? ''
  host.value = props.device?.host ?? ''
  port.value = props.device?.port ?? 501
  unitId.value = props.device?.unitId ?? 1
  pollIntervalMs.value = props.device?.pollIntervalMs ?? 1000
  timeoutMs.value = props.device?.timeoutMs ?? 2000
  description.value = props.device?.description ?? ''
  isActive.value = props.device?.isActive ?? true
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof typeof errors]
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) resetFields()
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.device)

function validate(): boolean {
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof typeof errors]
  }

  if (!name.value.trim()) errors.name = 'Name is required'

  // Not checked against an IP pattern on purpose: a PLC is just as often
  // reached by hostname, and rejecting one sends the operator hunting for
  // a problem that is not there.
  if (!host.value.trim()) errors.host = 'IP address or hostname is required'

  if (!Number.isInteger(port.value) || port.value < 1 || port.value > 65535) {
    errors.port = 'Port must be between 1 and 65535'
  }
  if (!Number.isInteger(unitId.value) || unitId.value < 0 || unitId.value > 255) {
    errors.unitId = 'Unit id must be between 0 and 255'
  }
  // Floored at 200ms: below that a PLC on a shared network starts refusing
  // connections rather than answering faster, and the machine it is
  // actually running comes first.
  if (!Number.isInteger(pollIntervalMs.value) || pollIntervalMs.value < 200) {
    errors.pollIntervalMs = 'Poll interval must be at least 200 ms'
  }
  if (!Number.isInteger(timeoutMs.value) || timeoutMs.value < 100) {
    errors.timeoutMs = 'Timeout must be at least 100 ms'
  }

  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    host: host.value.trim(),
    port: port.value,
    unitId: unitId.value,
    pollIntervalMs: pollIntervalMs.value,
    timeoutMs: timeoutMs.value,
    description: description.value.trim() || null,
    isActive: isActive.value,
  })
}
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit PLC Device' : 'Add PLC Device'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiBaseInput
          v-model="name"
          label="Name"
          required
          :error="errors.name"
          placeholder="PLC Line WRL31"
        />
        <UiBaseInput
          v-model="host"
          label="IP Address / Hostname"
          required
          :error="errors.host"
          placeholder="10.5.5.1"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <UiBaseInput
            v-model.number="port"
            type="number"
            label="Port"
            :error="errors.port"
          />
          <p class="mt-1 text-xs text-slate-500">501 is the Modbus TCP standard.</p>
        </div>
        <div>
          <UiBaseInput
            v-model.number="unitId"
            type="number"
            label="Unit ID"
            :error="errors.unitId"
          />
          <p class="mt-1 text-xs text-slate-500">
            1 for a PLC answering directly. A serial device behind a TCP
            gateway has its own.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <UiBaseInput
            v-model.number="pollIntervalMs"
            type="number"
            label="Poll Interval (ms)"
            :error="errors.pollIntervalMs"
          />
          <p class="mt-1 text-xs text-slate-500">
            How often this device is read. Faster is not free — the PLC is
            running a machine at the same time.
          </p>
        </div>
        <div>
          <UiBaseInput
            v-model.number="timeoutMs"
            type="number"
            label="Timeout (ms)"
            :error="errors.timeoutMs"
          />
          <p class="mt-1 text-xs text-slate-500">
            How long one read may take before it counts as failed.
          </p>
        </div>
      </div>

      <UiBaseInput v-model="description" label="Description" />

      <div>
        <UiBaseCheckbox v-model="isActive" label="Active" />
        <p class="mt-1 text-xs text-slate-500">
          Switch off to stop reading this device without losing its tags.
        </p>
      </div>
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="gradient" :loading="submitting" @click="handleSubmit">
        Save
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
