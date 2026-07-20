<script setup lang="ts">
const { isCollapsed } = useSidebar()
</script>

<template>
  <div class="flex min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
    <!-- Sidebar -->
    <LayoutAppSidebar />

    <!-- Main area (offset by sidebar width on desktop) -->
    <div
      class="flex flex-1 flex-col min-w-0 transition-all duration-300"
      :class="isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'"
    >
      <!-- Topbar -->
      <LayoutAppTopbar />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
