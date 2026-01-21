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
  DateRange,
  DataContextType,
  SystemSettings,
  UserAccessEntry,
} from '@/lib/types'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

const DataContext = createContext<DataContextType | undefined>(undefined)

const DEFAULT_SETTINGS: SystemSettings = {
  productionGoal: 50000,
  maxLossThreshold: 1500,
  refreshRate: 30,
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

const STORAGE_KEYS = {
  RAW_MATERIALS: 'spi_raw_materials',
  PRODUCTION: 'spi_production',
  SHIPPING: 'spi_shipping',
  ACIDITY: 'spi_acidity',
  DEV_MODE: 'spi_dev_mode',
  SETTINGS: 'spi_settings',
  USER_ACCESS: 'spi_user_access',
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
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error)
  }
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
  const [userAccessList, setUserAccessList] = useState<UserAccessEntry[]>(() =>
    getStorageData(STORAGE_KEYS.USER_ACCESS, MOCK_USER_ACCESS),
  )
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() =>
    getStorageData(STORAGE_KEYS.DEV_MODE, false),
  )
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    getStorageData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  )
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === STORAGE_KEYS.DEV_MODE && e.newValue) {
          setIsDeveloperMode(JSON.parse(e.newValue))
        } else if (e.key === STORAGE_KEYS.SETTINGS && e.newValue) {
          setSystemSettings(JSON.parse(e.newValue))
        } else if (e.key === STORAGE_KEYS.USER_ACCESS && e.newValue) {
          setUserAccessList(JSON.parse(e.newValue, dateTimeReviver))
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

  const clearAllData = useCallback(() => {
    setRawMaterials([])
    setProduction([])
    setShipping([])
    setAcidityRecords([])
    // We intentionally do not clear userAccessList on data reset to prevent lockout,
    // unless explicitly desired. For safety, we keep users.
    setStorageData(STORAGE_KEYS.RAW_MATERIALS, [])
    setStorageData(STORAGE_KEYS.PRODUCTION, [])
    setStorageData(STORAGE_KEYS.SHIPPING, [])
    setStorageData(STORAGE_KEYS.ACIDITY, [])
  }, [])

  // CRUD Factories
  const createAdd =
    <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (entry: Omit<T, 'id'>) => {
      setter((prev) => {
        const newEntry = {
          ...entry,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date(), // Adding default createdAt if missing
        } as unknown as T
        const newData = [newEntry, ...prev]
        setStorageData(key, newData)
        return newData
      })
    }

  const createUpdate =
    <T extends { id: string }>(
      key: string,
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
    }

  const createDelete =
    <T extends { id: string }>(
      key: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) =>
    (id: string) => {
      setter((prev) => {
        const newData = prev.filter((item) => item.id !== id)
        setStorageData(key, newData)
        return newData
      })
    }

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        production,
        shipping,
        acidityRecords,
        addRawMaterial: createAdd(STORAGE_KEYS.RAW_MATERIALS, setRawMaterials),
        updateRawMaterial: createUpdate(
          STORAGE_KEYS.RAW_MATERIALS,
          setRawMaterials,
        ),
        deleteRawMaterial: createDelete(
          STORAGE_KEYS.RAW_MATERIALS,
          setRawMaterials,
        ),
        addProduction: createAdd(STORAGE_KEYS.PRODUCTION, setProduction),
        updateProduction: createUpdate(STORAGE_KEYS.PRODUCTION, setProduction),
        deleteProduction: createDelete(STORAGE_KEYS.PRODUCTION, setProduction),
        addShipping: createAdd(STORAGE_KEYS.SHIPPING, setShipping),
        updateShipping: createUpdate(STORAGE_KEYS.SHIPPING, setShipping),
        deleteShipping: createDelete(STORAGE_KEYS.SHIPPING, setShipping),
        addAcidityRecord: createAdd(STORAGE_KEYS.ACIDITY, setAcidityRecords),
        updateAcidityRecord: createUpdate(
          STORAGE_KEYS.ACIDITY,
          setAcidityRecords,
        ),
        deleteAcidityRecord: createDelete(
          STORAGE_KEYS.ACIDITY,
          setAcidityRecords,
        ),
        userAccessList,
        addUserAccess: createAdd(STORAGE_KEYS.USER_ACCESS, setUserAccessList),
        updateUserAccess: createUpdate(
          STORAGE_KEYS.USER_ACCESS,
          setUserAccessList,
        ),
        deleteUserAccess: createDelete(
          STORAGE_KEYS.USER_ACCESS,
          setUserAccessList,
        ),
        dateRange,
        setDateRange,
        isDeveloperMode,
        toggleDeveloperMode,
        systemSettings,
        updateSystemSettings,
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
