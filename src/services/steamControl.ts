import { supabase } from '@/lib/supabase/client'
import { SteamControlRecord } from '@/lib/types'
import { format } from 'date-fns'

export const mapSteamRecord = (item: any): SteamControlRecord => ({
  id: item.id,
  date: new Date(item.date),
  soyWaste: Number(item.soy_waste) || 0,
  firewood: Number(item.firewood) || 0,
  riceHusk: Number(item.rice_husk) || 0,
  woodChips: Number(item.wood_chips) || 0,
  steamConsumption: Number(item.steam_consumption) || 0,
  meterStart: Number(item.meter_start) || 0,
  meterEnd: Number(item.meter_end) || 0,
  factoryId: item.factory_id,
  userId: item.user_id,
  createdAt: new Date(item.created_at),
})

export const fetchSteamRecords = async (
  factoryId: string,
): Promise<SteamControlRecord[]> => {
  const { data, error } = await supabase
    .from('steam_control_records')
    .select('*')
    .eq('factory_id', factoryId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching steam records:', error)
    throw error
  }

  return data.map(mapSteamRecord)
}

export const saveSteamRecord = async (
  record: Omit<SteamControlRecord, 'id' | 'createdAt'> & { id?: string },
) => {
  const payload = {
    date: format(record.date, 'yyyy-MM-dd'),
    soy_waste: record.soyWaste,
    firewood: record.firewood,
    rice_husk: record.riceHusk,
    wood_chips: record.woodChips,
    steam_consumption: record.steamConsumption,
    meter_start: record.meterStart,
    meter_end: record.meterEnd,
    factory_id: record.factoryId,
    user_id: record.userId,
  }

  if (record.id) {
    const { data, error } = await supabase
      .from('steam_control_records')
      .update(payload)
      .eq('id', record.id)
      .select()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('steam_control_records')
      .insert(payload)
      .select()
    if (error) throw error
    return data
  }
}

export const deleteSteamRecord = async (id: string) => {
  const { error } = await supabase
    .from('steam_control_records')
    .delete()
    .eq('id', id)
  if (error) throw error
}
