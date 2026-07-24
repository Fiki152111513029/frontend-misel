<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { UserSortKey, UserSortOrder } from '~/components/users/Table.vue'
import type { CreateUserInput, User, UserFormValues } from '~/types/user'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'User Management — Misel' })

const { hasPermission } = useAuth()
const { items, loading, fetchUsers, createUser, updateUser, deleteUser } = useUsers()
const { items: roles, fetchRoles } = useRoles()

const roleFilter = ref('All')
const priorityFilter = ref<'All' | 4 | 6 | 8>('All')
const statusFilter = ref<'All' | 'Active' | 'Inactive'>('All')
const sort = ref<{ key: UserSortKey, order: UserSortOrder }>({ key: 'username', order: 'asc' })
const currentPage = ref(1)
const pageSize = ref(10)

function roleName(roleId: string) {
  return roles.value.find(r => r.id === roleId)?.name ?? '—'
}

const CLIENT_SORT_ACCESSORS: Record<UserSortKey, (item: User) => string | number> = {
  username: item => item.username.toLowerCase(),
  email: item => (item.email ?? '').toLowerCase(),
  fullName: item => item.fullName.toLowerCase(),
  role: item => roleName(item.roleId).toLowerCase(),
  priority: item => item.priority,
  isActive: item => (item.isActive ? 1 : 0),
}

const filteredItems = computed(() => items.value.filter((item) => {
  const matchesRole = roleFilter.value === 'All' || item.roleId === roleFilter.value
  const matchesPriority = priorityFilter.value === 'All' || item.priority === priorityFilter.value
  const matchesStatus = statusFilter.value === 'All' || (statusFilter.value === 'Active' ? item.isActive : !item.isActive)
  return matchesRole && matchesPriority && matchesStatus
}))

const sortedItems = computed(() => {
  const accessor = CLIENT_SORT_ACCESSORS[sort.value.key]
  return [...filteredItems.value].sort((a, b) => {
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

watch([roleFilter, priorityFilter, statusFilter], () => {
  currentPage.value = 1
})

function handleSort(patch: { sortBy: UserSortKey, sortOrder: UserSortOrder }) {
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
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchUsers()
  fetchRoles()
})

function openCreate() {
  editingUser.value = null
  showFormDialog.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  showFormDialog.value = true
}

function openDelete(user: User) {
  deletingUser.value = user
  showDeleteDialog.value = true
}

async function handleFormSubmit(values: UserFormValues) {
  submitting.value = true
  const email = values.email.trim() || undefined
  const ok = editingUser.value
    ? await updateUser(editingUser.value.id, {
        username: values.username,
        email,
        password: values.password || undefined,
        fullName: values.fullName,
        roleId: values.roleId,
        isActive: values.isActive,
      })
    : await createUser({
        username: values.username,
        email,
        password: values.password,
        fullName: values.fullName,
        roleId: values.roleId,
        isActive: values.isActive,
      } satisfies CreateUserInput)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingUser.value) return
  deleting.value = true
  const ok = await deleteUser(deletingUser.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">User Management</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">Manage users, roles, and permissions</p>
      </div>

      <button
        v-if="hasPermission('user.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add User
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="roleFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Roles</option>
        <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
      </select>

      <select
        v-model="priorityFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Priorities</option>
        <option :value="4">High</option>
        <option :value="6">Medium</option>
        <option :value="8">Low</option>
      </select>

      <select
        v-model="statusFilter"
        class="rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F1F52] outline-none transition-colors focus:border-[#01ADEF]"
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <UsersTable
      :items="paginatedItems"
      :loading="loading"
      :roles="roles"
      :sort-by="sort.key"
      :sort-order="sort.order"
      @edit="openEdit"
      @delete="openDelete"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="currentPage"
      :total-pages="totalPages"
      :total="sortedItems.length"
      :limit="pageSize"
      item-label="users"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <UsersFormDialog
      v-model="showFormDialog"
      :user="editingUser"
      :roles="roles"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <UsersDeleteDialog
      v-model="showDeleteDialog"
      :user="deletingUser"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
