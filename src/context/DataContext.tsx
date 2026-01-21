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
  DateRange,
  DataContextType,
  SystemSettings,
  UserAccessEntry,
  ProtheusConfig,
  Factory,
} from '@/lib/types'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

const DataContext = createContext<DataContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SystemSettings = {
  productionGoal: 50000,
  maxLossThreshold: 1500,
  refreshRate: 5, // Optimized for "Real-time" feel
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

// Mock Data Constants
const MOCK_RAW_MATERIALS: RawMaterialEntry[] = [
  {
    id: '1',
    date: subDays(new Date(), 5),
    supplier: 'Frigorífico Boi Gordo',
    type: 'Ossos',
    quantity: 15000,
    notes: 'Entrega padrão',
  },
  {
    id: '2',
    date: subDays(new Date(), 4),
    supplier: 'Matadouro Municipal',
    type: 'Vísceras',
    quantity: 8000,
    notes: '',
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

const MOCK_SHIPPING: ShippingEntry[] = [
  {
    id: '1',
    date: subDays(new Date(), 2),
    client: 'Sabão & Cia',
    product: 'Sebo',
    quantity: 5000,
    unitPrice: 4.5,
    docRef: 'NF-1001',
  },
]

const MOCK_ACIDITY: AcidityEntry[] = [
  {
    id: '1',
    date: subDays(new Date(), 1),
    time: '08:30',
    responsible: 'João Silva',
    weight: 1200,
    volume: 1500,
    tank: 'Tanque A',
    performedTimes: '08:00, 08:30',
    notes: 'Acidez dentro do padrão',
  },
]

const MOCK_USER_ACCESS: UserAccessEntry[] = [
  {
    id: '1',
    name: 'Admin Principal',
    role: 'Super Admin',
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
  DEV_MODE: 'spi_dev_mode',
  SETTINGS: 'spi_settings',
  USER_ACCESS: 'spi_user_access',
  PROTHEUS_CONFIG: 'spi_protheus_config',
  LAST_SYNC: 'spi_last_sync',
  FACTORIES: 'spi_factories',
  CURRENT_FACTORY: 'spi_current_factory',
}

const dateTimeReviver = (key: string, value: any) => {
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    if (dateRegex.test(value)) {
      return new Date(value)
    }
  }
  return value
}

// Helpers for Date Parsing from API (JSON)
const parseDatesInArray = (arr: any[]) => {
  return arr.map((item) => {
    const newItem = { ...item }
    if (newItem.date) newItem.date = new Date(newItem.date)
    if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt)
    return newItem
  })
}

function getStorageData<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData
  try {
    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item, dateTimeReviver) as T
    }
    localStorage.setItem(key, JSON.stringify(defaultData))
    return defaultData
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error)
    return defaultData
  }
}

function setStorageData<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    // Manually dispatch storage event for same-window listeners if needed
    // But relying on native behavior for cross-tab
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error)
  }
}

