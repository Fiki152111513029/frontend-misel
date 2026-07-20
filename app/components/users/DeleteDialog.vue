<script setup lang="ts">
import type { User } from '~/types/user'

interface Props {
  modelValue: boolean
  user: User | null
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
    title="Delete User"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="font-medium text-sm text-slate-600 dark:text-slate-300">
      Are you sure you want to delete <strong>{{ user?.username }}</strong>? This action cannot
      be undone.
    </p>

    <template #footer>
      <UiBaseButton variant="secondary" @click="emit('cancel')">Cancel</UiBaseButton>
      <UiBaseButton variant="primary" :loading="deleting" @click="emit('confirm')">
        Delete
      </UiBaseButton>
    </template>
  </UiBaseModal>
</template>
