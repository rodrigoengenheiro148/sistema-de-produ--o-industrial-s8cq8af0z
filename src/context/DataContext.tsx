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
import { RealtimeChannel } from '@supabase/supabase-js'

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
  seboThreshold: 0,
  farinhetaThreshold: 0,
  farinhaThreshold: 0,
  notificationEmail: '',
  notificationPhone: '',
  brevoApiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
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
    factoryId: item.factory_id,
  }))
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()

  // Initialize with empty string to force selection/loading
  const [currentFactoryId, setCurrentFactoryId] = useState<string>(() => {
    return localStorage.getItem('currentFactoryId') || ''
  })

  // Persist currentFactoryId selection
  useEffect(() => {
    if (currentFactoryId) {
      localStorage.setItem('currentFactoryId', currentFactoryId)
    }
  }, [currentFactoryId])

  const [rawMaterials, setRawMaterials] = useState<RawMaterialEntry[]>([])
  const [production, setProduction] = useState<ProductionEntry[]>([])
  const [shipping, setShipping] = useState<ShippingEntry[]>([])
  const [acidityRecords, setAcidityRecords] = useState<AcidityEntry[]>([])
  const [qualityRecords, setQualityRecords] = useState<QualityEntry[]>([])
  const [userAccessList, setUserAccessList] = useState<UserAccessEntry[]>([])
  const [factories, setFactories] = useState<Factory[]>([])

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

  // 1. Fetch Global Settings & Factories
  const fetchGlobalData = useCallback(async () => {
    if (!user) return

    try {
      const [{ data: fact }, { data: integration }, { data: notifications }] =
        await Promise.all([
          supabase.from('factories').select('*').order('name'),
          supabase
            .from('integration_configs')
            .select('*')
            .limit(1)
            .maybeSingle(),
          supabase
            .from('notification_settings')
            .select('*')
            .limit(1)
            .maybeSingle(),
        ])

      if (fact) {
        const mappedFactories = mapData(fact)
        setFactories(mappedFactories)
      }

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
        const settings: NotificationSettings = {
          id: notifications.id,
          emailEnabled: notifications.email_enabled || false,
          smsEnabled: notifications.sms_enabled || false,
          yieldThreshold: notifications.yield_threshold || 0,
          seboThreshold: notifications.sebo_threshold || 0,
          farinhetaThreshold: notifications.farinheta_threshold || 0,
          farinhaThreshold: notifications.farinha_threshold || 0,
          notificationEmail: notifications.notification_email || '',
          notificationPhone: notifications.notification_phone || '',
          brevoApiKey: notifications.brevo_api_key || '',
          smtpHost: notifications.smtp_host || '',
          smtpPort: notifications.smtp_port || 587,
          smtpUser: notifications.smtp_user || '',
          smtpPassword: notifications.smtp_password || '',
        }
        setNotificationSettings(settings)

        // Sync yield targets with notification settings
        setYieldTargets({
          sebo: settings.seboThreshold || DEFAULT_YIELD_TARGETS.sebo,
          fco: settings.farinhaThreshold || DEFAULT_YIELD_TARGETS.fco,
          farinheta:
            settings.farinhetaThreshold || DEFAULT_YIELD_TARGETS.farinheta,
          total: settings.yieldThreshold || DEFAULT_YIELD_TARGETS.total,
        })
      }
    } catch (error) {
      console.error('Error fetching global data:', error)
    }
  }, [user])

  // Validate and set currentFactoryId if needed
  useEffect(() => {
    if (factories.length > 0) {
      const isValid = factories.some((f) => f.id === currentFactoryId)
      if (!isValid || !currentFactoryId) {
        setCurrentFactoryId(factories[0].id)
      }
    }
  }, [factories, currentFactoryId])

  // 2. Fetch Operational Data (Scoped to Factory)
  const fetchOperationalData = useCallback(async () => {
    if (!user || !currentFactoryId) {
      setRawMaterials([])
      setProduction([])
      setShipping([])
      setAcidityRecords([])
      setQualityRecords([])
      return
    }

    try {
      const [
        { data: raw },
        { data: prod },
        { data: ship },
        { data: acid },
        { data: qual },
      ] = await Promise.all([
        supabase
          .from('raw_materials')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .order('date', { ascending: false }),
        supabase
          .from('production')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .order('date', { ascending: false }),
        supabase
          .from('shipping')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .order('date', { ascending: false }),
        supabase
          .from('acidity_records')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .order('date', { ascending: false }),
        supabase
          .from('quality_records')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .order('date', { ascending: false }),
      ])

      if (raw) setRawMaterials(mapData(raw))
      if (prod) setProduction(mapData(prod))
      if (ship) setShipping(mapData(ship))
      if (acid) setAcidityRecords(mapData(acid))
      if (qual) setQualityRecords(mapData(qual))

      setLastProtheusSync(new Date())
    } catch (error) {
      console.error('Error fetching operational data:', error)
      setConnectionStatus('error')
    }
  }, [user, currentFactoryId])

  // Initial fetch Global
  useEffect(() => {
    if (!user) {
      setFactories([])
      setConnectionStatus('offline')
      return
    }
    setConnectionStatus('syncing')
    fetchGlobalData().then(() => setConnectionStatus('online'))
  }, [user, fetchGlobalData])

  // Fetch Operational Data when Factory Changes
  useEffect(() => {
    if (currentFactoryId) {
      fetchOperationalData()
    }
  }, [currentFactoryId, fetchOperationalData])

  // Realtime Subscriptions (Global - Factories)
  useEffect(() => {
    if (!user) return

    // Ensure unique channel name to avoid conflicts and stale subscriptions
    const channelName = `factories-updates-${user.id}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'factories',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchGlobalData(),
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(
            `Realtime subscription error (factories) on channel ${channelName}:`,
            err,
          )
        } else if (status === 'TIMED_OUT') {
          console.error(
            `Realtime subscription timeout (factories) on channel ${channelName}`,
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchGlobalData])

  // Realtime Subscriptions (Operational - Scoped to Factory)
  useEffect(() => {
    if (!user || !currentFactoryId) return

    // Ensure unique channel name for operational data as well
    const channelName = `operational-data-${currentFactoryId}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raw_materials',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => fetchOperationalData(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => fetchOperationalData(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipping',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => fetchOperationalData(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acidity_records',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => fetchOperationalData(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quality_records',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => fetchOperationalData(),
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('online')
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `Realtime subscription error (operational) on channel ${channelName}:`,
            err,
          )
          setConnectionStatus('error')
        } else if (status === 'TIMED_OUT') {
          console.error(
            `Realtime subscription timeout (operational) on channel ${channelName}`,
          )
          setConnectionStatus('error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, currentFactoryId, fetchOperationalData])

  const checkThresholdsAndNotify = async (
    entry: Omit<ProductionEntry, 'id'>,
  ) => {
    if (notificationSettings.emailEnabled || notificationSettings.smsEnabled) {
      try {
        await supabase.functions.invoke('send-brevo-alert', {
          body: {
            productionData: entry,
          },
        })
      } catch (err) {
        console.error('Failed to invoke alert function:', err)
      }
    }
  }

  // --- Action Handlers using Supabase ---

  const addRawMaterial = async (entry: Omit<RawMaterialEntry, 'id'>) => {
    if (!currentFactoryId) {
      console.error('No active factory selected')
      return
    }
    const { error } = await supabase.from('raw_materials').insert({
      date: entry.date.toISOString(),
      supplier: entry.supplier,
      type: entry.type,
      quantity: entry.quantity,
      unit: entry.unit,
      notes: entry.notes,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (error) console.error('Error adding raw material:', error)
    else fetchOperationalData()
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
    else fetchOperationalData()
  }

  const deleteRawMaterial = async (id: string) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (error) console.error('Error deleting raw material:', error)
    else fetchOperationalData()
  }

  const addProduction = async (entry: Omit<ProductionEntry, 'id'>) => {
    if (!currentFactoryId) {
      console.error('No active factory selected')
      return
    }
    const { error } = await supabase.from('production').insert({
      date: entry.date.toISOString(),
      shift: entry.shift,
      mp_used: entry.mpUsed,
      sebo_produced: entry.seboProduced,
      fco_produced: entry.fcoProduced,
      farinheta_produced: entry.farinhetaProduced,
      losses: entry.losses,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (error) {
      console.error('Error adding production:', error)
    } else {
      checkThresholdsAndNotify(entry)
      fetchOperationalData()
    }
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
    if (error) {
      console.error('Error updating production:', error)
    } else {
      checkThresholdsAndNotify(entry)
      fetchOperationalData()
    }
  }

  const deleteProduction = async (id: string) => {
    const { error } = await supabase.from('production').delete().eq('id', id)
    if (error) console.error('Error deleting production:', error)
    else fetchOperationalData()
  }

  const addShipping = async (entry: Omit<ShippingEntry, 'id'>) => {
    if (!currentFactoryId) {
      console.error('No active factory selected')
      return
    }
    const { error } = await supabase.from('shipping').insert({
      date: entry.date.toISOString(),
      client: entry.client,
      product: entry.product,
      quantity: entry.quantity,
      unit_price: entry.unitPrice,
      doc_ref: entry.docRef,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (error) console.error('Error adding shipping:', error)
    else fetchOperationalData()
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
    else fetchOperationalData()
  }

  const deleteShipping = async (id: string) => {
    const { error } = await supabase.from('shipping').delete().eq('id', id)
    if (error) console.error('Error deleting shipping:', error)
    else fetchOperationalData()
  }

  const addAcidityRecord = async (entry: Omit<AcidityEntry, 'id'>) => {
    if (!currentFactoryId) {
      console.error('No active factory selected')
      return
    }
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
      factory_id: currentFactoryId,
    })
    if (error) console.error('Error adding acidity record:', error)
    else fetchOperationalData()
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
    else fetchOperationalData()
  }

  const deleteAcidityRecord = async (id: string) => {
    const { error } = await supabase
      .from('acidity_records')
      .delete()
      .eq('id', id)
    if (error) console.error('Error deleting acidity record:', error)
    else fetchOperationalData()
  }

  const addQualityRecord = async (entry: Omit<QualityEntry, 'id'>) => {
    if (!currentFactoryId) {
      console.error('No active factory selected')
      return
    }
    const { error } = await supabase.from('quality_records').insert({
      date: entry.date.toISOString(),
      product: entry.product,
      acidity: entry.acidity,
      protein: entry.protein,
      responsible: entry.responsible,
      notes: entry.notes,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (error) console.error('Error adding quality record:', error)
    else fetchOperationalData()
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
    else fetchOperationalData()
  }

  const deleteQualityRecord = async (id: string) => {
    const { error } = await supabase
      .from('quality_records')
      .delete()
      .eq('id', id)
    if (error) console.error('Error deleting quality record:', error)
    else fetchOperationalData()
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
    else fetchGlobalData()
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
    else fetchGlobalData()
  }

  const deleteFactory = async (id: string) => {
    const { error } = await supabase.from('factories').delete().eq('id', id)
    if (error) console.error('Error deleting factory:', error)
    else {
      // If deleting current factory, switch to another if available
      if (id === currentFactoryId) {
        const remaining = factories.filter((f) => f.id !== id)
        if (remaining.length > 0) {
          setCurrentFactoryId(remaining[0].id)
        } else {
          setCurrentFactoryId('')
        }
      }
      fetchGlobalData()
    }
  }

  // --- Integration Handlers ---

  const updateProtheusConfig = async (config: ProtheusConfig) => {
    // Optimistic update
    setProtheusConfig(config)

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
    fetchGlobalData()
  }

  // --- Notification Handlers ---

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings)
    setYieldTargets({
      sebo: settings.seboThreshold,
      fco: settings.farinhaThreshold,
      farinheta: settings.farinhetaThreshold,
      total: settings.yieldThreshold,
    })

    const dataToUpsert = {
      email_enabled: settings.emailEnabled,
      sms_enabled: settings.smsEnabled,
      yield_threshold: settings.yieldThreshold,
      sebo_threshold: settings.seboThreshold,
      farinheta_threshold: settings.farinhetaThreshold,
      farinha_threshold: settings.farinha_threshold,
      notification_email: settings.notificationEmail,
      notification_phone: settings.notificationPhone,
      brevo_api_key: settings.brevoApiKey,
      smtp_host: settings.smtpHost,
      smtp_port: settings.smtpPort,
      smtp_user: settings.smtpUser,
      smtp_password: settings.smtpPassword,
      user_id: user?.id,
    }

    if (settings.id) {
      await supabase
        .from('notification_settings')
        .update(dataToUpsert)
        .eq('id', settings.id)
    } else {
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('notification_settings')
          .update(dataToUpsert)
          .eq('id', existing.id)
      } else {
        await supabase.from('notification_settings').insert(dataToUpsert)
      }
    }
    fetchGlobalData()
  }

  const updateYieldTargets = async (targets: YieldTargets) => {
    const updatedSettings = {
      ...notificationSettings,
      seboThreshold: targets.sebo,
      farinhaThreshold: targets.fco,
      farinhetaThreshold: targets.farinheta,
      yieldThreshold: targets.total,
    }
    await updateNotificationSettings(updatedSettings)
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
      await fetchOperationalData()
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    }
  }

  const clearAllData = async () => {
    if (!user) return

    // Clear data from operational tables only for the current user
    // RLS handles the isolation, but we explicit filter by user_id for safety
    await Promise.all([
      supabase.from('raw_materials').delete().eq('user_id', user.id),
      supabase.from('production').delete().eq('user_id', user.id),
      supabase.from('shipping').delete().eq('user_id', user.id),
      supabase.from('acidity_records').delete().eq('user_id', user.id),
      supabase.from('quality_records').delete().eq('user_id', user.id),
    ])

    fetchOperationalData()
  }

  // Legacy/Mock functions
  const addUserAccess = () => {}
  const updateUserAccess = () => {}
  const deleteUserAccess = () => {}
  const login = () => {}
  const checkPermission = () => true
  const toggleDeveloperMode = () => {}
  const setViewerMode = () => {}

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
        updateYieldTargets,

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
