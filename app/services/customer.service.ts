import type {
  Customer,
  CustomerListResult,
  CustomerQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '~/types/customer'

export async function fetchCustomers(
  query: CustomerQuery = {},
): Promise<CustomerListResult> {
  const { $http } = useNuxtApp()
  return (await $http.get('/customers', {
    params: query,
  })) as CustomerListResult
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { $http } = useNuxtApp()
  return (await $http.get(`/customers/${id}`)) as Customer
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const { $http } = useNuxtApp()
  return (await $http.post('/customers', input)) as Customer
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const { $http } = useNuxtApp()
  return (await $http.put(`/customers/${id}`, input)) as Customer
}

export async function deleteCustomer(id: string): Promise<null> {
  const { $http } = useNuxtApp()
  return (await $http.delete(`/customers/${id}`)) as null
}
