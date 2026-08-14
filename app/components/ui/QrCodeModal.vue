<script setup lang="ts">
import QRCode from 'qrcode'

interface Props {
  modelValue: boolean
  title?: string
  // The exact text encoded in the QR — same input always produces the same
  // QR image, so as long as this stays the entity's own stable code/name
  // (not a timestamp or session-scoped value), the QR never changes.
  value: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'QR Code',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const dataUrl = ref<string | null>(null)
const error = ref(false)

async function generate() {
  if (!props.value) {
    dataUrl.value = null
    return
  }
  try {
    error.value = false
    dataUrl.value = await QRCode.toDataURL(props.value, {
      width: 320,
      margin: 1,
      color: { dark: '#0F1F52', light: '#FFFFFF' },
    })
  } catch {
    error.value = true
    dataUrl.value = null
  }
}

watch(
  () => [props.modelValue, props.value] as const,
  ([isOpen]) => {
    if (isOpen) generate()
  },
  { immediate: true },
)
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col items-center gap-4">
      <div class="flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-3">
        <img v-if="dataUrl" :src="dataUrl" alt="QR Code" class="h-full w-full" />
        <p v-else-if="error" class="text-center text-sm text-red-500">
          Couldn't generate QR code
        </p>
      </div>
      <p class="break-all text-center text-sm font-mono font-semibold text-[#0F1F52]">
        {{ value }}
      </p>
    </div>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('update:modelValue', false)">
        Close
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
