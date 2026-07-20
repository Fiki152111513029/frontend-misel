import { fetchProductionLine as fetchProductionLineSvc } from '~/services/production-line.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLineInput,
  ProductionLineQuery,
  UpdateProductionLineInput,
} from '~/types/production-line'

export function useProductionLines() {
  const store = useProductionLinesStore()
  const toast = useToast()

  async function fetchProductionLines(query?: Partial<ProductionLineQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadProductionLines()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production lines')
    }
  }

  async function fetchProductionLine(id: string) {
    try {
      return await fetchProductionLineSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production line')
      return null
    }
  }

  async function createProductionLine(input: CreateProductionLineInput) {
    try {
      await store.addProductionLine(input)
      toast.success('Production Line created successfully')
      await fetchProductionLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create production line')
      return false
    }
  }

  async function updateProductionLine(id: string, input: UpdateProductionLineInput) {
    try {
      await store.editProductionLine(id, input)
      toast.success('Production Line updated successfully')
      await fetchProductionLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update production line')
      return false
    }
  }

  async function deleteProductionLine(id: string) {
    try {
      await store.removeProductionLine(id)
      toast.success('Production Line deleted successfully')
      await fetchProductionLines()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete production line')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchProductionLines,
    fetchProductionLine,
    createProductionLine,
    updateProductionLine,
    deleteProductionLine,
    setFilters: store.setFilters,
  }
}
