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
  YieldTargets,
  NotificationSettings,
  CookingTimeRecord,
  DowntimeRecord,
  DailyProductionForecast,
  SteamControlEntry,
  ReturnEntry,
} from '@/lib/types'
import { startOfMonth, endOfMonth, startOfDay, subDays, format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { RealtimeChannel } from '@supabase/supabase-js'
import { saveForecast, deleteForecast } from '@/services/forecast'
import { parseAsLocalNoon } from '@/lib/utils'

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
  fcoThreshold: 0,
  notificationEmail: '',
  notificationPhone: '',
  brevoApiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
}

const mapData = (data: any[]) => {
  return data.map((item) => ({
    ...item,
    date: parseAsLocalNoon(item.date),
    createdAt: item.created_at ? new Date(item.created_at) : undefined,
    mpUsed: Number(item.mp_used || 0),
    seboProduced: Number(item.sebo_produced || 0),
    fcoProduced: Number(item.fco_produced || 0),
    farinhetaProduced: Number(item.farinheta_produced || 0),
    bloodMealProduced: Number(item.blood_meal_produced || 0),
    bloodMealBags: Number(item.blood_meal_bags || 0),
    unitPrice: Number(item.unit_price || 0),
    docRef: item.doc_ref,
    performedTimes: item.performed_times,
    factoryId: item.factory_id,
    startTime: item.start_time
      ? typeof item.start_time === 'string' && item.start_time.includes('T')
        ? new Date(item.start_time)
        : item.start_time
      : undefined,
    endTime: item.end_time
      ? typeof item.end_time === 'string' && item.end_time.includes('T')
        ? new Date(item.end_time)
        : item.end_time
      : undefined,
    durationHours: Number(item.duration_hours || 0),
    totalHours: item.total_hours ? Number(item.total_hours) : undefined,
    soyWaste: Number(item.soy_waste || 0),
    firewood: Number(item.firewood || 0),
    riceHusk: Number(item.rice_husk || 0),
    woodChips: Number(item.wood_chips || 0),
    meterStart: Number(item.meter_start || 0),
    meterEnd: Number(item.meter_end || 0),
    steamConsumption: Number(item.steam_consumption || 0),
    quantity: Number(item.quantity || 0),
    value: Number(item.value || 0),
  }))
}

