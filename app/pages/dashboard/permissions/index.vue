<script setup lang="ts">
import { Plus, RefreshCw } from 'lucide-vue-next'
import type { PermissionSortKey, PermissionSortOrder } from '~/components/permissions/Table.vue'
import type { CreatePermissionInput, Permission } from '~/types/permission'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Permissions — Misel' })

const { hasPermission } = useAuth()
const { items, loading, search, fetchPermissions, createPermission, updatePermission, deletePermission } =
  usePermissions()

const sort = ref<{ key: PermissionSortKey, order: PermissionSortOrder }>({ key: 'code', order: 'asc' })
const currentPage = ref(1)
const pageSize = ref(10)

const CLIENT_SORT_ACCESSORS: Record<PermissionSortKey, (item: Permission) => string> = {
  code: item => item.code.toLowerCase(),
  name: item => item.name.toLowerCase(),
  description: item => (item.description ?? '').toLowerCase(),
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

watch(search, () => {
  currentPage.value = 1
})

function handleSort(patch: { sortBy: PermissionSortKey, sortOrder: PermissionSortOrder }) {
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
const editingPermission = ref<Permission | null>(null)
const deletingPermission = ref<Permission | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchPermissions()
})

function openCreate() {
  editingPermission.value = null
  showFormDialog.value = true
}

function openEdit(permission: Permission) {
  editingPermission.value = permission
  showFormDialog.value = true
}

function openDelete(permission: Permission) {
  deletingPermission.value = permission
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreatePermissionInput) {
  submitting.value = true
  const ok = editingPermission.value
    ? await updatePermission(editingPermission.value.id, input)
    : await createPermission(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingPermission.value) return
  deleting.value = true
  const ok = await deletePermission(deletingPermission.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52] dark:text-[#F8FAFC]">Permissions</h1>
        <p class="font-medium mt-1 text-sm text-slate-500 dark:text-slate-400">Manage fine-grained access control codes</p>
      </div>

      <button
        v-if="hasPermission('permission.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Permission
      </button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="w-full min-w-[200px] flex-1 sm:max-w-xs">
        <UiBaseInput v-model="search" placeholder="Search by code, name, or description..." />
      </div>

      <button
        type="button"
        class="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#0F1F52] dark:text-[#F8FAFC] transition-colors hover:border-slate-300 dark:hover:border-slate-600"
        @click="fetchPermissions()"
      >
        <RefreshCw class="h-4 w-4 text-slate-400" />
        Refresh
      </button>
    </div>

    <PermissionsTable
      :items="paginatedItems"
      :loading="loading"
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
      item-label="permissions"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <PermissionsFormDialog
      v-model="showFormDialog"
      :permission="editingPermission"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <PermissionsDeleteDialog
      v-model="showDeleteDialog"
      :permission="deletingPermission"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
