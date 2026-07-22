<script setup lang="ts">
import { Lock } from 'lucide-vue-next'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Restricted Area',
})

const { verifying, verifyPassword } = useIcsLogsAccess()

const unlocked = ref(false)
const password = ref('')
const error = ref('')

async function handleSubmit() {
  if (!password.value) return
  error.value = ''
  const ok = await verifyPassword(password.value)
  if (ok) {
    unlocked.value = true
  } else {
    error.value = 'Incorrect password. Please try again.'
  }
  password.value = ''
}
</script>

<template>
  <div v-if="unlocked">
    <slot />
  </div>

  <div v-else class="flex min-h-[60vh] items-center justify-center">
    <UiBaseCard class="w-full max-w-sm">
      <div class="flex flex-col items-center text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01ADEF]/10">
          <Lock class="h-6 w-6 text-[#01ADEF]" />
        </div>
        <h2 class="mt-4 text-lg font-bold text-[#0F1F52] dark:text-[#F8FAFC]">{{ title }}</h2>
        <p class="font-medium mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          This page requires an additional password for developer troubleshooting purposes.
        </p>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <UiBaseInput
          v-model="password"
          type="password"
          label="Developer Password"
          placeholder="Enter password"
          :error="error"
        />
        <UiBaseButton type="submit" variant="gradient" full-width :loading="verifying">
          Unlock
        </UiBaseButton>
      </form>
    </UiBaseCard>
  </div>
</template>
