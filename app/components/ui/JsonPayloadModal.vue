<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  payload: Record<string, unknown> | null
}

withDefaults(defineProps<Props>(), {
  title: 'Payload',
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <UiBaseModal :model-value="modelValue" :title="title" size="lg" @update:model-value="$emit('update:modelValue', $event)">
    <pre class="overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs font-mono text-[#0F1F52]">{{ JSON.stringify(payload, null, 2) }}</pre>
  </UiBaseModal>
</template>
