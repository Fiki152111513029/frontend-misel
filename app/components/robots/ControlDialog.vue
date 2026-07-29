<script setup lang="ts">
import type { Robot } from '~/types/robot'

interface Props {
  modelValue: boolean
  robot: Robot | null
  action: 'suspend' | 'restore'
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const title = computed(() => (props.action === 'suspend' ? 'Suspend Robot' : 'Restore Robot'))
const actionLabel = computed(() => (props.action === 'suspend' ? 'Suspend' : 'Restore'))
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600">
      Are you sure you want to {{ actionLabel.toLowerCase() }} <strong>{{ robot?.name }}</strong>?
      This sends a real command to the robot through the AMR fleet control system.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="primary" :loading="submitting" @click="emit('confirm')">
        {{ actionLabel }}
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
