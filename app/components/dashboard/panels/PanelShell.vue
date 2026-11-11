<script setup lang="ts">
/**
 * The box each dashboard panel lives in.
 *
 * There are two of them because the same four panels are read in two very
 * different places. On the Dashboard they are stacked inside one tall card
 * and read as a single column, so each is a `<section>` with a rule under
 * it. On Live Map they are spread across a grid and each has to stand on
 * its own, so each becomes a card with its own header.
 *
 * Keeping both here rather than in every panel means the panels only ever
 * describe their contents, and the Dashboard's appearance cannot drift out
 * of step with Live Map's one panel at a time.
 */
const props = withDefaults(
  defineProps<{
    /** Its own card with a header, rather than a section in a stack. */
    standalone?: boolean
    /** Last in the stack — no rule under it. Ignored when standalone. */
    last?: boolean
    /** Header text. Upper-cased by the card, left alone in a stack. */
    title: string
  }>(),
  { standalone: false, last: false },
)
</script>

<template>
  <!-- Standalone: a card. The body scrolls rather than the card growing,
       so one busy panel cannot stretch the row its neighbours sit in. -->
  <div
    v-if="props.standalone"
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
  >
    <div class="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
      <div class="flex min-w-0 items-center gap-2">
        <span class="flex-shrink-0 text-slate-400">
          <slot name="icon" />
        </span>
        <p class="truncate text-xs font-bold uppercase tracking-wide text-[#0F1F52]">
          {{ props.title }}
        </p>
      </div>
      <slot name="badge" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <slot />
    </div>

    <!-- A footer the panel only fills when it has one (the queue's legend). -->
    <div v-if="$slots.footer" class="flex-shrink-0 border-t border-[#E2E8F0] px-4 py-2.5">
      <slot name="footer" />
    </div>
  </div>

  <!-- Stacked: exactly the section the Dashboard has always rendered. -->
  <section v-else class="p-5" :class="props.last ? '' : 'border-b border-[#E2E8F0]'">
    <!-- Top-aligned only when there is a subtitle under the title. With a
         single line either side, centring is what the Dashboard has always
         shown and top-aligning would nudge the text against its badge. -->
    <div class="flex justify-between" :class="$slots.subtitle ? 'items-start' : 'items-center'">
      <div>
        <p class="font-semibold text-[#0F1F52]">{{ props.title }}</p>
        <slot name="subtitle" />
      </div>
      <slot name="badge" />
    </div>

    <slot />

    <slot name="footer" />
  </section>
</template>
