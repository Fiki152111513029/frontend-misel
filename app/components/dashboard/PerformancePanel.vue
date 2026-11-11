<script setup lang="ts">
/**
 * The Dashboard's right-hand column: four panels stacked in one card.
 *
 * The panels themselves live in components/dashboard/panels/ and each
 * fetches and subscribes on its own. This file is only the stack — Live Map
 * takes the same four and spreads them across its board instead, which is
 * why none of them knows anything about the card it is in.
 *
 * `fill` lets the stack stretch to whatever height its parent gives it,
 * instead of the fixed cap it uses beside the Dashboard's map.
 */
const props = withDefaults(defineProps<{ fill?: boolean }>(), { fill: false })
</script>

<template>
  <div
    class="flex h-full flex-col overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white transition-colors duration-200"
    :class="props.fill ? 'min-h-0' : 'max-h-[460px] 2xl:max-h-[600px]'"
  >
    <DashboardPanelsPerformance />
    <DashboardPanelsAbnormality />
    <DashboardPanelsChargerStatus />
    <DashboardPanelsRequestQueue last />
  </div>
</template>
