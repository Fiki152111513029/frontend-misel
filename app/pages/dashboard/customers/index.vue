<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import type { CustomerSortKey } from '~/components/customers/Table.vue'
import type {
  Customer,
  CreateCustomerInput,
} from '~/types/customer'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Customers — Misel' })

const { hasPermission } = useAuth()
const {
  items,
  meta,
  loading,
  filters,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  setFilters,
} = useCustomers()

const searchText = ref(filters.value.search ?? '')
const emitSearch = useDebounceFn(() => {
  setFilters({ search: searchText.value, page: 1 })
  fetchCustomers()
}, 400)
watch(searchText, emitSearch)

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingCustomer = ref<Customer | null>(null)
const deletingCustomer = ref<Customer | null>(null)
const submitting = ref(false)
const deleting = ref(false)

onMounted(() => {
  fetchCustomers()
})

function openCreate() {
  editingCustomer.value = null
  showFormDialog.value = true
}

function openEdit(customer: Customer) {
  editingCustomer.value = customer
  showFormDialog.value = true
}

function openDelete(customer: Customer) {
  deletingCustomer.value = customer
  showDeleteDialog.value = true
}

async function handleFormSubmit(input: CreateCustomerInput) {
  submitting.value = true
  const ok = editingCustomer.value
    ? await updateCustomer(editingCustomer.value.id, input)
    : await createCustomer(input)
  submitting.value = false
  if (ok) showFormDialog.value = false
}

async function handleDeleteConfirm() {
  if (!deletingCustomer.value) return
  deleting.value = true
  const ok = await deleteCustomer(deletingCustomer.value.id)
  deleting.value = false
  if (ok) showDeleteDialog.value = false
}

function handleSort(patch: { sortBy: CustomerSortKey, sortOrder: 'asc' | 'desc' }) {
  setFilters({ ...patch, page: 1 })
  fetchCustomers()
}

function goToPage(page: number) {
  setFilters({ page })
  fetchCustomers()
}

function handleLimitChange(limit: number) {
  setFilters({ limit, page: 1 })
  fetchCustomers()
}
</script>

<template>
  <div class="animate-fade-in">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-[#0F1F52]">Customers</h1>
        <p class="font-medium mt-1 text-sm text-slate-500">View and manage all Customers</p>
      </div>

      <button
        v-if="hasPermission('customer.create')"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2F6FED] to-[#1D4FD8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#2660D9] hover:to-[#173FB0]"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Customer
      </button>
    </div>

    <div class="mb-4 w-full min-w-[200px] sm:max-w-xs">
      <UiBaseInput v-model="searchText" placeholder="Search by name..." />
    </div>

    <CustomersTable
      :items="items"
      :loading="loading"
      :sort-by="(filters.sortBy as CustomerSortKey)"
      :sort-order="filters.sortOrder"
      @edit="openEdit"
      @delete="openDelete"
      @sort="handleSort"
    />

    <UiBasePagination
      class="mt-4"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total="meta.total"
      :limit="meta.limit"
      item-label="customers"
      @update:page="goToPage"
      @update:limit="handleLimitChange"
    />

    <CustomersFormDialog
      v-model="showFormDialog"
      :customer="editingCustomer"
      :submitting="submitting"
      @submit="handleFormSubmit"
      @cancel="showFormDialog = false"
    />

    <CustomersDeleteDialog
      v-model="showDeleteDialog"
      :customer="deletingCustomer"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
