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
      This only marks the task cancelled here. RCS has no cancel endpoint in
      this integration, so a robot already on its way will keep going — stop
      it from the RCS console if you need it to halt.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Keep it</UiBaseButton>
      <UiBaseButton variant="primary" :loading="cancelling" @click="emit('confirm')">
        Cancel Task
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
