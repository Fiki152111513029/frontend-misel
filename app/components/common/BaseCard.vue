<script setup lang="ts">
interface Props {
  padding?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  padding: 'md',
})
</script>

<template>
  <div
    class="rounded-3xl bg-white shadow-xl ring-1 ring-slate-100 transition-colors duration-300"
    :class="[
      padding === 'sm' ? 'p-5' : padding === 'lg' ? 'p-10' : 'p-8 md:p-10',
    ]"
  >
    <slot />
  </div>
</template>
