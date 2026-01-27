export interface RawMaterialEntry {
  id: string
  date: Date
  supplier: string
  type: string
  quantity: number
  unit: string
  notes?: string
  factoryId?: string
  createdAt?: Date
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
  factoryId?: string
  createdAt?: Date
}

export interface ShippingEntry {
  id: string
  date: Date
  client: string
  product: 'Sebo' | 'FCO' | 'Farinheta' | 'Matéria-Prima'
  quantity: number
  unitPrice: number
  docRef: string
  factoryId?: string
  createdAt?: Date
}

export interface AcidityEntry {
  id: string
  date: Date
  time: string
  responsible: string
  weight: number
  volume: number
  acidity: number
  tank: string
  performedTimes: string
  notes?: string
  factoryId?: string
  createdAt?: Date
}

export interface QualityEntry {
  id: string
  date: Date
  product: 'Farinha' | 'Farinheta'
  acidity: number
  protein: number
  responsible: string
  notes?: string
  factoryId?: string
  createdAt?: Date
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

export interface YieldTargets {
  sebo: number
  fco: number
  farinheta: number
  total: number
}

export type UserRole = 'Administrator' | 'Manager' | 'Operator'

export interface UserAccessEntry {
  id: string
  name: string
  role: UserRole
  createdAt: Date
}

export interface ProtheusConfig {
  id?: string
  baseUrl: string
  clientId: string
  clientSecret: string
  username: string
  password: string
  syncInventory: boolean
  syncProduction: boolean
  isActive: boolean
}

export interface NotificationSettings {
  id?: string
  emailEnabled: boolean
  smsEnabled: boolean
  yieldThreshold: number
  seboThreshold: number
  farinhetaThreshold: number
  farinhaThreshold: number
  fcoThreshold?: number
  notificationEmail: string
  notificationPhone: string
  brevoApiKey?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
}

export interface Factory {
  id: string
  name: string
  location: string
  manager: string
  status: 'active' | 'inactive'
  createdAt: Date
}

export type ConnectionStatus =
  | 'online'
  | 'offline'
  | 'syncing'
  | 'error'
  | 'pending'

export interface SyncOperation {
  id: string
  type: 'ADD' | 'UPDATE' | 'DELETE'
  collection: string
  endpoint: string | null
  data: any
  entityId: string
  timestamp: number
  retryCount?: number
}

export interface DataContextType {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  acidityRecords: AcidityEntry[]
  qualityRecords: QualityEntry[]

  addRawMaterial: (entry: Omit<RawMaterialEntry, 'id'>) => void
  bulkAddRawMaterials: (
    entries: Omit<RawMaterialEntry, 'id'>[],
  ) => Promise<void>
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

  addQualityRecord: (entry: Omit<QualityEntry, 'id'>) => void
  updateQualityRecord: (entry: QualityEntry) => void
  deleteQualityRecord: (id: string) => void

  userAccessList: UserAccessEntry[]
  addUserAccess: (entry: Omit<UserAccessEntry, 'id'>) => void
  updateUserAccess: (entry: UserAccessEntry) => void
  deleteUserAccess: (id: string) => void

  currentUser: UserAccessEntry | null
  login: (userId: string) => void
  checkPermission: (permission: string) => boolean

  factories: Factory[]
  addFactory: (entry: Omit<Factory, 'id' | 'createdAt'>) => void
  updateFactory: (entry: Factory) => void
  deleteFactory: (id: string) => void
  currentFactoryId: string
  setCurrentFactoryId: (id: string) => void

  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  isDeveloperMode: boolean
  toggleDeveloperMode: () => void
  isViewerMode: boolean
  setViewerMode: (value: boolean) => void

  systemSettings: SystemSettings
  updateSystemSettings: (settings: SystemSettings) => void

  yieldTargets: YieldTargets
  updateYieldTargets: (targets: YieldTargets) => void

  protheusConfig: ProtheusConfig
  updateProtheusConfig: (config: ProtheusConfig) => void
  testProtheusConnection: () => Promise<{ success: boolean; message: string }>
  lastProtheusSync: Date | null
  syncProtheusData: () => Promise<void>
  refreshOperationalData: () => Promise<void>

  notificationSettings: NotificationSettings
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>

  connectionStatus: ConnectionStatus
  pendingOperationsCount: number

  clearAllData: () => Promise<void>
}
