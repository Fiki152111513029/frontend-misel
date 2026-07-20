<script setup lang="ts">
const route = useRoute()

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  const result: { label: string; path: string }[] = []
  let current = ''
  for (const part of parts) {
    current += `/${part}`
    result.push({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      path: current,
    })
  }
  return result
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-sm">
    <NuxtLink
      to="/dashboard"
      class="text-slate-400 dark:text-slate-500 hover:text-[#01ADEF] transition-colors"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    </NuxtLink>
    <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
      <svg class="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
      <NuxtLink
        :to="crumb.path"
        :class="[
          i === breadcrumbs.length - 1
            ? 'font-medium text-[#0F1F52] dark:text-[#F8FAFC]'
            : 'text-slate-400 dark:text-slate-500 hover:text-[#01ADEF] transition-colors',
        ]"
      >
        {{ crumb.label }}
      </NuxtLink>
    </template>
  </nav>
</template>
