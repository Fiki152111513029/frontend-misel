import {
  LayoutDashboard, Users, FolderKanban, BarChart3, Bell, Map as MapIcon,
} from 'lucide-vue-next'

export interface MenuChild { title: string, path: string, permission: string | null }
export interface MenuLeaf { title: string, icon: any, path: string, permission: string | null }
export interface MenuGroup { title: string, icon: any, children: MenuChild[] }
export type MenuEntry = MenuLeaf | MenuGroup

export function isMenuGroup(menu: MenuEntry): menu is MenuGroup {
  return 'children' in menu
}

// Single source of truth for both the sidebar (AppSidebar.vue, filtered by
// hasPermission) and route access (middleware/permission.global.ts, which
// blocks direct URL navigation to the same effect) — a menu/route with
// permission: null is open to any authenticated user; otherwise the viewer
// needs that exact permission code (see backend/prisma/seed.ts PERMISSIONS)
// to see the link or reach the route. Configure who gets what via User
// Management > Roles > [role] — no code change needed to regrant a menu.
export const NAV_MENUS: MenuEntry[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'dashboard.read' },
  {
    title: 'All Tasks',
    icon: FolderKanban,
    children: [
      { title: 'Tasks', path: '/dashboard/tasks', permission: 'task.read' },
      { title: 'Warehouse Trolley Task', path: '/dashboard/warehouse-trolley-task', permission: 'warehouse-trolley-task.read' },
      { title: 'Operator Trolley Task', path: '/dashboard/operator-trolley-task', permission: 'operator-trolley-task.read' },
      { title: 'Trolley Activities', path: '/dashboard/trolley-activities', permission: 'trolley-activity.read' },
    ],
  },
  {
    title: 'Production Lines',
    icon: FolderKanban,
    children: [
      { title: 'Production Locations', path: '/dashboard/production-locations', permission: 'production-location.read' },
      { title: 'Charger Areas', path: '/dashboard/charger-areas', permission: 'charger-area.read' },
      { title: 'Parking Areas', path: '/dashboard/parking-areas', permission: 'parking-area.read' },
      { title: 'Model Code Process', path: '/dashboard/model-code-process', permission: 'model-code-process.read' },
    ],
  },
  {
    title: 'Warehouse Lines',
    icon: BarChart3,
    children: [
      { title: 'Warehouse Locations', path: '/dashboard/warehouse-locations', permission: 'warehouse-location.read' },
      { title: 'Trolleys', path: '/dashboard/trolleys', permission: 'trolley.read' },
      { title: 'Trolley Categories', path: '/dashboard/trolley-categories', permission: 'trolley-category.read' },
    ],
  },
  {
    title: 'ICS Logs',
    icon: BarChart3,
    children: [
      { title: 'API Logs', path: '/dashboard/api-logs', permission: 'logs.read' },
      { title: 'Webhook Logs', path: '/dashboard/webhook-logs', permission: 'logs.read' },
      { title: 'Alarm Logs', path: '/dashboard/alarm-logs', permission: 'robot-alarm.read' },
    ],
  },
  {
    title: 'User Management',
    icon: Users,
    children: [
      { title: 'Users', path: '/dashboard/users', permission: 'user.read' },
      { title: 'Shifts', path: '/dashboard/shifts', permission: 'shift.read' },
      { title: 'Roles', path: '/dashboard/roles', permission: 'role.read' },
      { title: 'Permissions', path: '/dashboard/permissions', permission: 'permission.read' },
    ],
  },
  { title: 'Robots', icon: Bell, path: '/dashboard/robots', permission: 'robot.read' },
  { title: 'Factory Maps', icon: MapIcon, path: '/dashboard/factory-maps', permission: 'factory-map.read' },
]

// Exact match only — a path not registered here (dynamic detail routes,
// pages not yet wired into the nav, etc.) is left unrestricted rather than
// guessed at via prefix matching.
export function findRequiredPermission(path: string): string | null | undefined {
  for (const menu of NAV_MENUS) {
    if (isMenuGroup(menu)) {
      const child = menu.children.find(c => c.path === path)
      if (child) return child.permission
    } else if (menu.path === path) {
      return menu.permission
    }
  }
  return undefined
}
