<script setup lang="ts">
import logoSrc from '~/assets/images/logomisbot.png'

interface Props {
  serverError?: string | null
}

withDefaults(defineProps<Props>(), {
  serverError: null,
})

const emit = defineEmits<{
  submit: [credentials: { identifier: string; password: string; rememberMe: boolean }]
}>()
</script>

<template>
  <div class="w-full max-w-[420px] animate-slide-up">
    <div
      class="rounded-3xl border border-[#c6c6c6] bg-white p-8 shadow-xl shadow-slate-400/60 transition-colors duration-300"
    >
      <!-- Logo -->
      <div class="mb-8 flex justify-center">
        <img
          :src="logoSrc"
          alt="Misel Logo"
          class="h-auto w-[200px] object-contain"
          loading="eager"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <!-- Fallback SVG jika logo.png tidak ditemukan -->
        <svg
          class="h-10 w-10 text-[#01ADEF]"
          viewBox="0 0 48 48"
          fill="none"
          style="display: none"
        >
          <rect x="4" y="4" width="17" height="17" rx="5" fill="currentColor" opacity="0.9" />
          <rect x="27" y="4" width="17" height="17" rx="5" fill="currentColor" opacity="0.5" />
          <rect x="4" y="27" width="17" height="17" rx="5" fill="currentColor" opacity="0.5" />
          <rect x="27" y="27" width="17" height="17" rx="5" fill="currentColor" opacity="0.9" />
        </svg>
      </div>

      <!-- Heading -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold tracking-tight text-[#254384]">
          Welcome
        </h1>
        <p class="font-medium mt-1.5 text-sm text-[#E88C35]">
          Sign in to your account to continue
        </p>
      </div>

      <!-- Server Error -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="serverError"
          role="alert"
          class="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
          <span>{{ serverError }}</span>
        </div>
      </Transition>

      <!-- Form -->
      <AuthLoginForm @submit="emit('submit', $event)" />

      <!-- Divider -->
      <div class="mt-6 flex items-center gap-3">
        <div class="h-px flex-1 bg-[#E2E8F0]" />
        <span class="text-xs text-slate-400">or</span>
        <div class="h-px flex-1 bg-[#E2E8F0]" />
      </div>

      <!-- Contact admin -->
      <p class="font-medium mt-4 text-center text-sm text-slate-500">
        Need access?
        <a
          href="mailto:admin@misel.co.id"
          class="font-medium text-[#01ADEF] hover:text-[#0095D4] transition-colors"
        >
          Contact administrator
        </a>
      </p>
    </div>

    <!-- Footer -->
    <p class="font-medium mt-5 text-center text-xs text-slate-400">
      &copy; {{ new Date().getFullYear() }}  Mitrainti Group. All rights reserved.
    </p>
  </div>
</template>
