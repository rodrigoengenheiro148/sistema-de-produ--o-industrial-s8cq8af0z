import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import {
  RawMaterialEntry,
  ProductionEntry,
  ShippingEntry,
  AcidityEntry,
  QualityEntry,
  DateRange,
  DataContextType,
  SystemSettings,
  UserAccessEntry,
  ProtheusConfig,
  Factory,
  ConnectionStatus,
  SyncOperation,
  YieldTargets,
} from '@/lib/types'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

const DataContext = createContext<DataContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SystemSettings = {
  productionGoal: 50000,
  maxLossThreshold: 1500,
  refreshRate: 5,
}

const DEFAULT_YIELD_TARGETS: YieldTargets = {
  sebo: 28,
  fco: 26,
  farinheta: 3.5,
  total: 58,
}

const DEFAULT_PROTHEUS_CONFIG: ProtheusConfig = {
  baseUrl: '',
  clientId: '',
  clientSecret: '',
  username: '',
  password: '',
  syncInventory: false,
  syncProduction: false,
  isActive: false,
}

// Enhanced Mock Data for consistency
const MOCK_RAW_MATERIALS: RawMaterialEntry[] = Array.from({ length: 15 }).map(
  (_, i) => ({
    id: `rm-${i}`,
    date: subDays(new Date(), i),
    supplier: i % 2 === 0 ? 'Frigorífico Boi Gordo' : 'Agropecuária Silva',
    type: i % 3 === 0 ? 'Ossos' : 'Visceras',
    quantity: 25000 + Math.random() * 5000,
    unit: 'kg',
    notes: 'Recebimento padrão',
    createdAt: subDays(new Date(), i),
  }),
)

const MOCK_PRODUCTION: ProductionEntry[] = Array.from({ length: 15 }).map(
  (_, i) => {
    const mpUsed = 30000 + Math.random() * 2000
    return {
      id: `prod-${i}`,
      date: subDays(new Date(), i),
      shift: i % 2 === 0 ? 'Manhã' : 'Tarde',
      mpUsed: mpUsed,
      seboProduced: mpUsed * 0.28,
      fcoProduced: mpUsed * 0.26,
      farinhetaProduced: mpUsed * 0.035,
      losses: mpUsed * 0.02,
      createdAt: subDays(new Date(), i),
    }
  },
)

const MOCK_SHIPPING: ShippingEntry[] = Array.from({ length: 10 }).map(
  (_, i) => ({
    id: `ship-${i}`,
    date: subDays(new Date(), i),
    client: i % 2 === 0 ? 'PetFood Inc' : 'Sabões & Cia',
    product: i % 2 === 0 ? 'Farinheta' : 'Sebo',
    quantity: 10000 + Math.random() * 2000,
    unitPrice: i % 2 === 0 ? 2.5 : 4.5,
    docRef: `NF-${1000 + i}`,
    createdAt: subDays(new Date(), i),
  }),
)

const MOCK_ACIDITY: AcidityEntry[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `acid-${i}`,
  date: subDays(new Date(), Math.floor(i / 2)),
  time: i % 2 === 0 ? '08:00' : '14:00',
  responsible: 'João Silva',
  weight: 150 + Math.random() * 10,
  volume: 180 + Math.random() * 10,
  tank: `Tanque ${1 + (i % 3)}`,
  performedTimes: '1',
  createdAt: subDays(new Date(), Math.floor(i / 2)),
}))

const MOCK_QUALITY: QualityEntry[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `qual-${i}`,
  date: subDays(new Date(), i),
  product: i % 2 === 0 ? 'Farinha' : 'Farinheta',
  acidity: 2 + Math.random(),
  protein: 45 + Math.random() * 5,
  responsible: 'Maria Oliveira',
  createdAt: subDays(new Date(), i),
}))

const MOCK_USER_ACCESS: UserAccessEntry[] = [
  {
    id: '1',
    name: 'Rodrigo Gomes',
    role: 'Administrator',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Manager User',
    role: 'Manager',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Operator User',
    role: 'Operator',
    createdAt: new Date(),
  },
]

