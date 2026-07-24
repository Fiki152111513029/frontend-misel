<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  id?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checkboxId = computed(() => props.id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <input
      :id="checkboxId"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="h-4 w-4 cursor-pointer rounded border-slate-300 bg-white text-brand-blue transition-colors focus:ring-brand-blue/30 focus:ring-offset-0 checked:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <label
      v-if="label"
      :for="checkboxId"
      class="cursor-pointer select-none text-sm text-slate-600 transition-colors"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    >
      {{ label }}
    </label>
    <slot v-else />
  </div>
</template>
