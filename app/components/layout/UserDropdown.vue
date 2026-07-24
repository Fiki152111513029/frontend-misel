<script setup lang="ts">
import { UserCircle, Settings, LogOut } from 'lucide-vue-next'

const { user, logout } = useAuth()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleOutside))

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const menuItems = [
  { label: 'My Profile',        icon: UserCircle, path: '/dashboard/settings' },
  { label: 'Account Settings',  icon: Settings,   path: '/dashboard/settings' },
]
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm transition-all hover:bg-slate-50 focus:outline-none"
      @click="isOpen = !isOpen"
    >
      <div class="flex h-7 w-7 items-center justify-center rounded-full bg-[#01ADEF] text-xs font-bold text-white flex-shrink-0">
        {{ initials(user?.name ?? '') }}
      </div>
      <div class="hidden md:block text-left">
        <p class="font-medium text-[#0F1F52] leading-none text-sm">{{ user?.name }}</p>
        <p class="font-medium text-xs text-slate-500 mt-0.5">{{ user?.role }}</p>
      </div>
      <svg class="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-[#E2E8F0] bg-white py-1 shadow-xl z-50"
      >
        <div class="border-b border-[#E2E8F0] px-4 py-3">
          <p class="font-semibold text-sm text-[#0F1F52]">{{ user?.name }}</p>
          <p class="font-medium text-xs text-slate-500 mt-0.5">{{ user?.email || 'No email' }}</p>
        </div>

        <div class="py-1">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.label"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#01ADEF] transition-colors"
            @click="isOpen = false"
          >
            <component :is="item.icon" class="h-4 w-4 flex-shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </div>

        <div class="border-t border-[#E2E8F0] pt-1">
          <button
            class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            @click="logout(); isOpen = false"
          >
            <LogOut class="h-4 w-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
