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
  NotificationSettings,
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

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: false,
  smsEnabled: false,
  yieldThreshold: 0,
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

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)

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
        { data: integration },
        { data: notifications },
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
        supabase.from('integration_configs').select('*').limit(1).maybeSingle(),
        // @ts-expect-error - notification_settings table is created in a migration
        supabase
          .from('notification_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ])

      if (raw) setRawMaterials(mapData(raw))
      if (prod) setProduction(mapData(prod))
      if (ship) setShipping(mapData(ship))
      if (acid) setAcidityRecords(mapData(acid))
      if (qual) setQualityRecords(mapData(qual))
      if (fact) setFactories(mapData(fact))

      if (integration) {
        setProtheusConfig({
          id: integration.id,
          baseUrl: integration.base_url || '',
          clientId: integration.client_id || '',
          clientSecret: integration.client_secret || '',
          username: integration.username || '',
          password: integration.password || '',
          syncInventory: integration.sync_inventory || false,
          syncProduction: integration.sync_production || false,
          isActive: integration.is_active || false,
        })
      }

      if (notifications) {
        setNotificationSettings({
          id: notifications.id,
          emailEnabled: notifications.email_enabled || false,
          smsEnabled: notifications.sms_enabled || false,
          yieldThreshold: notifications.yield_threshold || 0,
        })
      }

      setLastProtheusSync(new Date())
    } catch (error) {
      // It's ok if configs are not found
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

  // --- Integration Handlers ---

  const updateProtheusConfig = async (config: ProtheusConfig) => {
    // Optimistic update
    setProtheusConfig(config)

    // Persist to DB
    const dataToUpsert = {
      base_url: config.baseUrl,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: config.username,
      password: config.password,
      sync_inventory: config.syncInventory,
      sync_production: config.syncProduction,
      is_active: config.isActive,
      user_id: user?.id,
    }

    if (config.id) {
      await supabase
        .from('integration_configs')
        .update(dataToUpsert)
        .eq('id', config.id)
    } else {
      const { data: existing } = await supabase
        .from('integration_configs')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('integration_configs')
          .update(dataToUpsert)
          .eq('id', existing.id)
      } else {
        await supabase.from('integration_configs').insert(dataToUpsert)
      }
    }
    fetchData()
  }

  // --- Notification Handlers ---

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings)

    const dataToUpsert = {
      email_enabled: settings.emailEnabled,
      sms_enabled: settings.smsEnabled,
      yield_threshold: settings.yieldThreshold,
      user_id: user?.id,
    }

    if (settings.id) {
      // @ts-expect-error - notification_settings table is created in a migration
      await supabase
        .from('notification_settings')
        .update(dataToUpsert)
        .eq('id', settings.id)
    } else {
      // @ts-expect-error - notification_settings table is created in a migration
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()
      if (existing) {
        // @ts-expect-error - notification_settings table is created in a migration
        await supabase
          .from('notification_settings')
          .update(dataToUpsert)
          .eq('id', existing.id)
      } else {
        // @ts-expect-error - notification_settings table is created in a migration
        await supabase.from('notification_settings').insert(dataToUpsert)
      }
    }
    fetchData()
  }

  const testProtheusConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('protheus-sync', {
        body: {
          action: 'test-connection',
          config: protheusConfig,
        },
      })

      if (error) throw error
      return { success: data.success, message: data.message }
    } catch (error: any) {
      console.error('Test connection error:', error)
      return {
        success: false,
        message: error.message || 'Erro ao conectar com a Edge Function',
      }
    }
  }

  const syncProtheusData = async () => {
    try {
      await supabase.functions.invoke('protheus-sync', {
        body: {
          action: 'sync-data',
          config: protheusConfig,
        },
      })
      await fetchData()
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    }
  }

  // Legacy/Mock functions
  const addUserAccess = () => {}
  const updateUserAccess = () => {}
  const deleteUserAccess = () => {}
  const login = () => {}
  const checkPermission = () => true
  const toggleDeveloperMode = () => {}
  const setViewerMode = () => {}
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
        updateProtheusConfig,
        testProtheusConnection,
        lastProtheusSync,
        syncProtheusData,

        notificationSettings,
        updateNotificationSettings,

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
