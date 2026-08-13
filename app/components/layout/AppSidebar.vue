<script setup lang="ts">
import {
  LayoutDashboard, Users, FolderKanban,
  BarChart3, Bell, Settings, Package, Cpu, Truck,
  HelpCircle, ChevronLeft, ChevronRight, ChevronDown,
  Map as MapIcon,
} from 'lucide-vue-next'
import logoSrc from '~/assets/images/logomisbot.png'
import robotPromoSrc from '~/assets/images/irayplay.png'

const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar()
const { user } = useAuth()
const route = useRoute()

interface MenuLeaf { title: string, icon: any, path: string }
interface MenuChild { title: string, path: string }
interface MenuGroup { title: string, icon: any, children: MenuChild[] }
type MenuEntry = MenuLeaf | MenuGroup

// Operator is a line-staff role restricted to only the tools it needs day to
// day; every other role sees the full sidebar below.
const OPERATOR_MENUS: MenuEntry[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Mainline', icon: Cpu, path: '/dashboard/mainline' },
  { title: 'Quarantines Tasks', icon: FolderKanban, path: '/dashboard/quarantines-tasks' },
  { title: 'Request Box', icon: LayoutDashboard, path: '/dashboard/request-box' },
]

// Exim is a line-staff role restricted to docking visibility and its own
// request box workflow only.
const EXIM_MENUS: MenuEntry[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Docking', icon: Truck, path: '/dashboard/docking' },
  { title: 'Request Box', icon: LayoutDashboard, path: '/dashboard/request-box' },
]

// Warehouse is a line-staff role restricted to releasing/monitoring cart
// tasks from Warehouse Control and its own request box workflow only.
const WAREHOUSE_MENUS: MenuEntry[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Warehouse Control', icon: Cpu, path: '/dashboard/warehouse-control' },
  { title: 'Warehouse Tasks', icon: FolderKanban, path: '/dashboard/warehouse-tasks' },
]

const ALL_MENUS: MenuEntry[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    title: 'All Tasks',
    icon: FolderKanban,
    children: [
      { title: 'Tasks', path: '/dashboard/tasks' },
      { title: 'Quarantines Tasks', path: '/dashboard/quarantines-tasks' },
      { title: 'Warehouse Tasks', path: '/dashboard/warehouse-tasks' },
    ],
  },
  {
    title: 'Production Lines',
    icon: FolderKanban,
    children: [
      { title: 'Production Lines', path: '/dashboard/production-lines' },
      { title: 'Production Line Areas', path: '/dashboard/production-line-areas' },
      { title: 'EXIM Locations', path: '/dashboard/exim-location' },
      { title: 'Empty Pallet Location', path: '/dashboard/empty-pallet-location' },
      { title: 'Charger Areas', path: '/dashboard/charger-areas' },
      { title: 'Model Code Process', path: '/dashboard/model-code-process' },
    ],
  },
  {
    title: 'Quarantines',
    icon: FolderKanban,
    children: [
      { title: 'Quarantines Lines', path: '/dashboard/quarantines-lines' },
      { title: 'Quarantines Areas', path: '/dashboard/quarantines-areas' },
    ],
  },
  { title: 'Request Box', icon: LayoutDashboard, path: '/dashboard/request-box' },
  {
    title: 'Warehouse Lines',
    icon: BarChart3,
    children: [
      { title: 'Operator Locations', path: '/dashboard/operator-locations' },
      { title: 'Line Locations', path: '/dashboard/line-locations' },
      { title: 'Trolleys', path: '/dashboard/trolleys' },
    ],
  },
  { title: 'Trouble Shot', icon: LayoutDashboard, path: '/dashboard/trouble-shot' },
  {
    title: 'ICS Logs',
    icon: BarChart3,
    children: [
      { title: 'API Logs', path: '/dashboard/api-logs' },
      { title: 'Webhook Logs', path: '/dashboard/webhook-logs' },
    ],
  },
  {
    title: 'User Management',
    icon: Users,
    children: [
      { title: 'Users', path: '/dashboard/users' },
      { title: 'Roles', path: '/dashboard/roles' },
      { title: 'Permissions', path: '/dashboard/permissions' },
    ],
  },
  { title: 'Robots', icon: Bell, path: '/dashboard/robots' },
  { title: 'Box Types', icon: Package, path: '/dashboard/box-types' },
  { title: 'Factory Maps', icon: MapIcon, path: '/dashboard/factory-maps' },
  // { title: 'Settings', icon: Settings, path: '/dashboard/settings' },
  // { title: 'Help Center', icon: HelpCircle, path: '/dashboard/help' },
]

