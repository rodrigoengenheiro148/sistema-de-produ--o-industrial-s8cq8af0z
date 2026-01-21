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
} from '@/lib/types'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

const DataContext = createContext<DataContextType | undefined>(undefined)

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
  {
    id: '3',
    date: subDays(new Date(), 3),
    supplier: 'Agropecuária Silva',
    type: 'Misto',
    quantity: 12000,
    notes: '',
  },
  {
    id: '4',
    date: subDays(new Date(), 2),
    supplier: 'Frigorífico Boi Gordo',
    type: 'Ossos',
    quantity: 10000,
    notes: '',
  },
  {
    id: '5',
    date: subDays(new Date(), 1),
    supplier: 'Matadouro Municipal',
    type: 'Sangue',
    quantity: 5000,
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
  {
    id: '2',
    date: subDays(new Date(), 4),
    shift: 'Tarde',
    mpUsed: 7500,
    seboProduced: 2200,
    fcoProduced: 3800,
    farinhetaProduced: 750,
    losses: 750,
  },
  {
    id: '3',
    date: subDays(new Date(), 3),
    shift: 'Manhã',
    mpUsed: 11500,
    seboProduced: 3500,
    fcoProduced: 5800,
    farinhetaProduced: 1100,
    losses: 1100,
  },
  {
    id: '4',
    date: subDays(new Date(), 2),
    shift: 'Noite',
    mpUsed: 9800,
    seboProduced: 2900,
    fcoProduced: 4900,
    farinhetaProduced: 900,
    losses: 1100,
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
  {
    id: '2',
    date: subDays(new Date(), 1),
    client: 'Rações Pet',
    product: 'FCO',
    quantity: 10000,
    unitPrice: 2.8,
    docRef: 'NF-1002',
  },
  {
    id: '3',
    date: subDays(new Date(), 3),
    client: 'NutriAnimais',
    product: 'Farinheta',
    quantity: 2000,
    unitPrice: 1.2,
    docRef: 'NF-1003',
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
  {
    id: '2',
    date: subDays(new Date(), 2),
    time: '14:15',
    responsible: 'Maria Santos',
    weight: 1150,
    volume: 1480,
    tank: 'Tanque B',
    performedTimes: '14:00, 14:15',
    notes: 'Leve alteração corrigida',
  },
]

const STORAGE_KEYS = {
  RAW_MATERIALS: 'spi_raw_materials',
  PRODUCTION: 'spi_production',
  SHIPPING: 'spi_shipping',
  ACIDITY: 'spi_acidity',
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

const getStorageData = <T,>(key: string, defaultData: T): T => {
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

const setStorageData = <T,>(key: string, data: T) => {
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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Listen for storage events to sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.newValue) {
          if (e.key === STORAGE_KEYS.RAW_MATERIALS) {
            setRawMaterials(JSON.parse(e.newValue, dateTimeReviver))
          } else if (e.key === STORAGE_KEYS.PRODUCTION) {
            setProduction(JSON.parse(e.newValue, dateTimeReviver))
          } else if (e.key === STORAGE_KEYS.SHIPPING) {
            setShipping(JSON.parse(e.newValue, dateTimeReviver))
          } else if (e.key === STORAGE_KEYS.ACIDITY) {
            setAcidityRecords(JSON.parse(e.newValue, dateTimeReviver))
          }
        }
      } catch (error) {
        console.error('Error handling storage change', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addRawMaterial = useCallback((entry: Omit<RawMaterialEntry, 'id'>) => {
    setRawMaterials((prev) => {
      const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
      const newData = [newEntry, ...prev]
      setStorageData(STORAGE_KEYS.RAW_MATERIALS, newData)
      return newData
    })
  }, [])

  const addProduction = useCallback((entry: Omit<ProductionEntry, 'id'>) => {
    setProduction((prev) => {
      const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
      const newData = [newEntry, ...prev]
      setStorageData(STORAGE_KEYS.PRODUCTION, newData)
      return newData
    })
  }, [])

  const addShipping = useCallback((entry: Omit<ShippingEntry, 'id'>) => {
    setShipping((prev) => {
      const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
      const newData = [newEntry, ...prev]
      setStorageData(STORAGE_KEYS.SHIPPING, newData)
      return newData
    })
  }, [])

  const addAcidityRecord = useCallback((entry: Omit<AcidityEntry, 'id'>) => {
    setAcidityRecords((prev) => {
      const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
      const newData = [newEntry, ...prev]
      setStorageData(STORAGE_KEYS.ACIDITY, newData)
      return newData
    })
  }, [])

  const updateAcidityRecord = useCallback((entry: AcidityEntry) => {
    setAcidityRecords((prev) => {
      const newData = prev.map((item) => (item.id === entry.id ? entry : item))
      setStorageData(STORAGE_KEYS.ACIDITY, newData)
      return newData
    })
  }, [])

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        production,
        shipping,
        acidityRecords,
        addRawMaterial,
        addProduction,
        addShipping,
        addAcidityRecord,
        updateAcidityRecord,
        dateRange,
        setDateRange,
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
