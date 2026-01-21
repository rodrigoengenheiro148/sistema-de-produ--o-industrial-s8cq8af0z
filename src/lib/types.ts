export interface RawMaterialEntry {
  id: string
  date: Date
  supplier: string
  type: string
  quantity: number
  notes?: string
}

export interface ProductionEntry {
  id: string
  date: Date
  shift: 'Manhã' | 'Tarde' | 'Noite'
  mpUsed: number
  seboProduced: number
  fcoProduced: number
  farinhetaProduced: number
  losses: number
}

export interface ShippingEntry {
  id: string
  date: Date
  client: string
  product: 'Sebo' | 'FCO' | 'Farinheta' | 'Matéria-Prima'
  quantity: number
  unitPrice: number
  docRef: string
}

export interface AcidityEntry {
  id: string
  date: Date
  time: string
  responsible: string
  weight: number
  volume: number
  tank: string
  performedTimes: string
  notes?: string
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface SystemSettings {
  productionGoal: number
  maxLossThreshold: number
  refreshRate: number
}

export interface AccessPermissions {
  editProduction: boolean
  deleteHistory: boolean
  modifyConstants: boolean
}

export interface UserAccessEntry {
  id: string
  name: string
  role: string
  permissions: AccessPermissions
  createdAt: Date
}

export interface DataContextType {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  acidityRecords: AcidityEntry[]

  addRawMaterial: (entry: Omit<RawMaterialEntry, 'id'>) => void
  updateRawMaterial: (entry: RawMaterialEntry) => void
  deleteRawMaterial: (id: string) => void

  addProduction: (entry: Omit<ProductionEntry, 'id'>) => void
  updateProduction: (entry: ProductionEntry) => void
  deleteProduction: (id: string) => void

  addShipping: (entry: Omit<ShippingEntry, 'id'>) => void
  updateShipping: (entry: ShippingEntry) => void
  deleteShipping: (id: string) => void

  addAcidityRecord: (entry: Omit<AcidityEntry, 'id'>) => void
  updateAcidityRecord: (entry: AcidityEntry) => void
  deleteAcidityRecord: (id: string) => void

  userAccessList: UserAccessEntry[]
  addUserAccess: (entry: Omit<UserAccessEntry, 'id'>) => void
  updateUserAccess: (entry: UserAccessEntry) => void
  deleteUserAccess: (id: string) => void

  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  isDeveloperMode: boolean
  toggleDeveloperMode: () => void

  systemSettings: SystemSettings
  updateSystemSettings: (settings: SystemSettings) => void

  clearAllData: () => void
}