const ROLE_MENUS: Record<string, MenuEntry[]> = {
  Operator: OPERATOR_MENUS,
  Exim: EXIM_MENUS,
  Warehouse: WAREHOUSE_MENUS,
}

const menus = computed<MenuEntry[]>(() => ROLE_MENUS[user.value?.role ?? ''] ?? ALL_MENUS)

function isGroup(menu: MenuEntry): menu is MenuGroup {
  return 'children' in menu
}

function isActive(path: string) {
  return path === '/dashboard'
    ? route.path === '/dashboard'
    : route.path.startsWith(path)
}

function isGroupActive(menu: MenuGroup) {
  return menu.children.some(child => isActive(child.path))
}

const OPEN_GROUPS_STORAGE_KEY = 'sidebar-open-groups'

const openGroups = reactive<Record<string, boolean>>({})
menus.value.forEach((menu) => {
  if (isGroup(menu))
    openGroups[menu.title] = isGroupActive(menu)
})

// Restore the user's last open/closed group state after mount so a refresh
// doesn't force a group open again just because its route is active.
// (Collapsed state itself is owned by the sidebar store, not here.)
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(OPEN_GROUPS_STORAGE_KEY) ?? '{}')
    Object.keys(openGroups).forEach((title) => {
      if (title in saved)
        openGroups[title] = saved[title]
    })
  }
  catch {}
})

watch(openGroups, (value) => {
  localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(value))
}, { deep: true })

function toggleGroup(title: string) {
  if (isCollapsed.value)
    toggleCollapse()
  openGroups[title] = !openGroups[title]
}
</script>

