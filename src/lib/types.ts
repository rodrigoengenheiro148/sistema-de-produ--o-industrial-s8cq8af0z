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
  docRef: string
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface DataContextType {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  addRawMaterial: (entry: Omit<RawMaterialEntry, 'id'>) => void
  addProduction: (entry: Omit<ProductionEntry, 'id'>) => void
  addShipping: (entry: Omit<ShippingEntry, 'id'>) => void
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}