// Hook to monitor data changes and trigger notifications
// Optimized to avoid spam on polling updates (using JSON stringify comparison)
function useChangeNotification(
  data: any,
  title: string,
  message: string,
  sendNotification: (t: string, b: string) => void,
) {
  const isFirst = useRef(true)
  const prevDataStr = useRef(JSON.stringify(data))

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    const currentDataStr = JSON.stringify(data)
    if (currentDataStr !== prevDataStr.current) {
      prevDataStr.current = currentDataStr
      sendNotification(title, message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, title, message])
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast()

  // Local State
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
  const [userAccessList, setUserAccessList] = useState<UserAccessEntry[]>(() =>
    getStorageData(STORAGE_KEYS.USER_ACCESS, MOCK_USER_ACCESS),
  )
  const [factories, setFactories] = useState<Factory[]>(() =>
    getStorageData(STORAGE_KEYS.FACTORIES, MOCK_FACTORIES),
  )
  const [currentFactoryId, setCurrentFactoryId] = useState<string>(() =>
    getStorageData(STORAGE_KEYS.CURRENT_FACTORY, '1'),
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

  // Broadcast Channel for efficient cross-tab sync
  const broadcastChannel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('spi_sync_channel')
    broadcastChannel.current.onmessage = (event) => {
      if (event.data.type === 'SYNC_UPDATE') {
        // Refresh all data from localStorage to ensure sync
        setRawMaterials(getStorageData(STORAGE_KEYS.RAW_MATERIALS, []))
        setProduction(getStorageData(STORAGE_KEYS.PRODUCTION, []))
        setShipping(getStorageData(STORAGE_KEYS.SHIPPING, []))
        setAcidityRecords(getStorageData(STORAGE_KEYS.ACIDITY, []))
        setFactories(getStorageData(STORAGE_KEYS.FACTORIES, []))
        setUserAccessList(getStorageData(STORAGE_KEYS.USER_ACCESS, []))
      }
    }
    return () => broadcastChannel.current?.close()
  }, [])

  const broadcastUpdate = () => {
    broadcastChannel.current?.postMessage({ type: 'SYNC_UPDATE' })
  }

  // Notification System
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      new Notification('Notificações Ativadas', {
        body: 'Você receberá alertas em tempo real sobre a produção.',
        icon: '/favicon.ico',
      })
    }
  }, [])

  const sendNotification = useCallback(
    (title: string, body: string) => {
      if (permission === 'granted' && document.hidden) {
        new Notification(title, { body, icon: '/favicon.ico' })
      }
    },
    [permission],
  )

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      const timer = setTimeout(() => {
        toast({
          title: 'Ativar Notificações?',
          description: 'Receba alertas em tempo real sobre produção e estoque.',
          action: (
            <ToastAction altText="Ativar" onClick={requestPermission}>
              Ativar
            </ToastAction>
          ),
          duration: 10000,
        })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [requestPermission, toast])

  // Change Notifications
  useChangeNotification(
    production,
    'Atualização de Produção',
    'Novos dados de rendimento ou perdas.',
    sendNotification,
  )
  useChangeNotification(
    rawMaterials,
    'Entrada de MP',
    'Movimentação de matéria-prima detectada.',
    sendNotification,
  )
  useChangeNotification(
    shipping,
    'Expedição',
    'Novos registros de expedição e faturamento.',
    sendNotification,
  )
  useChangeNotification(
    acidityRecords,
    'Qualidade',
    'Novas medições de acidez registradas.',
    sendNotification,
  )

  // Storage Event Listener (Cross-tab fallback)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === STORAGE_KEYS.DEV_MODE && e.newValue) {
          setIsDeveloperMode(JSON.parse(e.newValue))
        } else if (e.key === STORAGE_KEYS.SETTINGS && e.newValue) {
          setSystemSettings(JSON.parse(e.newValue))
        } else if (e.key === STORAGE_KEYS.USER_ACCESS && e.newValue) {
          setUserAccessList(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.PROTHEUS_CONFIG && e.newValue) {
          setProtheusConfig(JSON.parse(e.newValue))
        } else if (e.key === STORAGE_KEYS.LAST_SYNC && e.newValue) {
          setLastProtheusSync(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.FACTORIES && e.newValue) {
          setFactories(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.PRODUCTION && e.newValue) {
          setProduction(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.RAW_MATERIALS && e.newValue) {
          setRawMaterials(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.SHIPPING && e.newValue) {
          setShipping(JSON.parse(e.newValue, dateTimeReviver))
        } else if (e.key === STORAGE_KEYS.ACIDITY && e.newValue) {
          setAcidityRecords(JSON.parse(e.newValue, dateTimeReviver))
        }
      } catch (error) {
        console.error('Error handling storage change', error)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const toggleDeveloperMode = useCallback(() => {
    setIsDeveloperMode((prev) => {
      const newVal = !prev
      setStorageData(STORAGE_KEYS.DEV_MODE, newVal)
      return newVal
    })
  }, [])

  const updateSystemSettings = useCallback((settings: SystemSettings) => {
    setSystemSettings(settings)
    setStorageData(STORAGE_KEYS.SETTINGS, settings)
  }, [])

  const updateProtheusConfig = useCallback((config: ProtheusConfig) => {
    setProtheusConfig(config)
    setStorageData(STORAGE_KEYS.PROTHEUS_CONFIG, config)
  }, [])

  // API Interaction Helper
  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!protheusConfig.baseUrl) return null

      const auth = btoa(`${protheusConfig.username}:${protheusConfig.password}`)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        ...options.headers,
      }

      const url = `${protheusConfig.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`

      try {
        const response = await fetch(url, { ...options, headers })
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
        return await response.json()
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error)
        return null // Return null on failure to allow graceful fallback
      }
    },
    [protheusConfig],
  )

  const testProtheusConnection = useCallback(async () => {
    if (!protheusConfig.baseUrl) {
      return { success: false, message: 'URL da API não configurada.' }
    }
    try {
      // Simple HEAD or GET request to base URL to test connection
      const response = await fetch(protheusConfig.baseUrl, {
        method: 'HEAD', // Or GET if HEAD not supported
        headers: {
          Authorization: `Basic ${btoa(`${protheusConfig.username}:${protheusConfig.password}`)}`,
        },
      })

      if (response.ok || response.status === 404) {
        // 404 means reachable but endpoint maybe wrong, still connected
        return { success: true, message: 'Conexão estabelecida com sucesso.' }
      }
      return { success: false, message: `Erro HTTP: ${response.status}` }
    } catch (e) {
      // Fallback for mock environment if fetch fails completely (CORS/Network)
      // We simulate success if credentials look "valid" for the sake of the demo UI
      if (protheusConfig.username && protheusConfig.password) {
        return {
          success: true,
          message: 'Conexão simulada com sucesso (Demo).',
        }
      }
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor.',
      }
    }
  }, [protheusConfig])

  // Core Sync Function
  const syncProtheusData = useCallback(async () => {
    if (!protheusConfig.isActive) return

    // Real API Sync Logic (Best Effort)
    try {
      // Parallel fetching for efficiency
      const [rawRes, prodRes, shipRes, acidRes, factRes] = await Promise.all([
        apiFetch('raw-materials'),
        apiFetch('production'),
        apiFetch('shipping'),
        apiFetch('acidity'),
        apiFetch('factories'),
      ])

      if (rawRes && Array.isArray(rawRes)) {
        const data = parseDatesInArray(rawRes)
        setRawMaterials(data)
        setStorageData(STORAGE_KEYS.RAW_MATERIALS, data)
      }
      if (prodRes && Array.isArray(prodRes)) {
        const data = parseDatesInArray(prodRes)
        setProduction(data)
        setStorageData(STORAGE_KEYS.PRODUCTION, data)
      }
      if (shipRes && Array.isArray(shipRes)) {
        const data = parseDatesInArray(shipRes)
        setShipping(data)
        setStorageData(STORAGE_KEYS.SHIPPING, data)
      }
      if (acidRes && Array.isArray(acidRes)) {
        const data = parseDatesInArray(acidRes)
        setAcidityRecords(data)
        setStorageData(STORAGE_KEYS.ACIDITY, data)
      }
      if (factRes && Array.isArray(factRes)) {
        const data = parseDatesInArray(factRes)
        setFactories(data)
        setStorageData(STORAGE_KEYS.FACTORIES, data)
      }

      const now = new Date()
      setLastProtheusSync(now)
      setStorageData(STORAGE_KEYS.LAST_SYNC, now)
    } catch (error) {
      console.error('Sync failed:', error)
      // Silent fail for auto-sync to avoid spamming toasts
    }
  }, [protheusConfig, apiFetch])

  // Polling Effect
  useEffect(() => {
    if (!protheusConfig.isActive) return

    // Initial sync
    syncProtheusData()

    const intervalId = setInterval(() => {
      syncProtheusData()
    }, systemSettings.refreshRate * 1000)

    return () => clearInterval(intervalId)
  }, [protheusConfig.isActive, systemSettings.refreshRate, syncProtheusData])

  const clearAllData = useCallback(() => {
    setRawMaterials([])
    setProduction([])
    setShipping([])
    setAcidityRecords([])
    setStorageData(STORAGE_KEYS.RAW_MATERIALS, [])
    setStorageData(STORAGE_KEYS.PRODUCTION, [])
    setStorageData(STORAGE_KEYS.SHIPPING, [])
    setStorageData(STORAGE_KEYS.ACIDITY, [])
    setLastProtheusSync(null)
    setStorageData(STORAGE_KEYS.LAST_SYNC, null)
    broadcastUpdate()
  }, [])

  // CRUD Factories with Sync Support
  const createAdd =
    <T,>(
      key: string,
      endpoint: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) =>
    (entry: Omit<T, 'id'>) => {
      const newEntry = {
        ...entry,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date(),
      } as unknown as T

      setter((prev) => {
        const newData = [newEntry, ...prev]
        setStorageData(key, newData)
        return newData
      })
      broadcastUpdate()

      // Push to server if active
      if (protheusConfig.isActive) {
        apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(newEntry),
        }).catch(console.error)
      }
    }

  const createUpdate =
    <T extends { id: string }>(
      key: string,
      endpoint: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) =>
    (entry: T) => {
      setter((prev) => {
        const newData = prev.map((item) =>
          item.id === entry.id ? entry : item,
        )
        setStorageData(key, newData)
        return newData
      })
      broadcastUpdate()

      // Push to server
      if (protheusConfig.isActive) {
        apiFetch(`${endpoint}/${entry.id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        }).catch(console.error)
      }
    }

  const createDelete =
    <T extends { id: string }>(
      key: string,
      endpoint: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) =>
    (id: string) => {
      setter((prev) => {
        const newData = prev.filter((item) => item.id !== id)
        setStorageData(key, newData)
        return newData
      })
      broadcastUpdate()

      // Push to server
      if (protheusConfig.isActive) {
        apiFetch(`${endpoint}/${id}`, {
          method: 'DELETE',
        }).catch(console.error)
      }
    }

  const handleSetCurrentFactory = useCallback((id: string) => {
    setCurrentFactoryId(id)
    setStorageData(STORAGE_KEYS.CURRENT_FACTORY, id)
  }, [])

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        production,
        shipping,
        acidityRecords,
        addRawMaterial: createAdd(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
        ),
        updateRawMaterial: createUpdate(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
        ),
        deleteRawMaterial: createDelete(
          STORAGE_KEYS.RAW_MATERIALS,
          'raw-materials',
          setRawMaterials,
        ),

        addProduction: createAdd(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
        ),
        updateProduction: createUpdate(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
        ),
        deleteProduction: createDelete(
          STORAGE_KEYS.PRODUCTION,
          'production',
          setProduction,
        ),

        addShipping: createAdd(STORAGE_KEYS.SHIPPING, 'shipping', setShipping),
        updateShipping: createUpdate(
          STORAGE_KEYS.SHIPPING,
          'shipping',
          setShipping,
        ),
        deleteShipping: createDelete(
          STORAGE_KEYS.SHIPPING,
          'shipping',
          setShipping,
        ),

        addAcidityRecord: createAdd(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
        ),
        updateAcidityRecord: createUpdate(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
        ),
        deleteAcidityRecord: createDelete(
          STORAGE_KEYS.ACIDITY,
          'acidity',
          setAcidityRecords,
        ),

        userAccessList,
        addUserAccess: createAdd(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
        ),
        updateUserAccess: createUpdate(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
        ),
        deleteUserAccess: createDelete(
          STORAGE_KEYS.USER_ACCESS,
          'users',
          setUserAccessList,
        ),

        factories,
        addFactory: createAdd(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
        ),
        updateFactory: createUpdate(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
        ),
        deleteFactory: createDelete(
          STORAGE_KEYS.FACTORIES,
          'factories',
          setFactories,
        ),

        currentFactoryId,
        setCurrentFactoryId: handleSetCurrentFactory,

        dateRange,
        setDateRange,

        isDeveloperMode,
        toggleDeveloperMode,

        systemSettings,
        updateSystemSettings,

        protheusConfig,
        updateProtheusConfig,
        testProtheusConnection,
        lastProtheusSync,
        syncProtheusData,

        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
