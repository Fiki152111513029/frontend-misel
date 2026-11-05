<script setup lang="ts">
import {
  PLC_DATA_TYPES,
  PLC_REGISTER_TYPES,
  spansTwoRegisters,
} from '~/types/plc'
import type {
  CreatePlcTagInput,
  PlcDataType,
  PlcDevice,
  PlcRegisterType,
  PlcTag,
  PlcWordOrder,
} from '~/types/plc'

interface Props {
  modelValue: boolean
  tag?: PlcTag | null
  devices: PlcDevice[]
  /** Pre-selected when the page was opened filtered to one device. */
  defaultDeviceId?: string | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tag: null,
  defaultDeviceId: null,
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [input: CreatePlcTagInput]
  cancel: []
}>()

const deviceId = ref('')
const name = ref('')
const address = ref(0)
const registerType = ref<PlcRegisterType>('HOLDING_REGISTER')
const dataType = ref<PlcDataType>('UINT16')
const wordOrder = ref<PlcWordOrder>('BIG')
const scale = ref(1)
const unit = ref('')
const description = ref('')
const isActive = ref(true)
const logEnabled = ref(true)

const errors = reactive<{
  deviceId?: string
  name?: string
  address?: string
  scale?: string
}>({})

function resetFields() {
  deviceId.value = props.tag?.deviceId ?? props.defaultDeviceId ?? ''
  name.value = props.tag?.name ?? ''
  address.value = props.tag?.address ?? 0
  registerType.value = props.tag?.registerType ?? 'HOLDING_REGISTER'
  dataType.value = props.tag?.dataType ?? 'UINT16'
  wordOrder.value = props.tag?.wordOrder ?? 'BIG'
  scale.value = props.tag?.scale ?? 1
  unit.value = props.tag?.unit ?? ''
  description.value = props.tag?.description ?? ''
  isActive.value = props.tag?.isActive ?? true
  logEnabled.value = props.tag?.logEnabled ?? true
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

const isEditMode = computed(() => !!props.tag)

// A coil holds one bit, so the word types do not apply to it. Forcing the
// choice rather than offering an impossible one.
const isBitAddress = computed(
  () => registerType.value === 'COIL' || registerType.value === 'DISCRETE_INPUT',
)

watch(isBitAddress, (bit) => {
  if (bit) dataType.value = 'BOOL'
  else if (dataType.value === 'BOOL') dataType.value = 'UINT16'
})

const availableDataTypes = computed(() =>
  isBitAddress.value ? (['BOOL'] as PlcDataType[]) : PLC_DATA_TYPES.filter(t => t !== 'BOOL'),
)

const showWordOrder = computed(() => spansTwoRegisters(dataType.value))

const secondAddress = computed(() => address.value + 1)

function validate(): boolean {
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof typeof errors]
  }

  if (!deviceId.value) errors.deviceId = 'Choose a device'
  if (!name.value.trim()) errors.name = 'Name is required'
  if (!Number.isInteger(address.value) || address.value < 0 || address.value > 65535) {
    errors.address = 'Address must be between 0 and 65535'
  }
  if (!Number.isFinite(scale.value) || scale.value === 0) {
    errors.scale = 'Scale must be a non-zero number'
  }

  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    deviceId: deviceId.value,
    name: name.value.trim(),
    address: address.value,
    registerType: registerType.value,
    dataType: dataType.value,
    wordOrder: wordOrder.value,
    scale: scale.value,
    unit: unit.value.trim() || null,
    description: description.value.trim() || null,
    isActive: isActive.value,
    logEnabled: logEnabled.value,
  })
}

const selectClass
  = 'w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F1F52] outline-none focus:border-[#01ADEF] focus:ring-2 focus:ring-[#01ADEF]/15'
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isEditMode ? 'Edit PLC Tag' : 'Add PLC Tag'"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">
          Device
          <span class="ml-0.5 text-[#01ADEF]">*</span>
        </label>
        <!-- Locked on edit: moving a tag to another device would silently
             change what its recorded history means. -->
        <select v-model="deviceId" :disabled="isEditMode" :class="selectClass">
          <option value="" disabled>Select a device</option>
          <option v-for="device in devices" :key="device.id" :value="device.id">
            {{ device.name }} ({{ device.host }})
          </option>
        </select>
        <p v-if="errors.deviceId" class="text-xs text-red-500">{{ errors.deviceId }}</p>
      </div>

      <UiBaseInput
        v-model="name"
        label="Tag Name"
        required
        :error="errors.name"
        placeholder="Rack WRL31 full"
      />

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Register Type</label>
        <select v-model="registerType" :class="selectClass">
          <option v-for="type in PLC_REGISTER_TYPES" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div>
        <UiBaseInput
          v-model.number="address"
          type="number"
          label="Address"
          required
          :error="errors.address"
        />
        <!-- The single most common reason a correctly connected device
             returns the wrong number, so it is spelled out here. -->
        <p class="mt-1 text-xs text-slate-500">
          Zero-based protocol address. If your tag list says
          <strong>40001</strong>, enter <strong>0</strong>; 40101 is 100.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Data Type</label>
          <select v-model="dataType" :disabled="isBitAddress" :class="selectClass">
            <option v-for="type in availableDataTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
          <p v-if="isBitAddress" class="text-xs text-slate-500">
            Coils and discrete inputs are single bits.
          </p>
          <p v-else-if="showWordOrder" class="text-xs text-slate-500">
            Spans two registers: {{ address }} and {{ secondAddress }}.
          </p>
        </div>

        <div v-if="showWordOrder" class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Word Order</label>
          <select v-model="wordOrder" :class="selectClass">
            <option value="BIG">High word first (common)</option>
            <option value="LITTLE">Low word first (word-swapped)</option>
          </select>
          <p class="text-xs text-slate-500">
            If the connection works but the number is wildly wrong, this is
            almost always the setting to change.
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <UiBaseInput
            v-model.number="scale"
            type="number"
            step="any"
            label="Scale"
            :error="errors.scale"
          />
          <p class="mt-1 text-xs text-slate-500">
            Multiplier. A PLC storing 235 for 23.5 °C needs 0.1.
          </p>
        </div>
        <UiBaseInput v-model="unit" label="Unit" placeholder="pcs" />
      </div>

      <UiBaseInput v-model="description" label="Description" />

      <div class="space-y-2">
        <UiBaseCheckbox v-model="isActive" label="Active" />
        <div>
          <UiBaseCheckbox v-model="logEnabled" label="Record changes in history" />
          <p class="mt-1 text-xs text-slate-500">
            Turn off for a value that moves on every poll, such as a running
            counter — it would fill the history on its own.
          </p>
        </div>
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
