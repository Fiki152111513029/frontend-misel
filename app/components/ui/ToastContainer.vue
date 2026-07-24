<script setup lang="ts">
import { CheckCircle2, X, XCircle } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="alert"
        class="pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg"
        :class="toast.type === 'success'
 ? 'border-emerald-200 '
 : 'border-red-200 '"
      >
        <CheckCircle2
          v-if="toast.type === 'success'"
          class="mt-0.5 h-4.5 w-4.5 h-[18px] w-[18px] flex-shrink-0 text-emerald-500"
        />
        <XCircle v-else class="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-red-500" />

        <p class="font-medium flex-1 text-sm text-[#0F1F52]">{{ toast.message }}</p>

        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss"
          @click="dismiss(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
