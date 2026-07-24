<script setup lang="ts">
import type { EmptyPalletLocation } from '~/types/empty-pallet-location'

interface Props {
  modelValue: boolean
  emptyPalletLocation: EmptyPalletLocation | null
  deleting?: boolean
}

withDefaults(defineProps<Props>(), {
  deleting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    title="Delete Empty Pallet Location"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600">
      Are you sure you want to delete <strong>{{ emptyPalletLocation?.name }}</strong>? This
      action cannot be undone.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="primary" :loading="deleting" @click="emit('confirm')">
        Delete
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
