<script setup lang="ts">
interface Column {
  key: string
  label: string
  width?: string
}
interface Props {
  columns: Column[]
  loading?: boolean
}
withDefaults(defineProps<Props>(), { loading: false })
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <slot name="header">
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? `width: ${col.width}` : ''"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              {{ col.label }}
            </th>
          </slot>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="py-12 text-center text-slate-400">
            <div class="flex items-center justify-center gap-2">
              <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading...
            </div>
          </td>
        </tr>
        <slot v-else />
      </tbody>
    </table>
  </div>
</template>
