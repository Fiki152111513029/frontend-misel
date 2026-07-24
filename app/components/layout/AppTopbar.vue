<script setup lang="ts">
import { Bell, Search, Menu } from 'lucide-vue-next'

const { isCollapsed, toggleMobile } = useSidebar()
const searchQuery = ref('')
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md px-4 md:px-6 transition-colors duration-300 flex-shrink-0"
  >
    <!-- Left: Hamburger (mobile) + Breadcrumb -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Hamburger (mobile) -->
      <button
        class="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-slate-500 hover:text-[#01ADEF] transition-colors focus:outline-none"
        @click="toggleMobile"
      >
        <Menu class="h-4.5 w-4.5 h-[18px] w-[18px]" />
      </button>
      <LayoutAppBreadcrumb />
    </div>
    <!-- Right: Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- User dropdown -->
      <LayoutUserDropdown />
    </div>
  </header>
</template>
