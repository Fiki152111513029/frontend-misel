<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Dashboard — Misel' })
</script>

<template>
  <div class="animate-fade-in -m-4 space-y-4 bg-white p-4 dark:bg-[#020617] md:-m-6 md:p-6">
    <DashboardStatsBar />

    <div class="grid grid-cols-1 gap-4 2xl:grid-cols-3">
      <div class="rounded-2xl shadow-xl shadow-slate-300/70 dark:shadow-slate-950/60 2xl:col-span-2">
        <DashboardFactoryMap />
      </div>

      <div class="rounded-2xl shadow-xl shadow-slate-300/70 dark:shadow-slate-950/60">
        <DashboardPerformancePanel />
      </div>
    </div>

    <div class="rounded-2xl shadow-xl shadow-slate-300/70 dark:shadow-slate-950/60">
      <DashboardFleetStatusTable />
    </div>
  </div>
</template>
