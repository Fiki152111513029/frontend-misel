<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}
withDefaults(defineProps<Props>(), { padding: 'md', hoverable: false })
</script>

<template>
  <div
    class="rounded-2xl border border-[#E2E8F0] bg-white transition-colors duration-200"
    :class="[
 padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6',
 hoverable ? 'hover:shadow-md cursor-pointer' : 'shadow-sm',
 ]"
  >
    <slot />
  </div>
</template>
