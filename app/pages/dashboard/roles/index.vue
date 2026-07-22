<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { RoleSortKey, RoleSortOrder } from '~/components/roles/Table.vue'
import type { CreateRoleInput, Role } from '~/types/role'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Roles — Misel' })

const { hasPermission } = useAuth()
const { items, loading, fetchRoles, createRole, updateRole, deleteRole, assignPermissions } =
  useRoles()
const { items: allPermissions, fetchPermissions } = usePermissions()

const sort = ref<{ key: RoleSortKey, order: RoleSortOrder }>({ key: 'name', order: 'asc' })
const currentPage = ref(1)
const pageSize = ref(10)

const CLIENT_SORT_ACCESSORS: Record<RoleSortKey, (item: Role) => string | number> = {
  name: item => item.name.toLowerCase(),
  description: item => (item.description ?? '').toLowerCase(),
  permissions: item => item.permissions.length,
}

const sortedItems = computed(() => {
  const accessor = CLIENT_SORT_ACCESSORS[sort.value.key]
  return [...items.value].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    if (av < bv) return sort.value.order === 'asc' ? -1 : 1
    if (av > bv) return sort.value.order === 'asc' ? 1 : -1
    return 0
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedItems.value.length / pageSize.value)))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

function handleSort(patch: { sortBy: RoleSortKey, sortOrder: RoleSortOrder }) {
  sort.value = { key: patch.sortBy, order: patch.sortOrder }
}

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

function handleLimitChange(limit: number) {
  pageSize.value = limit
  currentPage.value = 1
}

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const showPermissionsDialog = ref(false)
const editingRole = ref<Role | null>(null)
const deletingRole = ref<Role | null>(null)
const managingRole = ref<Role | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const assigningPermissions = ref(false)

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})

function openCreate() {
  editingRole.value = null
  showFormDialog.value = true
}

function openEdit(role: Role) {
  editingRole.value = role
  showFormDialog.value = true
}

function openDelete(role: Role) {
  deletingRole.value = role
  showDeleteDialog.value = true
}

function openManagePermissions(role: Role) {
  managingRole.value = role
  showPermissionsDialog.value = true
}

async function handleFormSubmit(input: CreateRoleInput) {
  submitting.value = true
  const ok = editingRole.value
    ? await updateRole(editingRole.value.id, input)
    : await createRole(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingRole.value) return
  deleting.value = true
  const ok = await deleteRole(deletingRole.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

async function handlePermissionsSubmit(permissionIds: string[]) {
  if (!managingRole.value) return
  assigningPermissions.value = true
  const ok = await assignPermissions(managingRole.value.id, { permissionIds })
  assigningPermissions.value = false
  if (ok) showPermissionsDialog.value = false
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Roles</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">Configure access control and permissions</p>
      </div>

      <button
        v-if="hasPermission('role.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Role
      </button>
    </div>

    <RolesTable
      :items="paginatedItems"
      :loading="loading"
      :sort-by="sort.key"
      :sort-order="sort.order"
      @edit="openEdit"
      @delete="openDelete"
      @manage-permissions="openManagePermissions"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="currentPage"
      :total-pages="totalPages"
      :total="sortedItems.length"
      :limit="pageSize"
      item-label="roles"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <RolesFormDialog
      v-model="showFormDialog"
      :role="editingRole"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <RolesDeleteDialog
      v-model="showDeleteDialog"
      :role="deletingRole"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />

    <RolesPermissionsDialog
      v-model="showPermissionsDialog"
      :role="managingRole"
      :all-permissions="allPermissions"
      :submitting="assigningPermissions"
      @submit="handlePermissionsSubmit"
      @cancel="showPermissionsDialog = false"
    />
  </div>
</template>
