import { fetchProductionLineArea as fetchProductionLineAreaSvc } from '~/services/production-line-area.service'
import { ApiError } from '~/types/api'
import type {
  CreateProductionLineAreaInput,
  ProductionLineArea,
  ProductionLineAreaQuery,
  UpdateProductionLineAreaInput,
} from '~/types/production-line-area'

export function useProductionLineAreas() {
  const store = useProductionLineAreasStore()
  const toast = useToast()

  async function fetchProductionLineAreas(query?: Partial<ProductionLineAreaQuery>) {
    if (query) store.setFilters(query)
    try {
      await store.loadProductionLineAreas()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production line areas')
    }
  }

  async function fetchProductionLineArea(id: string) {
    try {
      return await fetchProductionLineAreaSvc(id)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to load production line area')
      return null
    }
  }

  async function createProductionLineArea(input: CreateProductionLineAreaInput) {
    try {
      await store.addProductionLineArea(input)
      toast.success('Production Line Area created successfully')
      await fetchProductionLineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create production line area')
      return false
    }
  }

  async function updateProductionLineArea(id: string, input: UpdateProductionLineAreaInput) {
    try {
      await store.editProductionLineArea(id, input)
      toast.success('Production Line Area updated successfully')
      await fetchProductionLineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update production line area')
      return false
    }
  }

  async function deleteProductionLineArea(id: string) {
    try {
      await store.removeProductionLineArea(id)
      toast.success('Production Line Area deleted successfully')
      await fetchProductionLineAreas()
      return true
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete production line area')
      return false
    }
  }

  async function reorderProductionLineAreas(reorderedItems: ProductionLineArea[]) {
    const previousItems = store.items
    const sortedOriginalOrders = [...previousItems].map((i) => i.order).sort((a, b) => a - b)

    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: sortedOriginalOrders[index],
    }))

    const payload = updatedItems
      .filter((item, index) => item.order !== reorderedItems[index]!.order)
      .map((item) => ({ id: item.id, order: item.order }))

    if (payload.length === 0) return true

    store.items = updatedItems

    try {
      await store.reorderProductionLineAreas(payload)
      return true
    } catch (e) {
      store.items = previousItems
      toast.error(e instanceof ApiError ? e.message : 'Failed to reorder production line areas')
      return false
    }
  }

  return {
    items: computed(() => store.items),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    filters: computed(() => store.filters),
    fetchProductionLineAreas,
    fetchProductionLineArea,
    createProductionLineArea,
    updateProductionLineArea,
    deleteProductionLineArea,
    reorderProductionLineAreas,
    setFilters: store.setFilters,
  }
}
