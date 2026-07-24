<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div
    class="relative h-full min-h-[280px] overflow-hidden rounded-xl border border-[#E2E8F0]"
    style="background-image: linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px); background-size: 28px 28px;"
  >
    <div class="absolute inset-0 bg-white/40" />

    <!-- animated path -->
    <svg class="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <line
        x1="18%"
        y1="12%"
        x2="18%"
        y2="88%"
        stroke="#01ADEF"
        stroke-width="1.5"
        stroke-dasharray="4 6"
        opacity="0.6"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1.2s" repeatCount="indefinite" />
      </line>
    </svg>

    <!-- unit marker -->
    <div class="absolute left-[18%] top-[12%] -translate-x-1/2 -translate-y-1/2">
      <span class="absolute inset-0 -m-2 animate-ping rounded-full bg-[#01ADEF]/40" />
      <span
        class="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#01ADEF] text-white shadow-lg shadow-[#01ADEF]/40"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <span
        class="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0F172A] px-1.5 py-0.5 text-[10px] font-semibold text-white"
      >
        {{ label }}
      </span>
    </div>

    <p
      class="absolute bottom-3 right-3 rounded-md bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-500"
    >
      Live tracking preview — sample data
    </p>
  </div>
</template>
