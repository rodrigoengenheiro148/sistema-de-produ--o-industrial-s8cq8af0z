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
  YieldTargets,
} from '@/lib/types'
import { startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

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

// Helper to safely parse dates, forcing local noon for date-only strings to avoid timezone shifts
const parseDateSafe = (dateStr: string | Date | null | undefined): Date => {
  if (!dateStr) return new Date()
  if (dateStr instanceof Date) return dateStr
  // If string matches YYYY-MM-DD exactly (no time), append T12:00:00 to force local noon interpretation
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`)
  }
  return new Date(dateStr)
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()

  const [rawMaterials, setRawMaterials] = useState<RawMaterialEntry[]>([])
  const [production, setProduction] = useState<ProductionEntry[]>([])
  const [shipping, setShipping] = useState<ShippingEntry[]>([])
  const [acidityRecords, setAcidityRecords] = useState<AcidityEntry[]>([])
  const [qualityRecords, setQualityRecords] = useState<QualityEntry[]>([])
  const [userAccessList, setUserAccessList] = useState<UserAccessEntry[]>([])
  const [factories, setFactories] = useState<Factory[]>([])

  const [currentFactoryId, setCurrentFactoryId] = useState<string>('1')
  const [systemSettings, setSystemSettings] =
    useState<SystemSettings>(DEFAULT_SETTINGS)
  const [yieldTargets, setYieldTargets] = useState<YieldTargets>(
    DEFAULT_YIELD_TARGETS,
  )
  const [protheusConfig, setProtheusConfig] = useState<ProtheusConfig>({
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    syncInventory: false,
    syncProduction: false,
    isActive: false,
  })

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('offline')
  const [lastProtheusSync, setLastProtheusSync] = useState<Date | null>(null)

  // Map database response to application types
  const mapData = (data: any[]) => {
    return data.map((item) => ({
      ...item,
      // Use safe date parsing to prevent off-by-one-day errors
      date: parseDateSafe(item.date),
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      // Map database snake_case columns to camelCase if needed
      mpUsed: item.mp_used,
      seboProduced: item.sebo_produced,
      fcoProduced: item.fco_produced,
      farinhetaProduced: item.farinheta_produced,
      unitPrice: item.unit_price,
      docRef: item.doc_ref,
      performedTimes: item.performed_times,
    }))
  }

  // Fetch all data from Supabase
  // Wrapped in useCallback to be stable for useEffect dependencies if needed,
  // though currently mostly used inside useEffect where user changes
  const fetchData = useCallback(async () => {
    if (!user) {
      setConnectionStatus('offline')
      return
    }

    try {
      const [
        { data: raw },
        { data: prod },
        { data: ship },
        { data: acid },
        { data: qual },
        { data: fact },
      ] = await Promise.all([
        supabase
          .from('raw_materials')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('production')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('shipping')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('acidity_records')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('quality_records')
          .select('*')
          .order('date', { ascending: false }),
        supabase.from('factories').select('*'),
      ])

      if (raw) setRawMaterials(mapData(raw))
      if (prod) setProduction(mapData(prod))
      if (ship) setShipping(mapData(ship))
      if (acid) setAcidityRecords(mapData(acid))
      if (qual) setQualityRecords(mapData(qual))
      if (fact) setFactories(mapData(fact))

      setLastProtheusSync(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
      setConnectionStatus('error')
    }
  }, [user])

  // Initial fetch and Realtime Subscription
  useEffect(() => {
    if (!user) {
      setRawMaterials([])
      setProduction([])
      setShipping([])
      setAcidityRecords([])
      setQualityRecords([])
      setFactories([])
      setConnectionStatus('offline')
      return
    }

    // Initial load
    setConnectionStatus('syncing')
    fetchData().then(() => setConnectionStatus('online'))

    // Realtime subscriptions
    // Using a simple channel name.
    // Ensure tables are added to supabase_realtime publication in database migration.
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raw_materials' },
        () => fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production' },
        () => fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipping' },
        () => fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'acidity_records' },
        () => fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quality_records' },
        () => fetchData(),
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('online')
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Realtime subscription error: ${status}`, err)
          setConnectionStatus('error')
        } else if (status === 'TIMED_OUT') {
          console.error(`Realtime subscription error: ${status}`)
          setConnectionStatus('error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchData])

  // --- Action Handlers using Supabase ---

  const addRawMaterial = async (entry: Omit<RawMaterialEntry, 'id'>) => {
    const { error } = await supabase.from('raw_materials').insert({
      date: entry.date.toISOString(),
      supplier: entry.supplier,
      type: entry.type,
      quantity: entry.quantity,
      unit: entry.unit,
      notes: entry.notes,
      user_id: user?.id,
    })
    if (error) console.error('Error adding raw material:', error)
  }

  const updateRawMaterial = async (entry: RawMaterialEntry) => {
    const { error } = await supabase
      .from('raw_materials')
      .update({
        date: entry.date.toISOString(),
        supplier: entry.supplier,
        type: entry.type,
        quantity: entry.quantity,
        unit: entry.unit,
        notes: entry.notes,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating raw material:', error)
  }

  const deleteRawMaterial = async (id: string) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (error) console.error('Error deleting raw material:', error)
  }

  const addProduction = async (entry: Omit<ProductionEntry, 'id'>) => {
    const { error } = await supabase.from('production').insert({
      date: entry.date.toISOString(),
      shift: entry.shift,
      mp_used: entry.mpUsed,
      sebo_produced: entry.seboProduced,
      fco_produced: entry.fcoProduced,
      farinheta_produced: entry.farinhetaProduced,
      losses: entry.losses,
      user_id: user?.id,
    })
    if (error) console.error('Error adding production:', error)
  }

  const updateProduction = async (entry: ProductionEntry) => {
    const { error } = await supabase
      .from('production')
      .update({
        date: entry.date.toISOString(),
        shift: entry.shift,
        mp_used: entry.mpUsed,
        sebo_produced: entry.seboProduced,
        fco_produced: entry.fcoProduced,
        farinheta_produced: entry.farinhetaProduced,
        losses: entry.losses,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating production:', error)
  }

  const deleteProduction = async (id: string) => {
    const { error } = await supabase.from('production').delete().eq('id', id)
    if (error) console.error('Error deleting production:', error)
  }

  const addShipping = async (entry: Omit<ShippingEntry, 'id'>) => {
    const { error } = await supabase.from('shipping').insert({
      date: entry.date.toISOString(),
      client: entry.client,
      product: entry.product,
      quantity: entry.quantity,
      unit_price: entry.unitPrice,
      doc_ref: entry.docRef,
      user_id: user?.id,
    })
    if (error) console.error('Error adding shipping:', error)
  }

  const updateShipping = async (entry: ShippingEntry) => {
    const { error } = await supabase
      .from('shipping')
      .update({
        date: entry.date.toISOString(),
        client: entry.client,
        product: entry.product,
        quantity: entry.quantity,
        unit_price: entry.unitPrice,
        doc_ref: entry.docRef,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating shipping:', error)
  }

  const deleteShipping = async (id: string) => {
    const { error } = await supabase.from('shipping').delete().eq('id', id)
    if (error) console.error('Error deleting shipping:', error)
  }

  const addAcidityRecord = async (entry: Omit<AcidityEntry, 'id'>) => {
    const { error } = await supabase.from('acidity_records').insert({
      date: entry.date.toISOString(),
      time: entry.time,
      responsible: entry.responsible,
      weight: entry.weight,
      volume: entry.volume,
      tank: entry.tank,
      performed_times: entry.performedTimes,
      notes: entry.notes,
      user_id: user?.id,
    })
    if (error) console.error('Error adding acidity record:', error)
  }

  const updateAcidityRecord = async (entry: AcidityEntry) => {
    const { error } = await supabase
      .from('acidity_records')
      .update({
        date: entry.date.toISOString(),
        time: entry.time,
        responsible: entry.responsible,
        weight: entry.weight,
        volume: entry.volume,
        tank: entry.tank,
        performed_times: entry.performedTimes,
        notes: entry.notes,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating acidity record:', error)
  }

  const deleteAcidityRecord = async (id: string) => {
    const { error } = await supabase
      .from('acidity_records')
      .delete()
      .eq('id', id)
    if (error) console.error('Error deleting acidity record:', error)
  }

  const addQualityRecord = async (entry: Omit<QualityEntry, 'id'>) => {
    const { error } = await supabase.from('quality_records').insert({
      date: entry.date.toISOString(),
      product: entry.product,
      acidity: entry.acidity,
      protein: entry.protein,
      responsible: entry.responsible,
      notes: entry.notes,
      user_id: user?.id,
    })
    if (error) console.error('Error adding quality record:', error)
  }

  const updateQualityRecord = async (entry: QualityEntry) => {
    const { error } = await supabase
      .from('quality_records')
      .update({
        date: entry.date.toISOString(),
        product: entry.product,
        acidity: entry.acidity,
        protein: entry.protein,
        responsible: entry.responsible,
        notes: entry.notes,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating quality record:', error)
  }

  const deleteQualityRecord = async (id: string) => {
    const { error } = await supabase
      .from('quality_records')
      .delete()
      .eq('id', id)
    if (error) console.error('Error deleting quality record:', error)
  }

  const addFactory = async (entry: Omit<Factory, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('factories').insert({
      name: entry.name,
      location: entry.location,
      manager: entry.manager,
      status: entry.status,
      user_id: user?.id,
    })
    if (error) console.error('Error adding factory:', error)
  }

  const updateFactory = async (entry: Factory) => {
    const { error } = await supabase
      .from('factories')
      .update({
        name: entry.name,
        location: entry.location,
        manager: entry.manager,
        status: entry.status,
      })
      .eq('id', entry.id)
    if (error) console.error('Error updating factory:', error)
  }

  const deleteFactory = async (id: string) => {
    const { error } = await supabase.from('factories').delete().eq('id', id)
    if (error) console.error('Error deleting factory:', error)
  }

  // Legacy/Mock functions
  const addUserAccess = () => {}
  const updateUserAccess = () => {}
  const deleteUserAccess = () => {}
  const login = () => {}
  const checkPermission = () => true
  const toggleDeveloperMode = () => {}
  const setViewerMode = () => {}
  const testProtheusConnection = async () => ({
    success: true,
    message: 'Supabase Connected',
  })
  const syncProtheusData = async () => {
    await fetchData()
  }
  const clearAllData = async () => {}

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

        currentUser: null,
        login,
        checkPermission,

        factories,
        addFactory,
        updateFactory,
        deleteFactory,

        currentFactoryId,
        setCurrentFactoryId,

        dateRange,
        setDateRange,

        isDeveloperMode: false,
        toggleDeveloperMode,
        isViewerMode: false,
        setViewerMode,

        systemSettings,
        updateSystemSettings: setSystemSettings,
        yieldTargets,
        updateYieldTargets: setYieldTargets,

        protheusConfig,
        updateProtheusConfig: setProtheusConfig,
        testProtheusConnection,
        lastProtheusSync,
        syncProtheusData,
        connectionStatus,
        pendingOperationsCount: 0,
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
