import React, { createContext, useContext, useState } from 'react'
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rawMaterials, setRawMaterials] =
    useState<RawMaterialEntry[]>(MOCK_RAW_MATERIALS)
  const [production, setProduction] =
    useState<ProductionEntry[]>(MOCK_PRODUCTION)
  const [shipping, setShipping] = useState<ShippingEntry[]>(MOCK_SHIPPING)
  const [acidityRecords, setAcidityRecords] =
    useState<AcidityEntry[]>(MOCK_ACIDITY)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const addRawMaterial = (entry: Omit<RawMaterialEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
    setRawMaterials((prev) => [newEntry, ...prev])
  }

  const addProduction = (entry: Omit<ProductionEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
    setProduction((prev) => [newEntry, ...prev])
  }

  const addShipping = (entry: Omit<ShippingEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
    setShipping((prev) => [newEntry, ...prev])
  }

  const addAcidityRecord = (entry: Omit<AcidityEntry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) }
    setAcidityRecords((prev) => [newEntry, ...prev])
  }

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
