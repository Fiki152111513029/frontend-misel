export interface FactoryMap {
  id: string
  name: string
  /** The areaId Robots in this area use to talk to the AMR fleet API. Null on maps that predate this field. */
  areaNumber: number | null
  /** Null if this map has no floor-plan raster — some maps are topology-only. */
  imageUrl: string | null
  topologyUrl: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateFactoryMapInput {
  name: string
  areaNumber: number
  imageFile?: File
  topologyFile: File
}

export interface UpdateFactoryMapInput {
  name?: string
  areaNumber?: number
  imageFile?: File
  topologyFile?: File
}

export type FactoryMapSortBy = 'name' | 'createdAt'
export type FactoryMapSortOrder = 'asc' | 'desc'

export interface FactoryMapQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: FactoryMapSortBy
  sortOrder?: FactoryMapSortOrder
}

export interface FactoryMapListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FactoryMapListResult {
  items: FactoryMap[]
  meta: FactoryMapListMeta
}