const MOCK_FACTORIES: Factory[] = [
  {
    id: '1',
    name: 'Matriz - São Paulo',
    location: 'São Paulo, SP',
    manager: 'Diretoria',
    status: 'active',
    createdAt: new Date(),
  },
]

const STORAGE_KEYS = {
  RAW_MATERIALS: 'spi_raw_materials',
  PRODUCTION: 'spi_production',
  SHIPPING: 'spi_shipping',
  ACIDITY: 'spi_acidity',
  QUALITY: 'spi_quality',
  CURRENT_USER_ID: 'spi_current_user_id',
  SETTINGS: 'spi_settings',
  YIELD_TARGETS: 'spi_yield_targets',
  USER_ACCESS: 'spi_user_access',
  PROTHEUS_CONFIG: 'spi_protheus_config',
  LAST_SYNC: 'spi_last_sync',
  FACTORIES: 'spi_factories',
  CURRENT_FACTORY: 'spi_current_factory',
  PENDING_SYNC: 'spi_pending_sync',
}

const dateTimeReviver = (key: string, value: any) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

const parseDatesInArray = (arr: any[]) => {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (!item) return item
    const newItem = { ...item }
    if (newItem.date && typeof newItem.date === 'string')
      newItem.date = new Date(newItem.date)
    if (newItem.createdAt && typeof newItem.createdAt === 'string')
      newItem.createdAt = new Date(newItem.createdAt)
    return newItem
  })
}

function mergeServerData<T extends { id: string }>(
  serverData: T[],
  pendingOps: SyncOperation[],
  collectionKey: string,
): T[] {
  const dataMap = new Map<string, T>()
  serverData.forEach((item) => dataMap.set(item.id, item))

  pendingOps.forEach((op) => {
    if (op.collection !== collectionKey) return

    if (op.type === 'ADD') {
      if (!dataMap.has(op.entityId)) {
        dataMap.set(op.entityId, op.data as T)
      }
    } else if (op.type === 'UPDATE') {
      const existing = dataMap.get(op.entityId)
      if (existing) {
        dataMap.set(op.entityId, { ...existing, ...op.data })
      }
    } else if (op.type === 'DELETE') {
      dataMap.delete(op.entityId)
    }
  })

  return Array.from(dataMap.values())
}

function getStorageData<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData
  try {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item, dateTimeReviver) as T) : defaultData
  } catch {
    return defaultData
  }
}

