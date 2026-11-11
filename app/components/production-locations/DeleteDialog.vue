<script setup lang="ts">
import type { ProductionLocation } from '~/types/production-location'

interface Props {
  modelValue: boolean
  productionLocation: ProductionLocation | null
  deleting?: boolean
  /**
   * Set to delete a ticked selection instead of one row. The same dialog
   * handles both so there is one place that says "this cannot be undone"
   * — two of them drift apart the first time one is reworded.
   */
  count?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  deleting: false,
  count: null,
})

const isBulk = computed(() => props.count != null)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="isBulk ? 'Delete selected production locations' : 'Delete Production Location'"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="isBulk" class="font-medium text-sm text-slate-600">
      Are you sure you want to delete <strong>{{ props.count }}</strong> selected
      production locations? This action cannot be undone.
    </p>
    <p v-else class="font-medium text-sm text-slate-600">
      Are you sure you want to delete <strong>{{ productionLocation?.name }}</strong>? This
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
