<script setup lang="ts">
/**
 * The "‹ 1 / 3 ›" control in a panel header.
 *
 * Renders nothing at all on a single page — an arrow that cannot move is
 * worse than no arrow, and on a board being read from across the room the
 * header should only carry what is actually true of what is below it.
 *
 * The arrows stay even though the pages turn themselves: someone standing
 * at the board who wants the page they just missed should not have to wait
 * for it to come round again.
 */
const props = defineProps<{ page: number, pageCount: number }>()
const emit = defineEmits<{ step: [delta: number] }>()
</script>

<template>
  <div
    v-if="props.pageCount > 1"
    class="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium text-slate-500"
  >
    <button
      type="button"
      class="flex h-5 w-5 items-center justify-center rounded border border-[#E2E8F0] leading-none transition-colors hover:border-[#01ADEF] hover:text-[#01ADEF]"
      aria-label="Previous page"
      @click="emit('step', -1)"
    >
      &lsaquo;
    </button>
    <span class="tabular-nums">{{ props.page }} / {{ props.pageCount }}</span>
    <button
      type="button"
      class="flex h-5 w-5 items-center justify-center rounded border border-[#E2E8F0] leading-none transition-colors hover:border-[#01ADEF] hover:text-[#01ADEF]"
      aria-label="Next page"
      @click="emit('step', 1)"
    >
      &rsaquo;
    </button>
  </div>
</template>
