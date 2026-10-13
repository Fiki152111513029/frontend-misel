<script setup lang="ts">
import bgHeroSrc from '~/assets/images/bg-hero.png'
import { resolveHomePath } from '~/utils/roleHome'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({ title: 'Sign In — YAZAKI' })

const { login, hasPermission } = useAuth()
const { collapse } = useSidebar()
const router = useRouter()

const serverError = ref<string | null>(null)
const isSubmitting = ref(false)

async function handleLogin(credentials: { identifier: string; password: string; rememberMe: boolean }) {
  serverError.value = null
  isSubmitting.value = true
  const result = await login(credentials)
  if (result.success) {
    if (result.user?.role === 'Operator') {
      collapse()
    }
    // Where they can actually go, not just where the role was told to go.
    // Pushing a blocked path here would hand them straight to
    // permission.global.ts, which would bounce them back to this page and
    // make a correct login look like a failed one.
    const home = resolveHomePath(result.user?.role, result.user?.landingPath, hasPermission)
    if (!home) {
      serverError.value
        = 'Your account has no pages assigned yet. Ask an administrator to grant your role access.'
      isSubmitting.value = false
      return
    }
    await router.push(home)
  } else {
    serverError.value = result.message ?? 'Login failed. Please try again.'
  }
  isSubmitting.value = false
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
    <!-- Background image (fixed, unaffected by card size changes) -->
    <div
      class="pointer-events-none fixed inset-0 bg-cover bg-center"
      :style="`background-image: url(${bgHeroSrc})`"
    />

    <!-- Login card (centered) -->
    <AuthLoginCard
      :server-error="serverError"
      @submit="handleLogin"
    />
  </div>
</template>
