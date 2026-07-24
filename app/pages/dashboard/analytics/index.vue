<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Analytics — Misel' })
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-[#0F1F52]">Analytics</h1>
      <p class="font-medium mt-1 text-sm text-slate-500">In-depth data analytics</p>
    </div>
    <UiBaseCard>
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#01ADEF]/10 mb-4">
          <svg class="h-8 w-8 text-[#01ADEF]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-[#0F1F52]">Analytics</h3>
        <p class="font-medium mt-1.5 max-w-sm text-sm text-slate-500">
          This page is under development. Content will be available soon.
        </p>
        <div class="mt-6">
          <UiBaseButton variant="primary" class="bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] hover:from-[#2660D9] hover:to-[#173FB0]">
            Coming Soon
          </UiBaseButton>
        </div>
      </div>
    </UiBaseCard>
  </div>
</template>
