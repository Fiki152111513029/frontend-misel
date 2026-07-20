<script setup lang="ts">
import type { WarehouseLineLocation } from '~/types/warehouse-line-location'

interface Props {
  modelValue: boolean
  warehouseLineLocation: WarehouseLineLocation | null
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
    title="Delete Warehouse Line Location"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600 dark:text-slate-300">
      Are you sure you want to delete <strong>{{ warehouseLineLocation?.name }}</strong>? This
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
