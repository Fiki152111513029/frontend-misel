<script setup lang="ts">
import type { CustomTaskRun } from '~/types/custom-task'

interface Props {
  modelValue: boolean
  run: CustomTaskRun | null
  cancelling?: boolean
}

withDefaults(defineProps<Props>(), {
  cancelling: false,
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
    title="Cancel Custom Task"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600">
      Cancel <strong>{{ run?.abjad }} — {{ run?.name }}</strong>?
    </p>
    <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
      This asks RCS to stop the order, so a robot already on its way will be
      pulled off it. If RCS refuses, nothing is changed here either.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Keep it</UiBaseButton>
      <UiBaseButton variant="primary" :loading="cancelling" @click="emit('confirm')">
        Cancel Task
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
