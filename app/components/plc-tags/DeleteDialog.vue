<script setup lang="ts">
import type { PlcTag } from '~/types/plc'

interface Props {
  modelValue: boolean
  tag: PlcTag | null
  deleting?: boolean
}

withDefaults(defineProps<Props>(), { deleting: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    title="Delete PLC Tag"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600">
      Are you sure you want to delete <strong>{{ tag?.name }}</strong>? It
      will stop being read and disappear from the monitor.
    </p>
    <p class="mt-2 text-sm text-slate-500">
      Its recorded values are kept. This action cannot be undone.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="primary" :loading="deleting" @click="emit('confirm')">
        Delete
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
