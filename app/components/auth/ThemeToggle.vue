<script setup lang="ts">
const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    class="fixed right-5 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01ADEF]/40"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    @click="toggleTheme"
  >
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-50 rotate-90"
      enter-to-class="opacity-100 scale-100 rotate-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-50"
      mode="out-in"
    >
      <!-- Sun icon — shown in dark mode (to switch to light) -->
      <svg
        v-if="isDark"
        key="sun"
        class="h-4.5 w-4.5 h-[18px] w-[18px] text-amber-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 011.06 0l1.591 1.59a.75.75 0 01-1.06 1.061L6.166 7.227a.75.75 0 010-1.061z" />
      </svg>
      <!-- Moon icon — shown in light mode (to switch to dark) -->
      <svg
        v-else
        key="moon"
        class="h-[18px] w-[18px] text-slate-600"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
      </svg>
    </Transition>
  </button>
</template>
