<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  loading: false,
  disabled: false,
  fullWidth: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0F172A] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98]"
    :class="[
      fullWidth ? 'w-full' : '',
      variant === 'primary'
        ? 'bg-[#01ADEF] text-white px-5 py-3 hover:bg-[#0095D4] focus-visible:ring-[#01ADEF]/60 shadow-sm hover:shadow-md hover:shadow-[#01ADEF]/20'
        : variant === 'gradient'
          ? 'bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] text-white px-5 py-3 hover:from-[#2660D9] hover:to-[#173FB0] focus-visible:ring-[#2F6FED]/50 shadow-sm hover:shadow-md'
          : variant === 'secondary'
            ? 'border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#0F1F52] dark:text-[#F8FAFC] px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-visible:ring-slate-400'
            : 'text-[#01ADEF] px-4 py-2 hover:bg-[#01ADEF]/10 dark:hover:bg-[#01ADEF]/15 focus-visible:ring-[#01ADEF]/40',
    ]"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
