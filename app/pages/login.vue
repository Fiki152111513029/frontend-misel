<script setup lang="ts">
import bgHeroSrc from '~/assets/images/bg-hero.png'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({ title: 'Sign In — Misel' })

const { login } = useAuth()
const router = useRouter()

const serverError = ref<string | null>(null)
const isSubmitting = ref(false)

async function handleLogin(credentials: { identifier: string; password: string; rememberMe: boolean }) {
  serverError.value = null
  isSubmitting.value = true
  const result = await login(credentials)
  if (result.success) {
    await router.push('/dashboard')
  } else {
    serverError.value = result.message ?? 'Login failed. Please try again.'
  }
  isSubmitting.value = false
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 transition-colors duration-300"
    :class="$colorMode.value === 'dark' ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : ''"
  >
    <!-- Background image (fixed, unaffected by card size changes) -->
    <div
      v-if="$colorMode.value !== 'dark'"
      class="pointer-events-none fixed inset-0 bg-cover bg-center"
      :style="`background-image: url(${bgHeroSrc})`"
    />

    <!-- Theme toggle -->
    <AuthThemeToggle />

    <!-- Login card (centered) -->
    <AuthLoginCard
      :server-error="serverError"
      @submit="handleLogin"
    />
  </div>
</template>
