export interface AdminProfile {
  id: string
  email: string
  role: 'admin'
  createdAt: string
}

export interface AdminStats {
  totalModels: number
  totalUsers: number
  proUsers: number
  freeUsers: number
  todayNewUsers: number
  categoryDistribution: Record<string, number>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