<template>
  <!-- Mobile overlay -->
  <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
      @click="closeMobile"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    class="fixed top-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden bg-[#00246E] transition-all duration-300 ease-in-out"
    :class="[
      isCollapsed ? 'w-[72px]' : 'w-[280px]',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Header: Logo + collapse -->
    <div
      class="flex h-16 items-center border-b border-white/10 px-4 flex-shrink-0"
      :class="isCollapsed ? 'justify-center' : 'justify-between'"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#01ADEF]">
          <img :src="logoSrc" alt="Logo" class="h-6 w-6 object-contain" @error="($event.target as HTMLImageElement).style.display='none'" />
        </div>
        <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 w-0" enter-to-class="opacity-100" leave-active-class="transition duration-150" leave-to-class="opacity-0">
          <span v-if="!isCollapsed" class="whitespace-nowrap font-bold text-white text-[17px]">
            Misel
          </span>
        </Transition>
      </div>
      <button
        v-if="!isCollapsed"
        class="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
        @click="toggleCollapse"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
    </div>

    <!-- Floating expand button (shown only while collapsed, straddles the sidebar edge) -->
    <button
      v-if="isCollapsed"
      class="hidden lg:flex absolute -right-3 top-5 z-10 h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#15308A] text-white/60 hover:text-white shadow-sm transition-colors"
      @click="toggleCollapse"
    >
      <ChevronRight class="h-3.5 w-3.5" />
    </button>

    <!-- Navigation -->
    <nav class="sidebar-nav-scroll flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
      <template v-for="menu in menus" :key="menu.title">
        <!-- Simple link -->
        <NuxtLink
          v-if="!isGroup(menu)"
          :to="menu.path"
          class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
          :class="[
            isActive(menu.path)
              ? 'bg-gradient-to-r from-[#ef5400] to-[#ff9d00] text-white shadow-sm'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ]"
          :title="isCollapsed ? menu.title : undefined"
          @click="closeMobile"
        >
          <component
            :is="menu.icon"
            class="h-[18px] w-[18px] flex-shrink-0 transition-colors"
            :class="isActive(menu.path) ? 'text-white' : 'text-white/50 group-hover:text-white/80'"
          />
          <span
            class="whitespace-nowrap overflow-hidden transition-all duration-300"
            :class="isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
          >
            {{ menu.title }}
          </span>
          <!-- Active indicator dot (collapsed mode) -->
          <div
            v-if="isCollapsed && isActive(menu.path)"
            class="absolute left-0 h-6 w-1 rounded-r-full bg-[#F2994A]"
          />
        </NuxtLink>

        <!-- Accordion group -->
        <div v-else class="relative">
          <button
            type="button"
            class="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
            :class="[
              isGroupActive(menu)
                ? 'bg-gradient-to-r from-[#ef5400] to-[#ff9d00] text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ]"
            :title="isCollapsed ? menu.title : undefined"
            @click="toggleGroup(menu.title)"
          >
            <component
              :is="menu.icon"
              class="h-[18px] w-[18px] flex-shrink-0 transition-colors"
              :class="isGroupActive(menu) ? 'text-white' : 'text-white/50 group-hover:text-white/80'"
            />
            <span
              class="flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-300"
              :class="isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
            >
              {{ menu.title }}
            </span>
            <ChevronDown
              v-if="!isCollapsed"
              class="h-4 w-4 flex-shrink-0 transition-transform duration-200"
              :class="openGroups[menu.title] ? 'rotate-180' : ''"
            />
            <!-- Active indicator dot (collapsed mode) -->
            <div
              v-if="isCollapsed && isGroupActive(menu)"
              class="absolute left-0 h-6 w-1 rounded-r-full bg-[#F2994A]"
            />
          </button>

          <Transition
            enter-active-class="transition-all duration-200 ease-out overflow-hidden"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-96"
            leave-active-class="transition-all duration-150 ease-in overflow-hidden"
            leave-from-class="opacity-100 max-h-96"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="!isCollapsed && openGroups[menu.title]" class="overflow-hidden pl-4">
              <NuxtLink
                v-for="child in menu.children"
                :key="child.path"
                :to="child.path"
                class="flex items-center gap-3 rounded-xl px-3 py-2 mt-0.5 text-sm font-medium transition-all duration-150"
                :class="[
                  isActive(child.path)
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
                ]"
                @click="closeMobile"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  :class="isActive(child.path) ? 'bg-[#F2994A]' : 'bg-white/30'"
                />
                <span class="whitespace-nowrap">{{ child.title }}</span>
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </template>
    </nav>

    <!-- Footer -->
    <div class="flex-shrink-0 px-4 pb-4" :class="isCollapsed ? 'flex justify-center' : ''">
      <div v-if="isCollapsed" class="h-2 w-2 rounded-full bg-green-400" title="Online" />

      <div v-else class="relative mt-16">
        <img
          :src="robotPromoSrc"
          alt="Misel Robot"
          class="pointer-events-none absolute -top-14 left-1/2 z-10 w-[160px] -translate-x-1/2 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]"
        />

        <div class="relative overflow-hidden rounded-2xl bg-white/5 px-4 pb-4 pt-14">
          <!-- Dot pattern -->
          <div
            class="pointer-events-none absolute inset-0 opacity-20"
            style="background-image: radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0); background-size: 16px 16px;"
          />

          <p class="relative text-[15px] font-bold leading-snug text-white">
            Smart Robotics<br>
            for Smarter Industry
          </p>

          <div class="relative mt-3 h-1 w-8 rounded-full bg-[#F2994A]" />

          <p class="font-medium relative mt-3 text-xs text-white/60">
            By Mitrainti Group
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-nav-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.sidebar-nav-scroll::-webkit-scrollbar {
  width: 5px;
}
.sidebar-nav-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
}
.sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.35);
}
</style>
