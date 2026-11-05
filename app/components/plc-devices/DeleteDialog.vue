<script setup lang="ts">
import type { PlcDevice } from '~/types/plc'

interface Props {
  modelValue: boolean
  device: PlcDevice | null
  deleting?: boolean
}

const props = withDefaults(defineProps<Props>(), { deleting: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const tagCount = computed(() => props.device?.tags.length ?? 0)
</script>

<template>
  <UiBaseModal
    :model-value="modelValue"
    title="Delete PLC Device"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600">
      Are you sure you want to delete <strong>{{ device?.name }}</strong>?
    </p>
    <!-- Said up front, because the tags are the part that took work to
         enter and they go with the device. -->
    <p v-if="tagCount > 0" class="mt-2 font-medium text-sm text-amber-700">
      Its {{ tagCount }} tag{{ tagCount === 1 ? '' : 's' }} will be removed too.
    </p>
    <p class="mt-2 text-sm text-slate-500">
      Recorded value history is kept. This action cannot be undone.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="primary" :loading="deleting" @click="emit('confirm')">
        Delete
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
