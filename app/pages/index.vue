<script setup lang="ts">
import { Warehouse, Bot, BarChart3, ShieldCheck, ArrowRight } from 'lucide-vue-next'
import logoSrc from '~/assets/images/logomisbot.png'
import bgHeroSrc from '~/assets/images/bg-hero.png'

definePageMeta({
  layout: false,
})

useHead({ title: 'Misel — Digital Solution for Better Future' })

const features = [
  {
    icon: Warehouse,
    title: 'Warehouse Management',
    description: 'Track locations, quarantines, and pallet flow in real time across every zone.',
    color: 'blue',
  },
  {
    icon: Bot,
    title: 'Robot Operations',
    description: 'Monitor and coordinate automated robots and production lines from one place.',
    color: 'blue',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Actionable dashboards that turn floor activity into decisions instantly.',
    color: 'blue',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Role-based access control keeps every action scoped to the right person.',
    color: 'blue',
  },
]

function goToLogin() {
  navigateTo('/login')
}
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col overflow-hidden bg-cover bg-center"
    :style="`background-image: url(${bgHeroSrc})`"
  >
    <!-- Hero -->
    <main class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <!-- Logo -->
      <div class="mb-8 flex animate-fade-in items-center justify-center">
        <img
          :src="logoSrc"
          alt="Misel Logo"
          class="h-auto w-full max-w-xs object-contain sm:max-w-sm"
          loading="eager"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <svg
          class="h-32 w-32 text-[#01ADEF]"
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

      <!-- Title -->
      <h1
        class="animate-slide-up text-5xl font-semibold tracking-tight text-[#254384] sm:text-6xl"
        style="animation-delay: 0.05s"
      >
        By Mitrainti Group
      </h1>

      <!-- Tagline -->
      <p
        class="mt-3 animate-slide-up text-lg font-medium text-[#F2994A]"
        style="animation-delay: 0.1s"
      >
        Digital Solution for Better Future
      </p>

      <!-- Subtitle -->
      <p
        class="mx-auto mt-5 max-w-xl animate-slide-up text-base text-slate-500"
        style="animation-delay: 0.15s"
      >
        One platform to manage warehouses, robots, and production lines —
        built for teams who need real-time visibility and reliable control.
      </p>

      <!-- CTA -->
      <div
        class="mt-10 flex animate-slide-up flex-col items-center gap-4 sm:flex-row"
        style="animation-delay: 0.2s"
      >
        <UiBaseButton
          variant="primary"
          class="shadow-blue-glow-sm bg-gradient-to-r from-[#1739B0] to-[#4C8DFF] px-8 py-3.5 text-base hover:from-[#2049C7] hover:to-[#5C9AFF]"
          @click="goToLogin"
        >
          Sign In to Dashboard
          <ArrowRight class="h-4 w-4" />
        </UiBaseButton>

        <a
          href="mailto:admin@misel.co.id"
          class="text-sm font-medium text-slate-500 hover:text-[#01ADEF] transition-colors"
        >
          Need access? Contact administrator
        </a>
      </div>

      <!-- Feature grid -->
      <div class="mx-auto mt-12 grid w-full max-w-4xl animate-fade-in grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style="animation-delay: 0.3s">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white/70 p-5 text-left backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
        >
          <component
            :is="feature.icon"
            class="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 opacity-[0.06] transition-colors duration-200 group-hover:text-[#E88C35]"
            :class="feature.color === 'orange' ? 'text-[#E88C35]' : 'text-[#2F6FED]'"
          />
          <div
            class="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 group-hover:bg-[#E88C35]/10 group-hover:text-[#E88C35]"
            :class="feature.color === 'orange' ? 'bg-[#E88C35]/10 text-[#E88C35]' : 'bg-[#2F6FED]/10 text-[#2F6FED]'"
          >
            <component :is="feature.icon" class="h-5 w-5" />
          </div>
          <h3 class="relative text-sm font-semibold text-[#254384]">
            {{ feature.title }}
          </h3>
          <p class="relative mt-1.5 text-xs leading-relaxed text-slate-500">
            {{ feature.description }}
          </p>
          <span
            class="relative mt-3 block h-1 w-8 rounded-full transition-colors duration-200 group-hover:bg-[#E88C35]"
            :class="feature.color === 'orange' ? 'bg-[#E88C35]' : 'bg-[#2F6FED]'"
          />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full bg-[#0B2A6B] py-7 text-center text-xs text-white/70">
      &copy; {{ new Date().getFullYear() }} Mitrainti Group. All rights reserved.
    </footer>
  </div>
</template>
