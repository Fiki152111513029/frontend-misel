import { fetchCustomer as fetchCustomerSvc } from '~/services/customer.service'
import { ApiError } from '~/types/api'
import type {
  CustomerQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '~/types/customer'

export function useCustomers() {
  const store = useCustomersStore()
  const toast = useToast()

  async function fetchCustomers(query?: Partial<CustomerQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadCustomers()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load customers')
    }
  }

  async function fetchCustomer(id: string) {
    try {
      return await fetchCustomerSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load customer')
      return null
    }
  }

  async function createCustomer(input: CreateCustomerInput) {
    try {
      await store.addCustomer(input)
      toast.success('Customer created successfully')
      await fetchCustomers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create customer')
      return false
    }
  }

  async function updateCustomer(id: string, input: UpdateCustomerInput) {
    try {
      await store.editCustomer(id, input)
      toast.success('Customer updated successfully')
      await fetchCustomers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update customer')
      return false
    }
  }

  async function deleteCustomer(id: string) {
    try {
      await store.removeCustomer(id)
      toast.success('Customer deleted successfully')
      await fetchCustomers()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete customer')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    setFilters: store.setFilters,
  }
}
