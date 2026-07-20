<script setup lang="ts">
interface Props {
  colorCode: string
}

defineProps<Props>()

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="h-5 w-5 flex-shrink-0 rounded-md border border-[#E2E8F0] dark:border-[#1E293B]"
      :style="HEX_PATTERN.test(colorCode) ? { backgroundColor: colorCode } : undefined"
    />
    <span class="font-mono text-xs text-slate-500 dark:text-slate-400">{{ colorCode }}</span>
  </div>
</template>
