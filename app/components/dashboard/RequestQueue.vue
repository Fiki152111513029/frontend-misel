<script setup lang="ts">
interface QueueRequest {
  id: string
  title: string
  route: string
  eta: string
}

const requests: QueueRequest[] = [
  { id: 'REQ-902', title: 'Pick-up: Pallete #902', route: 'DOCK 4 → ZONE B', eta: '02:14m' },
  { id: 'REQ-A1', title: 'Drop-off: Raw Mat-A', route: 'STORAGE → LINE 12', eta: '05:40m' },
]
</script>

<template>
  <UiBaseCard padding="none">
    <div class="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
      <p class="font-semibold text-[#0F1F52]">Request Queue</p>
      <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        {{ requests.length }} Pending
      </span>
    </div>

    <div class="divide-y divide-[#E2E8F0]">
      <div
        v-for="request in requests"
        :key="request.id"
        class="flex items-center gap-3 px-5 py-4"
      >
        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0F1F52]/10 text-[#0F1F52]">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.75h16.5M3.75 9.75v8.25A2.25 2.25 0 006 20.25h12a2.25 2.25 0 002.25-2.25V9.75M3.75 9.75L5.7 4.5h12.6l1.95 5.25" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-[#0F1F52]">{{ request.title }}</p>
          <p class="font-medium text-xs text-slate-400">{{ request.route }}</p>
        </div>
        <span class="flex-shrink-0 text-xs font-medium text-slate-400">{{ request.eta }}</span>
      </div>
    </div>
  </UiBaseCard>
</template>
