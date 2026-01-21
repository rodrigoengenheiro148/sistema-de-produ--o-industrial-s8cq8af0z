import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
} from '@/lib/types'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

const DataContext = createContext<DataContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SystemSettings = {
  productionGoal: 50000,
  maxLossThreshold: 1500,
  refreshRate: 10, // Increased default to avoid spamming
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

const MOCK_RAW_MATERIALS: RawMaterialEntry[] = [
  {
    id: '1',
    date: subDays(new Date(), 5),
    supplier: 'Frigorífico Boi Gordo',
    type: 'Ossos',
    quantity: 15000,
    notes: 'Entrega padrão',
  },
]
const MOCK_PRODUCTION: ProductionEntry[] = [
  {
    id: '1',
    date: subDays(new Date(), 5),
    shift: 'Manhã',
    mpUsed: 14000,
    seboProduced: 4200,
    fcoProduced: 7000,
    farinhetaProduced: 1400,
    losses: 1400,
  },
]
const MOCK_SHIPPING: ShippingEntry[] = []
const MOCK_ACIDITY: AcidityEntry[] = []
const MOCK_QUALITY: QualityEntry[] = []
const MOCK_USER_ACCESS: UserAccessEntry[] = [
  {
    id: '1',
    name: 'Admin',
    role: 'Admin',
    permissions: {
      editProduction: true,
      deleteHistory: true,
      modifyConstants: true,
    },
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
  DEV_MODE: 'spi_dev_mode',
  SETTINGS: 'spi_settings',
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

const parseDatesInArray = (arr: any[]) =>
  arr.map((item) => {
    const newItem = { ...item }
    if (newItem.date) newItem.date = new Date(newItem.date)
    if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt)
    return newItem
  })

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
  const { toast } = useToast()

  // State Initialization
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

  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() =>
    getStorageData(STORAGE_KEYS.DEV_MODE, false),
  )
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    getStorageData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
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

  // API Interaction
  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      // Validate configuration before attempting fetch
      if (!protheusConfig.isActive) return null
      if (!protheusConfig.baseUrl) throw new Error('Base URL not configured')

      const auth = btoa(`${protheusConfig.username}:${protheusConfig.password}`)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        ...options.headers,
      }

      // Ensure clean URL construction
      const baseUrl = protheusConfig.baseUrl.replace(/\/$/, '')
      const cleanEndpoint = endpoint.replace(/^\//, '')
      const url = `${baseUrl}/${cleanEndpoint}`

      try {
        const response = await fetch(url, { ...options, headers })

        if (response.status === 405) {
          throw new Error('Method Not Allowed (405). Verifique a URL da API.')
        }

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`,
          )
        }

        // Handle 204 No Content
        if (response.status === 204) return null

        return await response.json()
      } catch (error) {
        console.error('API Fetch Error:', error)
        throw error
      }
    },
    [protheusConfig],
  )

  // Queue Processing - Improved Reliability
  const processSyncQueue = useCallback(async () => {
    // If not active, or queue empty, considered "success" (idle)
    if (!protheusConfig.isActive) {
      if (pendingOperations.length > 0) setConnectionStatus('pending')
      return true
    }

    // If active but offline, set pending
    if (!navigator.onLine) {
      setConnectionStatus('pending')
      return false
    }

    // If active but no URL, set error (don't clear queue)
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
    const maxRetries = 3

    // Process one by one to ensure order
    // We only remove from queue if successful
    // We break loop on first error to maintain sequence integrity
    const op = remainingOps[0] // Peek first

    try {
      if (op.endpoint) {
        const method =
          op.type === 'ADD' ? 'POST' : op.type === 'UPDATE' ? 'PUT' : 'DELETE'

        // Construct entity specific URL
        const endpointUrl =
          op.type === 'ADD' ? op.endpoint : `${op.endpoint}/${op.entityId}`

        const res = await apiFetch(endpointUrl, {
          method,
          body: op.type !== 'DELETE' ? JSON.stringify(op.data) : undefined,
        })

        // On successful ADD, we might get a real ID from backend
        // In a real app, we would update local ID, but for this simulation we just proceed
      }

      // Remove successful operation
      remainingOps.shift()
      setPendingOperations(remainingOps)
      setStorageData(STORAGE_KEYS.PENDING_SYNC, remainingOps)

      // Recursively process next if any (with small delay to not choke JS event loop)
      if (remainingOps.length > 0) {
        setTimeout(() => processSyncQueue(), 50)
      } else {
        setConnectionStatus('online')
      }
    } catch (e) {
      console.error('Sync failed for op:', op.id, e)
      success = false
      setConnectionStatus('error')
      // We do NOT remove the op, so it retries later
    }

    return success
  }, [pendingOperations, protheusConfig, apiFetch])

  // Core Sync (Pull Data)
  const syncProtheusData = useCallback(async () => {
    if (!protheusConfig.isActive || !protheusConfig.baseUrl) return
    if (!navigator.onLine) {
      setConnectionStatus('offline')
      return
    }

    // Process queue first (Push)
    // We only fetch if queue is empty to avoid overwriting local changes that haven't been pushed
    if (pendingOperations.length > 0) {
      const queueProcessed = await processSyncQueue()
      if (!queueProcessed) return
    }

    setConnectionStatus('syncing')
    try {
      const endpoints = [
        apiFetch('raw-materials'),
        apiFetch('production'),
        apiFetch('shipping'),
        apiFetch('acidity'),
        apiFetch('factories'),
      ]

      const [raw, prod, ship, acid, fact] = await Promise.all(endpoints)

      if (raw)
        setRawMaterials(
          (d) => (
            setStorageData(STORAGE_KEYS.RAW_MATERIALS, parseDatesInArray(raw)),
            parseDatesInArray(raw)
          ),
        )
      if (prod)
        setProduction(
          (d) => (
            setStorageData(STORAGE_KEYS.PRODUCTION, parseDatesInArray(prod)),
            parseDatesInArray(prod)
          ),
        )
      if (ship)
        setShipping(
          (d) => (
            setStorageData(STORAGE_KEYS.SHIPPING, parseDatesInArray(ship)),
            parseDatesInArray(ship)
          ),
        )
      if (acid)
        setAcidityRecords(
          (d) => (
            setStorageData(STORAGE_KEYS.ACIDITY, parseDatesInArray(acid)),
            parseDatesInArray(acid)
          ),
        )
      if (fact)
        setFactories(
          (d) => (
            setStorageData(STORAGE_KEYS.FACTORIES, parseDatesInArray(fact)),
            parseDatesInArray(fact)
          ),
        )

      setLastProtheusSync(new Date())
      setStorageData(STORAGE_KEYS.LAST_SYNC, new Date())
      setConnectionStatus('online')
    } catch (error) {
      console.error('Sync Pull Error:', error)
      setConnectionStatus('error')
    }
  }, [protheusConfig, apiFetch, pendingOperations.length, processSyncQueue])

  // Lifecycle & Polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncProtheusData()
    }
    const handleOnline = () => {
      // Trigger sync when coming back online
      processSyncQueue().then(() => syncProtheusData())
    }
    const handleOffline = () => setConnectionStatus('offline')

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial Sync
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

  // CRUD Generator with Queue
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
          }
        }
        setStorageData(key, newData)
        return newData
      })

      // Queue Management logic
      if (endpoint) {
        setPendingOperations((prev) => {
          const updated = [...prev, newOp!]
          setStorageData(STORAGE_KEYS.PENDING_SYNC, updated)
          return updated
        })

        // Optimistically set status, actual processing happens via side effect or immediate call
        setConnectionStatus('pending')

        // Try to process immediately if online and active
        if (navigator.onLine && protheusConfig.isActive) {
          // Use setTimeout to allow state update to settle
          setTimeout(() => processSyncQueue(), 0)
        }
      }
    }

  const testProtheusConnection = async () => {
    try {
      if (!protheusConfig.baseUrl) throw new Error('URL base não configurada')
      await apiFetch('factories') // Simple fetch to test auth
      return { success: true, message: 'Conexão OK' }
    } catch (e: any) {
      return { success: false, message: e.message || 'Falha na conexão' }
    }
  }

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        addRawMaterial: createAction(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
          'ADD',
        ),
        updateRawMaterial: createAction(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
          'UPDATE',
        ),
        deleteRawMaterial: createAction(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
          'DELETE',
        ),

        production,
        addProduction: createAction(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
          'ADD',
        ),
        updateProduction: createAction(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
          'UPDATE',
        ),
        deleteProduction: createAction(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
          'DELETE',
        ),

        shipping,
        addShipping: createAction(
          STORAGE_KEYS.SHIPPING,
          'shipping',
          setShipping,
          'ADD',
        ),
        updateShipping: createAction(
          STORAGE_KEYS.SHIPPING,
          'shipping',
          setShipping,
          'UPDATE',
        ),
        deleteShipping: createAction(
          STORAGE_KEYS.SHIPPING,
          'shipping',
          setShipping,
          'DELETE',
        ),

        acidityRecords,
        addAcidityRecord: createAction(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
          'ADD',
        ),
        updateAcidityRecord: createAction(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
          'UPDATE',
        ),
        deleteAcidityRecord: createAction(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
          'DELETE',
        ),

        qualityRecords,
        addQualityRecord: createAction(
          STORAGE_KEYS.QUALITY,
          'quality', // Added endpoint for syncing quality
          setQualityRecords,
          'ADD',
        ),
        updateQualityRecord: createAction(
          STORAGE_KEYS.QUALITY,
          'quality',
          setQualityRecords,
          'UPDATE',
        ),
        deleteQualityRecord: createAction(
          STORAGE_KEYS.QUALITY,
          'quality',
          setQualityRecords,
          'DELETE',
        ),

        userAccessList,
        addUserAccess: createAction(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
          'ADD',
        ),
        updateUserAccess: createAction(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
          'UPDATE',
        ),
        deleteUserAccess: createAction(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
          'DELETE',
        ),

        factories,
        addFactory: createAction(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
          'ADD',
        ),
        updateFactory: createAction(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
          'UPDATE',
        ),
        deleteFactory: createAction(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
          'DELETE',
        ),

        currentFactoryId,
        setCurrentFactoryId: (id) => {
          setCurrentFactoryId(id)
          setStorageData(STORAGE_KEYS.CURRENT_FACTORY, id)
        },

        dateRange,
        setDateRange,
        isDeveloperMode,
        toggleDeveloperMode: () => {
          setIsDeveloperMode((p) => {
            setStorageData(STORAGE_KEYS.DEV_MODE, !p)
            return !p
          })
        },
        systemSettings,
        updateSystemSettings: (s) => {
          setSystemSettings(s)
          setStorageData(STORAGE_KEYS.SETTINGS, s)
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
        clearAllData: () => {
          setRawMaterials([])
          setProduction([])
          setShipping([])
          setAcidityRecords([])
          setQualityRecords([])
          setPendingOperations([])
          localStorage.clear()
        },
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
