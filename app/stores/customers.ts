import * as customerService from '~/services/customer.service'
import { ApiError } from '~/types/api'
import type {
  Customer,
  CustomerListMeta,
  CustomerQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '~/types/customer'

export const useCustomersStore = defineStore('customers', () => {
  const items = ref<Customer[]>([])
  const meta = ref<CustomerListMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<CustomerQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  })

  async function loadCustomers() {
    loading.value = true
    error.value = null
    try {
      const result = await customerService.fetchCustomers(filters.value)
      items.value = result.items
      meta.value = result.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'Failed to load customers'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addCustomer(input: CreateCustomerInput) {
    return customerService.createCustomer(input)
  }

  async function editCustomer(id: string, input: UpdateCustomerInput) {
    return customerService.updateCustomer(id, input)
  }

  async function removeCustomer(id: string) {
    return customerService.deleteCustomer(id)
  }

  function setFilters(patch: Partial<CustomerQuery>) {
    filters.value = { ...filters.value, ...patch }
  }

  return {
    items,
    meta,
    loading,
    error,
    filters,
    loadCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
    setFilters,
  }
})
