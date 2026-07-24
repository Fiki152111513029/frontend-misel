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

const checkboxId = computed(
  () => props.id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`,
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="relative flex items-center">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="peer h-4 w-4 cursor-pointer appearance-none rounded border border-[#E2E8F0] bg-white transition-all checked:border-[#01ADEF] checked:bg-[#01ADEF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01ADEF]/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <!-- Checkmark icon overlay -->
      <svg
        class="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        viewBox="0 0 16 16"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l3.5 3.5L13 4.5" />
      </svg>
    </div>

    <label
      v-if="label"
      :for="checkboxId"
      class="cursor-pointer select-none text-sm text-slate-600"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
    >
      {{ label }}
    </label>
    <slot v-else />
  </div>
</template>
