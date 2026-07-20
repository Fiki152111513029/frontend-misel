<script setup lang="ts">
const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    class="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#01ADEF] dark:hover:text-[#01ADEF] focus:outline-none"
    :title="isDark ? 'Light mode' : 'Dark mode'"
    @click="toggleTheme"
  >
    <svg v-if="isDark" class="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 011.06 0l1.591 1.59a.75.75 0 01-1.06 1.061L6.166 7.227a.75.75 0 010-1.061z" />
    </svg>
    <svg v-else class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
    </svg>
  </button>
</template>