// Robust retry utility for data fetching
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return withRetry(fn, retries - 1, delay * 1.5)
  }
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const operationalChannelRef = useRef<RealtimeChannel | null>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [currentFactoryId, setCurrentFactoryId] = useState<string>(() => {
    return localStorage.getItem('currentFactoryId') || ''
  })

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
  const [cookingTimeRecords, setCookingTimeRecords] = useState<
    CookingTimeRecord[]
  >([])
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>([])
  const [steamControlRecords, setSteamControlRecords] = useState<
    SteamControlEntry[]
  >([])
  const [dailyForecasts, setDailyForecasts] = useState<
    DailyProductionForecast[]
  >([])
  const [returns, setReturns] = useState<ReturnEntry[]>([])

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
    apiToken: '',
    apiDocumentationUrl: '',
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

  const fetchGlobalData = useCallback(async () => {
    if (!user?.id) return

    try {
      // Use retry mechanism for improved reliability
      await withRetry(async () => {
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
          setFactories(mapData(fact))
        }

        if (integration) {
          const configData = integration as any
          setProtheusConfig({
            id: configData.id,
            baseUrl: configData.base_url || '',
            clientId: configData.client_id || '',
            clientSecret: configData.client_secret || '',
            username: configData.username || '',
            password: configData.password || '',
            syncInventory: configData.sync_inventory || false,
            syncProduction: configData.sync_production || false,
            isActive: configData.is_active || false,
            apiToken: configData.api_token || '',
            apiDocumentationUrl: configData.api_documentation_url || '',
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
            fcoThreshold:
              notifications.fco_threshold ||
              notifications.farinha_threshold ||
              0,
            notificationEmail: notifications.notification_email || '',
            notificationPhone: notifications.notification_phone || '',
            brevoApiKey: notifications.brevo_api_key || '',
            smtpHost: notifications.smtp_host || '',
            smtpPort: notifications.smtp_port || 587,
            smtpUser: notifications.smtp_user || '',
            smtpPassword: notifications.smtp_password || '',
          }
          setNotificationSettings(settings)
          setYieldTargets({
            sebo: settings.seboThreshold || DEFAULT_YIELD_TARGETS.sebo,
            fco:
              settings.fcoThreshold ||
              settings.farinhaThreshold ||
              DEFAULT_YIELD_TARGETS.fco,
            farinheta:
              settings.farinhetaThreshold || DEFAULT_YIELD_TARGETS.farinheta,
            total: settings.yieldThreshold || DEFAULT_YIELD_TARGETS.total,
          })
        }
      })
    } catch (error) {
      console.error('Error fetching global data:', error)
      // We don't block the UI here, just log error.
      // Connection status will handle UI feedback.
    }
  }, [user?.id])

  useEffect(() => {
    if (factories.length > 0) {
      const isValid = factories.some((f) => f.id === currentFactoryId)
      if (!isValid || !currentFactoryId) {
        setCurrentFactoryId(factories[0].id)
      }
    }
  }, [factories, currentFactoryId])

  const fetchOperationalData = useCallback(async () => {
    if (!user?.id || !currentFactoryId) {
      setRawMaterials([])
      setProduction([])
      setShipping([])
      setAcidityRecords([])
      setQualityRecords([])
      setCookingTimeRecords([])
      setDowntimeRecords([])
      setSteamControlRecords([])
      setDailyForecasts([])
      setReturns([])
      return
    }

    try {
      // Use retry mechanism for operational data
      await withRetry(async () => {
        // Prepare date filters
        const fromDateStr = dateRange.from
          ? format(startOfDay(subDays(dateRange.from, 1)), 'yyyy-MM-dd')
          : undefined
        const toDateStr = dateRange.to
          ? format(dateRange.to, 'yyyy-MM-dd')
          : undefined

        const applyFilters = (query: any) => {
          let q = query.eq('factory_id', currentFactoryId)
          if (fromDateStr) q = q.gte('date', fromDateStr)
          if (toDateStr) q = q.lte('date', toDateStr)
          return q.order('date', { ascending: false })
        }

        const [
          { data: raw },
          { data: prod },
          { data: ship },
          { data: acid },
          { data: qual },
          { data: cooking },
          { data: downtime },
          { data: steam },
          { data: forecasts },
          { data: rets },
        ] = await Promise.all([
          applyFilters(supabase.from('raw_materials').select('*')),
          applyFilters(supabase.from('production').select('*')),
          applyFilters(supabase.from('shipping').select('*')),
          applyFilters(supabase.from('acidity_records').select('*')),
          applyFilters(supabase.from('quality_records').select('*')),
          applyFilters(supabase.from('cooking_time_records').select('*')),
          applyFilters(supabase.from('downtime_records').select('*')),
          applyFilters(supabase.from('steam_control_records').select('*')),
          applyFilters(supabase.from('daily_production_forecasts').select('*')),
          applyFilters(supabase.from('returns').select('*')),
        ])

        if (raw) setRawMaterials(mapData(raw))
        if (prod) setProduction(mapData(prod))
        if (ship) setShipping(mapData(ship))
        if (acid) setAcidityRecords(mapData(acid))
        if (qual) setQualityRecords(mapData(qual))
        if (cooking) setCookingTimeRecords(mapData(cooking))
        if (downtime) setDowntimeRecords(mapData(downtime))
        if (steam) setSteamControlRecords(mapData(steam))
        if (forecasts) {
          setDailyForecasts(
            forecasts.map((f: any) => ({
              id: f.id,
              factoryId: f.factory_id,
              date: parseAsLocalNoon(f.date),
              mpForecast: Number(f.mp_forecast || 0),
              materialType: f.material_type,
              userId: f.user_id,
              createdAt: f.created_at ? new Date(f.created_at) : undefined,
            })),
          )
        }
        if (rets) {
          setReturns(
            rets.map((r: any) => ({
              id: r.id,
              date: parseAsLocalNoon(r.date),
              supplier: r.supplier,
              quantity: Number(r.quantity || 0),
              description: r.description,
              value: Number(r.value || 0),
              factoryId: r.factory_id,
              userId: r.user_id,
              createdAt: r.created_at ? new Date(r.created_at) : undefined,
            })),
          )
        }

        setLastProtheusSync(new Date())
        setConnectionStatus('online')
      })
    } catch (error) {
      console.error('Error fetching operational data after retries:', error)
      setConnectionStatus('error')
      // Important: Don't clear data on temporary fetch failure to avoid flickering
      // Keep displaying old data if available (React state is persistent)
    }
  }, [user?.id, currentFactoryId, dateRange])

  useEffect(() => {
    if (!user) {
      setFactories([])
      setConnectionStatus('offline')
      return
    }
    setConnectionStatus('syncing')
    fetchGlobalData()
      .then(() => setConnectionStatus('online'))
      .catch(() => setConnectionStatus('error'))
  }, [user, fetchGlobalData])

  useEffect(() => {
    if (currentFactoryId) {
      fetchOperationalData()
    }
  }, [currentFactoryId, fetchOperationalData])

  const handleRealtimeUpdate = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Add jitter (0-2000ms) to base delay (1000ms) to prevent thundering herd
    // from 50+ concurrent clients hitting the DB simultaneously
    const jitter = Math.floor(Math.random() * 2000)
    const delay = 1000 + jitter

    refreshTimeoutRef.current = setTimeout(() => {
      console.log(`Refreshing operational data (jitter delay: ${delay}ms)...`)
      fetchOperationalData()
    }, delay)
  }, [fetchOperationalData])

  useEffect(() => {
    if (!user?.id || !currentFactoryId) return

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(currentFactoryId)) {
      console.warn('Invalid Factory ID for subscription:', currentFactoryId)
      return
    }

    const normalizedFactoryId = currentFactoryId.toLowerCase()
    const channelName = `operational-data-${normalizedFactoryId}`
    const channel = supabase.channel(channelName)

    const tables = [
      'raw_materials',
      'production',
      'shipping',
      'acidity_records',
      'quality_records',
      'cooking_time_records',
      'downtime_records',
      'steam_control_records',
      'daily_production_forecasts',
      'returns',
    ]

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `factory_id=eq.${normalizedFactoryId}`,
        },
        () => handleRealtimeUpdate(),
      )
    })

    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to realtime channel: ${channelName}`)
        setConnectionStatus('online')
      } else if (status === 'CHANNEL_ERROR') {
        console.warn(`Realtime subscription issue on ${channelName}`)
        // Don't set error status just for realtime failure, as long as fetch works
      } else if (status === 'TIMED_OUT') {
        console.warn(`Realtime subscription timed out on ${channelName}`)
      }
    })

    operationalChannelRef.current = channel

    return () => {
      if (operationalChannelRef.current) {
        supabase.removeChannel(operationalChannelRef.current)
        operationalChannelRef.current = null
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [user?.id, currentFactoryId, handleRealtimeUpdate])

  // CRUD Operations...
  const addRawMaterial = async (entry: Omit<RawMaterialEntry, 'id'>) => {
    if (!currentFactoryId) return
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
    if (!error) fetchOperationalData()
  }

  const bulkAddRawMaterials = async (
    entries: Omit<RawMaterialEntry, 'id'>[],
  ) => {
    if (!currentFactoryId || !user?.id) return
    const dbEntries = entries.map((entry) => ({
      date: entry.date.toISOString(),
      supplier: entry.supplier,
      type: entry.type,
      quantity: entry.quantity,
      unit: entry.unit,
      notes: entry.notes,
      user_id: user.id,
      factory_id: currentFactoryId,
    }))
    const { error } = await supabase.from('raw_materials').insert(dbEntries)
    if (error) throw error
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
    if (!error) fetchOperationalData()
  }

  const deleteRawMaterial = async (id: string) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addProduction = async (entry: Omit<ProductionEntry, 'id'>) => {
    const targetFactoryId = entry.factoryId || currentFactoryId
    if (!targetFactoryId) return
    const { error } = await supabase.from('production').insert({
      date: entry.date.toISOString(),
      shift: entry.shift,
      mp_used: entry.mpUsed,
      sebo_produced: entry.seboProduced,
      fco_produced: entry.fcoProduced,
      farinheta_produced: entry.farinhetaProduced,
      blood_meal_produced: entry.bloodMealProduced,
      blood_meal_bags: entry.bloodMealBags,
      losses: entry.losses,
      user_id: user?.id,
      factory_id: targetFactoryId,
    })
    if (!error) fetchOperationalData()
  }

  const updateProduction = async (entry: ProductionEntry) => {
    const payload: any = {
      date: entry.date.toISOString(),
      shift: entry.shift,
      mp_used: entry.mpUsed,
      sebo_produced: entry.seboProduced,
      fco_produced: entry.fcoProduced,
      farinheta_produced: entry.farinhetaProduced,
      blood_meal_produced: entry.bloodMealProduced,
      blood_meal_bags: entry.bloodMealBags,
      losses: entry.losses,
    }

    if (entry.factoryId) {
      payload.factory_id = entry.factoryId
    }

    const { error } = await supabase
      .from('production')
      .update(payload)
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteProduction = async (id: string) => {
    const { error } = await supabase.from('production').delete().eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addShipping = async (entry: Omit<ShippingEntry, 'id'>) => {
    if (!currentFactoryId) return
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
    if (!error) fetchOperationalData()
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
    if (!error) fetchOperationalData()
  }

  const deleteShipping = async (id: string) => {
    const { error } = await supabase.from('shipping').delete().eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addAcidityRecord = async (entry: Omit<AcidityEntry, 'id'>) => {
    if (!currentFactoryId) return
    const { error } = await supabase.from('acidity_records').insert({
      date: entry.date.toISOString(),
      time: entry.time,
      responsible: entry.responsible,
      weight: entry.weight,
      volume: entry.volume,
      acidity: entry.acidity,
      tank: entry.tank,
      performed_times: entry.performedTimes,
      notes: entry.notes,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (!error) fetchOperationalData()
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
        acidity: entry.acidity,
        tank: entry.tank,
        performed_times: entry.performedTimes,
        notes: entry.notes,
      })
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteAcidityRecord = async (id: string) => {
    const { error } = await supabase
      .from('acidity_records')
      .delete()
      .eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addQualityRecord = async (entry: Omit<QualityEntry, 'id'>) => {
    if (!currentFactoryId) return
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
    if (!error) fetchOperationalData()
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
    if (!error) fetchOperationalData()
  }

  const deleteQualityRecord = async (id: string) => {
    const { error } = await supabase
      .from('quality_records')
      .delete()
      .eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addCookingTimeRecord = async (entry: Omit<CookingTimeRecord, 'id'>) => {
    if (!currentFactoryId) return
    const { error } = await supabase.from('cooking_time_records').insert({
      date: entry.date.toISOString(),
      start_time: entry.startTime,
      end_time: entry.endTime,
      total_hours: entry.totalHours,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (!error) fetchOperationalData()
  }

  const updateCookingTimeRecord = async (entry: CookingTimeRecord) => {
    const { error } = await supabase
      .from('cooking_time_records')
      .update({
        date: entry.date.toISOString(),
        start_time: entry.startTime,
        end_time: entry.endTime,
        total_hours: entry.totalHours,
      })
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteCookingTimeRecord = async (id: string) => {
    const { error } = await supabase
      .from('cooking_time_records')
      .delete()
      .eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addDowntimeRecord = async (entry: Omit<DowntimeRecord, 'id'>) => {
    if (!currentFactoryId) return
    const { error } = await supabase.from('downtime_records').insert({
      date: entry.date.toISOString(),
      duration_hours: entry.durationHours,
      reason: entry.reason,
      start_time: entry.startTime?.toISOString(),
      end_time: entry.endTime?.toISOString(),
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (!error) fetchOperationalData()
  }

  const updateDowntimeRecord = async (entry: DowntimeRecord) => {
    const { error } = await supabase
      .from('downtime_records')
      .update({
        date: entry.date.toISOString(),
        duration_hours: entry.durationHours,
        reason: entry.reason,
        start_time: entry.startTime?.toISOString(),
        end_time: entry.endTime?.toISOString(),
      })
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteDowntimeRecord = async (id: string) => {
    const { error } = await supabase
      .from('downtime_records')
      .delete()
      .eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addSteamControlRecord = async (
    entry: Omit<SteamControlEntry, 'id'>,
  ) => {
    if (!currentFactoryId) return
    const { error } = await supabase.from('steam_control_records').insert({
      date: entry.date.toISOString(),
      soy_waste: entry.soyWaste,
      firewood: entry.firewood,
      rice_husk: entry.riceHusk,
      wood_chips: entry.woodChips,
      meter_start: entry.meterStart,
      meter_end: entry.meterEnd,
      steam_consumption: entry.steamConsumption,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })
    if (!error) fetchOperationalData()
  }

  const updateSteamControlRecord = async (entry: SteamControlEntry) => {
    const { error } = await supabase
      .from('steam_control_records')
      .update({
        date: entry.date.toISOString(),
        soy_waste: entry.soyWaste,
        firewood: entry.firewood,
        rice_husk: entry.riceHusk,
        wood_chips: entry.woodChips,
        meter_start: entry.meterStart,
        meter_end: entry.meterEnd,
        steam_consumption: entry.steamConsumption,
      })
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteSteamControlRecord = async (id: string) => {
    const { error } = await supabase
      .from('steam_control_records')
      .delete()
      .eq('id', id)
    if (!error) fetchOperationalData()
  }

  const saveDailyForecast = async (
    date: Date,
    mpForecast: number,
    materialType: string = 'Geral',
  ) => {
    if (!currentFactoryId || !user?.id) return

    try {
      await saveForecast(
        date,
        mpForecast,
        materialType,
        currentFactoryId,
        user.id,
      )
      fetchOperationalData()
    } catch (error) {
      console.error('Error saving daily forecast:', error)
      throw error
    }
  }

  const deleteDailyForecast = async (id: string) => {
    try {
      await deleteForecast(id)
      fetchOperationalData()
    } catch (error) {
      console.error('Error deleting forecast:', error)
      throw error
    }
  }

  const addReturn = async (entry: Omit<ReturnEntry, 'id'>) => {
    if (!currentFactoryId) return
    const { error } = await supabase.from('returns').insert({
      date: entry.date.toISOString(),
      supplier: entry.supplier,
      quantity: entry.quantity,
      description: entry.description,
      value: entry.value,
      user_id: user?.id,
      factory_id: currentFactoryId,
    })

    if (!error) {
      // Trigger Alert if configured
      if (
        notificationSettings.emailEnabled ||
        notificationSettings.smsEnabled
      ) {
        supabase.functions.invoke('send-brevo-alert', {
          body: {
            returnData: {
              ...entry,
              date: entry.date.toISOString(),
            },
            type: 'return_alert',
            user_id: user?.id,
          },
        })
      }
      fetchOperationalData()
    }
  }

  const updateReturn = async (entry: ReturnEntry) => {
    const { error } = await supabase
      .from('returns')
      .update({
        date: entry.date.toISOString(),
        supplier: entry.supplier,
        quantity: entry.quantity,
        description: entry.description,
        value: entry.value,
      })
      .eq('id', entry.id)
    if (!error) fetchOperationalData()
  }

  const deleteReturn = async (id: string) => {
    const { error } = await supabase.from('returns').delete().eq('id', id)
    if (!error) fetchOperationalData()
  }

  const addFactory = async (entry: Omit<Factory, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('factories').insert({
      name: entry.name,
      location: entry.location,
      manager: entry.manager,
      status: entry.status,
      user_id: user?.id,
    })
    if (!error) fetchGlobalData()
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
    if (!error) fetchGlobalData()
  }

  const deleteFactory = async (id: string) => {
    const { error } = await supabase.from('factories').delete().eq('id', id)
    if (!error) {
      if (id === currentFactoryId) {
        const remaining = factories.filter((f) => f.id !== id)
        setCurrentFactoryId(remaining.length > 0 ? remaining[0].id : '')
      }
      fetchGlobalData()
    }
  }

  const updateProtheusConfig = async (config: ProtheusConfig) => {
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
      api_token: config.apiToken,
      api_documentation_url: config.apiDocumentationUrl,
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

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    setNotificationSettings(settings)
    setYieldTargets({
      sebo: settings.seboThreshold,
      fco: settings.fcoThreshold || settings.farinhaThreshold || 0,
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
      fco_threshold: settings.fcoThreshold,
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
    const updatedSettings: NotificationSettings = {
      ...notificationSettings,
      seboThreshold: targets.sebo,
      farinhaThreshold: targets.fco,
      fcoThreshold: targets.fco,
      farinhetaThreshold: targets.farinheta,
      yieldThreshold: targets.total,
    }
    await updateNotificationSettings(updatedSettings)
  }

  const testProtheusConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('protheus-sync', {
        body: { action: 'test-connection', config: protheusConfig },
      })
      if (error) throw error
      return { success: data.success, message: data.message }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao conectar com a Edge Function',
      }
    }
  }

  const syncProtheusData = async () => {
    try {
      await supabase.functions.invoke('protheus-sync', {
        body: { action: 'sync-data', config: protheusConfig },
      })
      await fetchOperationalData()
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    }
  }

  const clearAllData = async () => {
    if (!user) return
    await Promise.all([
      supabase.from('raw_materials').delete().eq('user_id', user.id),
      supabase.from('production').delete().eq('user_id', user.id),
      supabase.from('shipping').delete().eq('user_id', user.id),
      supabase.from('acidity_records').delete().eq('user_id', user.id),
      supabase.from('quality_records').delete().eq('user_id', user.id),
      supabase.from('cooking_time_records').delete().eq('user_id', user.id),
      supabase.from('downtime_records').delete().eq('user_id', user.id),
      supabase.from('steam_control_records').delete().eq('user_id', user.id),
      supabase
        .from('daily_production_forecasts')
        .delete()
        .eq('user_id', user.id),
      supabase.from('returns').delete().eq('user_id', user.id),
    ])
    fetchOperationalData()
  }

  return (
    <DataContext.Provider
      value={{
        rawMaterials,
        addRawMaterial,
        bulkAddRawMaterials,
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
        cookingTimeRecords,
        addCookingTimeRecord,
        updateCookingTimeRecord,
        deleteCookingTimeRecord,
        downtimeRecords,
        addDowntimeRecord,
        updateDowntimeRecord,
        deleteDowntimeRecord,
        steamControlRecords,
        addSteamControlRecord,
        updateSteamControlRecord,
        deleteSteamControlRecord,
        dailyForecasts,
        saveDailyForecast,
        deleteDailyForecast,
        returns,
        addReturn,
        updateReturn,
        deleteReturn,
        userAccessList,
        addUserAccess: () => {},
        updateUserAccess: () => {},
        deleteUserAccess: () => {},
        currentUser: null,
        login: () => {},
        checkPermission: () => true,
        factories,
        addFactory,
        updateFactory,
        deleteFactory,
        currentFactoryId,
        setCurrentFactoryId,
        dateRange,
        setDateRange,
        isDeveloperMode: false,
        toggleDeveloperMode: () => {},
        isViewerMode: false,
        setViewerMode: () => {},
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
        refreshOperationalData: fetchOperationalData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