function setStorageData<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterialEntry[]>(() =>
    getStorageData(STORAGE_KEYS.RAW_MATERIALS, MOCK_RAW_MATERIALS),
  )
  const [production, setProduction] = useState<ProductionEntry[]>(() =>
    getStorageData(STORAGE_KEYS.PRODUCTION, MOCK_PRODUCTION),
  )
  const [shipping, setShipping] = useState<ShippingEntry[]>(() =>
    getStorageData(STORAGE_KEYS.SHIPPING, MOCK_SHIPPING),
  )
  const [acidityRecords, setAcidityRecords] = useState<AcidityEntry[]>(() =>
    getStorageData(STORAGE_KEYS.ACIDITY, MOCK_ACIDITY),
  )
  const [qualityRecords, setQualityRecords] = useState<QualityEntry[]>(() =>
    getStorageData(STORAGE_KEYS.QUALITY, MOCK_QUALITY),
  )
  const [userAccessList, setUserAccessList] = useState<UserAccessEntry[]>(() =>
    getStorageData(STORAGE_KEYS.USER_ACCESS, MOCK_USER_ACCESS),
  )
  const [factories, setFactories] = useState<Factory[]>(() =>
    getStorageData(STORAGE_KEYS.FACTORIES, MOCK_FACTORIES),
  )
  const [currentFactoryId, setCurrentFactoryId] = useState<string>(() =>
    getStorageData(STORAGE_KEYS.CURRENT_FACTORY, '1'),
  )

  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>(
    () => getStorageData(STORAGE_KEYS.PENDING_SYNC, []),
  )

  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    getStorageData(STORAGE_KEYS.CURRENT_USER_ID, '1'),
  )

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    getStorageData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  )
  const [yieldTargets, setYieldTargets] = useState<YieldTargets>(() =>
    getStorageData(STORAGE_KEYS.YIELD_TARGETS, DEFAULT_YIELD_TARGETS),
  )
  const [protheusConfig, setProtheusConfig] = useState<ProtheusConfig>(() =>
    getStorageData(STORAGE_KEYS.PROTHEUS_CONFIG, DEFAULT_PROTHEUS_CONFIG),
  )
  const [lastProtheusSync, setLastProtheusSync] = useState<Date | null>(() =>
    getStorageData(STORAGE_KEYS.LAST_SYNC, null),
  )
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'online' : 'offline',
  )

  // Load Config from URL (for sharing settings across devices)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const configParam = params.get('config')
    if (configParam) {
      try {
        const decoded = JSON.parse(atob(configParam))
        if (decoded && typeof decoded === 'object') {
          setProtheusConfig(decoded)
          setStorageData(STORAGE_KEYS.PROTHEUS_CONFIG, decoded)

          // Clean URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)

          // If a valid config is loaded, we should attempt to sync immediately
          if (decoded.isActive && decoded.baseUrl) {
            setConnectionStatus('syncing')
            setTimeout(() => {
              const event = new Event('online')
              window.dispatchEvent(event)
            }, 500)
          }
        }
      } catch (e) {
        console.error('Failed to parse config from URL', e)
      }
    }
  }, [])

  const currentUser = userAccessList.find((u) => u.id === currentUserId) || null
  const isDeveloperMode = currentUser?.role === 'Administrator'
  const isViewerMode = false

  const login = (userId: string) => {
    setCurrentUserId(userId)
    setStorageData(STORAGE_KEYS.CURRENT_USER_ID, userId)
  }

  const checkPermission = (permission: string) => true

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return

      switch (e.key) {
        case STORAGE_KEYS.RAW_MATERIALS:
          setRawMaterials(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.PRODUCTION:
          setProduction(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.SHIPPING:
          setShipping(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.ACIDITY:
          setAcidityRecords(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.QUALITY:
          setQualityRecords(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.YIELD_TARGETS:
          setYieldTargets(JSON.parse(e.newValue))
          break
        case STORAGE_KEYS.SETTINGS:
          setSystemSettings(JSON.parse(e.newValue))
          break
        case STORAGE_KEYS.FACTORIES:
          setFactories(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.CURRENT_FACTORY:
          setCurrentFactoryId(JSON.parse(e.newValue))
          break
        case STORAGE_KEYS.CURRENT_USER_ID:
          setCurrentUserId(JSON.parse(e.newValue))
          break
        case STORAGE_KEYS.PROTHEUS_CONFIG:
          setProtheusConfig(JSON.parse(e.newValue))
          break
        case STORAGE_KEYS.USER_ACCESS:
          setUserAccessList(JSON.parse(e.newValue, dateTimeReviver))
          break
        case STORAGE_KEYS.LAST_SYNC:
          setLastProtheusSync(new Date(JSON.parse(e.newValue)))
          break
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!protheusConfig.isActive) return null
      if (!protheusConfig.baseUrl) throw new Error('Base URL not configured')

      const auth = btoa(`${protheusConfig.username}:${protheusConfig.password}`)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        ...options.headers,
      }

      const baseUrl = protheusConfig.baseUrl.replace(/\/$/, '')
      const cleanEndpoint = endpoint.replace(/^\//, '')
      const url = `${baseUrl}/${cleanEndpoint}`

      const response = await fetch(url, { ...options, headers }).catch(
        (err) => {
          throw new Error(`Network Error: ${err.message}`)
        },
      )

      if (response.status === 204) return null

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      if (!response.ok && !isJson) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const text = await response.text()
      let data
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          if (!response.ok) {
            throw new Error(
              `API Error: ${response.status} ${response.statusText}`,
            )
          }
          throw new Error('Invalid API Response: Malformed JSON')
        }
      } else {
        data = null
      }

      if (!response.ok) {
        const errorMessage = data?.message || response.statusText
        throw new Error(`API Error: ${response.status} ${errorMessage}`)
      }

      return data
    },
    [protheusConfig],
  )

  const processSyncQueue = useCallback(async () => {
    if (!protheusConfig.isActive) {
      if (pendingOperations.length > 0) setConnectionStatus('pending')
      return true
    }

    if (!navigator.onLine) {
      setConnectionStatus('pending')
      return false
    }

    if (!protheusConfig.baseUrl) {
      setConnectionStatus('error')
      return false
    }

    if (pendingOperations.length === 0) {
      setConnectionStatus('online')
      return true
    }

    setConnectionStatus('syncing')
    let success = true
    const remainingOps = [...pendingOperations]

    const op = remainingOps[0]

    try {
      if (op.endpoint) {
        const method =
          op.type === 'ADD' ? 'POST' : op.type === 'UPDATE' ? 'PUT' : 'DELETE'

        const endpointUrl =
          op.type === 'ADD' ? op.endpoint : `${op.endpoint}/${op.entityId}`

        await apiFetch(endpointUrl, {
          method,
          body: op.type !== 'DELETE' ? JSON.stringify(op.data) : undefined,
        })
      }

      remainingOps.shift()
      setPendingOperations(remainingOps)
      setStorageData(STORAGE_KEYS.PENDING_SYNC, remainingOps)

      if (remainingOps.length > 0) {
        // Fast processing for immediate updates
        setTimeout(() => processSyncQueue(), 5)
      } else {
        setConnectionStatus('online')
      }
    } catch (e) {
      console.error('Sync failed for op:', op.id, e)
      success = false
      setConnectionStatus('error')

      const retries = (op.retryCount || 0) + 1
      if (retries > 5) {
        console.error('Max retries reached, discarding operation', op)
        remainingOps.shift()
      } else {
        remainingOps[0] = { ...op, retryCount: retries }
      }
      setPendingOperations(remainingOps)
      setStorageData(STORAGE_KEYS.PENDING_SYNC, remainingOps)
    }

    return success
  }, [pendingOperations, protheusConfig, apiFetch])

  const syncProtheusData = useCallback(async () => {
    if (!protheusConfig.isActive || !protheusConfig.baseUrl) return
    if (!navigator.onLine) {
      setConnectionStatus('offline')
      return
    }

    if (pendingOperations.length > 0) {
      await processSyncQueue()
    }

    setConnectionStatus('syncing')

    const safeFetch = async <T,>(promise: Promise<T>): Promise<T | null> => {
      try {
        return await promise
      } catch (err) {
        console.warn('Individual sync endpoint failed safely:', err)
        return null
      }
    }

    try {
      const results = await Promise.all([
        safeFetch(apiFetch('raw-materials')),
        safeFetch(apiFetch('production')),
        safeFetch(apiFetch('shipping')),
        safeFetch(apiFetch('acidity')),
        safeFetch(apiFetch('factories')),
      ])

      const [raw, prod, ship, acid, fact] = results
      const hasSuccess = results.some((r) => r !== null)

      if (!hasSuccess && results.length > 0) {
        setConnectionStatus('error')
        return
      }

      const updateStateWithMerge = <T extends { id: string }>(
        fetchedData: any[],
        storageKey: string,
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        collectionKey: string,
      ) => {
        if (fetchedData && Array.isArray(fetchedData)) {
          const parsed = parseDatesInArray(fetchedData)
          const merged = mergeServerData(
            parsed,
            pendingOperations,
            collectionKey,
          )
          setter(merged)
          setStorageData(storageKey, merged)
        }
      }

      updateStateWithMerge(
        raw,
        STORAGE_KEYS.RAW_MATERIALS,
        setRawMaterials,
        STORAGE_KEYS.RAW_MATERIALS,
      )
      updateStateWithMerge(
        prod,
        STORAGE_KEYS.PRODUCTION,
        setProduction,
        STORAGE_KEYS.PRODUCTION,
      )
      updateStateWithMerge(
        ship,
        STORAGE_KEYS.SHIPPING,
        setShipping,
        STORAGE_KEYS.SHIPPING,
      )
      updateStateWithMerge(
        acid,
        STORAGE_KEYS.ACIDITY,
        setAcidityRecords,
        STORAGE_KEYS.ACIDITY,
      )
      updateStateWithMerge(
        fact,
        STORAGE_KEYS.FACTORIES,
        setFactories,
        STORAGE_KEYS.FACTORIES,
      )

      setLastProtheusSync(new Date())
      setStorageData(STORAGE_KEYS.LAST_SYNC, new Date())
      setConnectionStatus('online')
    } catch (error) {
      console.error('Sync Pull Critical Error:', error)
      setConnectionStatus('error')
    }
  }, [protheusConfig, apiFetch, pendingOperations, processSyncQueue])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncProtheusData()
    }
    const handleOnline = () => {
      processSyncQueue().then(() => syncProtheusData())
    }
    const handleOffline = () => setConnectionStatus('offline')

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (protheusConfig.isActive && navigator.onLine) {
      syncProtheusData()
    } else if (!navigator.onLine) {
      setConnectionStatus('offline')
    }

    const intervalId = setInterval(() => {
      if (
        navigator.onLine &&
        document.visibilityState === 'visible' &&
        protheusConfig.isActive
      ) {
        syncProtheusData()
      }
    }, systemSettings.refreshRate * 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [
    syncProtheusData,
    systemSettings.refreshRate,
    protheusConfig.isActive,
    processSyncQueue,
  ])

  const createAction =
    <T extends { id: string }>(
      key: string,
      endpoint: string | null,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      type: 'ADD' | 'UPDATE' | 'DELETE',
    ) =>
    (entryOrId: any) => {
      let newOp: SyncOperation
      const timestamp = Date.now()

      setter((prev) => {
        let newData: T[] = []
        if (type === 'ADD') {
          const newEntry = {
            ...entryOrId,
            id: entryOrId.id || Math.random().toString(36).substring(7),
            createdAt: new Date(),
          } as T
          newData = [newEntry, ...prev]
          newOp = {
            id: Math.random().toString(36),
            type,
            collection: key,
            endpoint,
            data: newEntry,
            entityId: newEntry.id,
            timestamp,
            retryCount: 0,
          }
        } else if (type === 'UPDATE') {
          newData = prev.map((item) =>
            item.id === entryOrId.id ? { ...item, ...entryOrId } : item,
          )
          newOp = {
            id: Math.random().toString(36),
            type,
            collection: key,
            endpoint,
            data: entryOrId,
            entityId: entryOrId.id,
            timestamp,
            retryCount: 0,
          }
        } else {
          newData = prev.filter((item) => item.id !== entryOrId)
          newOp = {
            id: Math.random().toString(36),
            type,
            collection: key,
            endpoint,
            data: null,
            entityId: entryOrId,
            timestamp,
            retryCount: 0,
          }
        }
        setStorageData(key, newData)
        return newData
      })

      if (endpoint) {
        setPendingOperations((prev) => {
          const updated = [...prev, newOp!]
          setStorageData(STORAGE_KEYS.PENDING_SYNC, updated)
          return updated
        })
        setConnectionStatus('pending')
        if (navigator.onLine && protheusConfig.isActive) {
          setTimeout(() => processSyncQueue(), 0)
        }
      }
    }

  const testProtheusConnection = async () => {
    try {
      if (!protheusConfig.baseUrl) throw new Error('URL base não configurada')
      await apiFetch('factories')
      return { success: true, message: 'Conexão OK' }
    } catch (e: any) {
      return { success: false, message: e.message || 'Falha na conexão' }
    }
  }

  // Create actions separately to be able to use them inside clearAllData
  const addRawMaterial = createAction(
    STORAGE_KEYS.RAW_MATERIALS,
    'raw-materials',
    setRawMaterials,
    'ADD',
  )
  const updateRawMaterial = createAction(
    STORAGE_KEYS.RAW_MATERIALS,
    'raw-materials',
    setRawMaterials,
    'UPDATE',
  )
  const deleteRawMaterial = createAction(
    STORAGE_KEYS.RAW_MATERIALS,
    'raw-materials',
    setRawMaterials,
    'DELETE',
  )

  const addProduction = createAction(
    STORAGE_KEYS.PRODUCTION,
    'production',
    setProduction,
    'ADD',
  )
  const updateProduction = createAction(
    STORAGE_KEYS.PRODUCTION,
    'production',
    setProduction,
    'UPDATE',
  )
  const deleteProduction = createAction(
    STORAGE_KEYS.PRODUCTION,
    'production',
    setProduction,
    'DELETE',
  )

  const addShipping = createAction(
    STORAGE_KEYS.SHIPPING,
    'shipping',
    setShipping,
    'ADD',
  )
  const updateShipping = createAction(
    STORAGE_KEYS.SHIPPING,
    'shipping',
    setShipping,
    'UPDATE',
  )
  const deleteShipping = createAction(
    STORAGE_KEYS.SHIPPING,
    'shipping',
    setShipping,
    'DELETE',
  )

  const addAcidityRecord = createAction(
    STORAGE_KEYS.ACIDITY,
    'acidity',
    setAcidityRecords,
    'ADD',
  )
  const updateAcidityRecord = createAction(
    STORAGE_KEYS.ACIDITY,
    'acidity',
    setAcidityRecords,
    'UPDATE',
  )
  const deleteAcidityRecord = createAction(
    STORAGE_KEYS.ACIDITY,
    'acidity',
    setAcidityRecords,
    'DELETE',
  )

  const addQualityRecord = createAction(
    STORAGE_KEYS.QUALITY,
    'quality',
    setQualityRecords,
    'ADD',
  )
  const updateQualityRecord = createAction(
    STORAGE_KEYS.QUALITY,
    'quality',
    setQualityRecords,
    'UPDATE',
  )
  const deleteQualityRecord = createAction(
    STORAGE_KEYS.QUALITY,
    'quality',
    setQualityRecords,
    'DELETE',
  )

  const addUserAccess = createAction(
    STORAGE_KEYS.USER_ACCESS,
    'users',
    setUserAccessList,
    'ADD',
  )
  const updateUserAccess = createAction(
    STORAGE_KEYS.USER_ACCESS,
    'users',
    setUserAccessList,
    'UPDATE',
  )
  const deleteUserAccess = createAction(
    STORAGE_KEYS.USER_ACCESS,
    'users',
    setUserAccessList,
    'DELETE',
  )

  const addFactory = createAction(
    STORAGE_KEYS.FACTORIES,
    'factories',
    setFactories,
    'ADD',
  )
  const updateFactory = createAction(
    STORAGE_KEYS.FACTORIES,
    'factories',
    setFactories,
    'UPDATE',
  )
  const deleteFactory = createAction(
    STORAGE_KEYS.FACTORIES,
    'factories',
    setFactories,
    'DELETE',
  )

  const clearAllData = async () => {
    // Stop any pending operations to avoid conflict
    setPendingOperations([])
    setStorageData(STORAGE_KEYS.PENDING_SYNC, [])

    // If active connection, perform Global Wipe on Server first
    if (protheusConfig.isActive && protheusConfig.baseUrl && navigator.onLine) {
      console.log('Initiating Global Wipe of Server Data...')
      setConnectionStatus('syncing')

      const deleteCollection = async (items: any[], endpoint: string) => {
        // Create an array of delete promises
        const promises = items.map((item) => {
          if (!item.id) return Promise.resolve()
          return apiFetch(`${endpoint}/${item.id}`, { method: 'DELETE' }).catch(
            (e) => console.error(`Failed to delete ${endpoint}/${item.id}`, e),
          )
        })

        // Wait for all deletions to complete
        await Promise.all(promises)
      }

      try {
        await deleteCollection(rawMaterials, 'raw-materials')
        await deleteCollection(production, 'production')
        await deleteCollection(shipping, 'shipping')
        await deleteCollection(acidityRecords, 'acidity')
        // Factories might be shared master data, but "Master Data Wipe" was requested.
        await deleteCollection(factories, 'factories')

        // Also quality records if endpoint exists in mock
        await deleteCollection(qualityRecords, 'quality')
      } catch (error) {
        console.error('Global wipe failed partially', error)
        // Continue to local wipe regardless to ensure user gets a clean state
      }
    }

    // Local Wipe Mode (Offline/Legacy) - Reset everything to defaults
    setRawMaterials([])
    setProduction([])
    setShipping([])
    setAcidityRecords([])
    setQualityRecords([])
    setFactories([])
    setUserAccessList([])

    setSystemSettings(DEFAULT_SETTINGS)
    setYieldTargets(DEFAULT_YIELD_TARGETS)
    setProtheusConfig(DEFAULT_PROTHEUS_CONFIG)
    setLastProtheusSync(null)
    setConnectionStatus('online')

    // Clear Storage
    setStorageData(STORAGE_KEYS.RAW_MATERIALS, [])
    setStorageData(STORAGE_KEYS.PRODUCTION, [])
    setStorageData(STORAGE_KEYS.SHIPPING, [])
    setStorageData(STORAGE_KEYS.ACIDITY, [])
    setStorageData(STORAGE_KEYS.QUALITY, [])
    setStorageData(STORAGE_KEYS.USER_ACCESS, [])
    setStorageData(STORAGE_KEYS.FACTORIES, [])
    setStorageData(STORAGE_KEYS.PENDING_SYNC, [])

    setStorageData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    setStorageData(STORAGE_KEYS.YIELD_TARGETS, DEFAULT_YIELD_TARGETS)
    setStorageData(STORAGE_KEYS.PROTHEUS_CONFIG, DEFAULT_PROTHEUS_CONFIG)
    setStorageData(STORAGE_KEYS.LAST_SYNC, null)

    setCurrentFactoryId('1')
    setStorageData(STORAGE_KEYS.CURRENT_FACTORY, '1')
    setCurrentUserId('1')
    setStorageData(STORAGE_KEYS.CURRENT_USER_ID, '1')
  }

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        addRawMaterial,
        updateRawMaterial,
        deleteRawMaterial,

        production,
        addProduction,
        updateProduction,
        deleteProduction,

        shipping,
        addShipping,
        updateShipping,
        deleteShipping,

        acidityRecords,
        addAcidityRecord,
        updateAcidityRecord,
        deleteAcidityRecord,

        qualityRecords,
        addQualityRecord,
        updateQualityRecord,
        deleteQualityRecord,

        userAccessList,
        addUserAccess,
        updateUserAccess,
        deleteUserAccess,

        currentUser,
        login,
        checkPermission,

        factories,
        addFactory,
        updateFactory,
        deleteFactory,

        currentFactoryId,
        setCurrentFactoryId: (id) => {
          setCurrentFactoryId(id)
          setStorageData(STORAGE_KEYS.CURRENT_FACTORY, id)
        },

        dateRange,
        setDateRange,
        isDeveloperMode,
        toggleDeveloperMode: () => {},
        isViewerMode,
        setViewerMode: () => {},
        systemSettings,
        updateSystemSettings: (s) => {
          setSystemSettings(s)
          setStorageData(STORAGE_KEYS.SETTINGS, s)
        },
        yieldTargets,
        updateYieldTargets: (t) => {
          setYieldTargets(t)
          setStorageData(STORAGE_KEYS.YIELD_TARGETS, t)
        },
        protheusConfig,
        updateProtheusConfig: (c) => {
          setProtheusConfig(c)
          setStorageData(STORAGE_KEYS.PROTHEUS_CONFIG, c)
        },
        testProtheusConnection,
        lastProtheusSync,
        syncProtheusData,
        connectionStatus,
        pendingOperationsCount: pendingOperations.length,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within a DataProvider')
  return context
}
