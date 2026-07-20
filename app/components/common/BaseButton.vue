<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost'
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
    :class="[
      'relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden',
      fullWidth ? 'w-full' : '',
      variant === 'primary'
        ? 'bg-brand-blue text-white shadow-blue-glow-sm hover:bg-brand-hover hover:shadow-blue-glow active:scale-[0.98] focus:ring-brand-blue/50'
        : variant === 'secondary'
          ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-300 dark:focus:ring-slate-600'
          : 'text-brand-blue hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 focus:ring-brand-blue/30',
    ]"
  >
    <!-- Shimmer overlay on primary -->
    <span
      v-if="variant === 'primary' && !loading"
      class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
    />

    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>

    <slot />
  </button>
</template>
