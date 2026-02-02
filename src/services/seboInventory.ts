import { supabase } from '@/lib/supabase/client'
import { SeboInventoryRecord } from '@/lib/types'
import { format } from 'date-fns'

export const fetchSeboInventory = async (
  date: Date,
  factoryId: string,
): Promise<SeboInventoryRecord[]> => {
  const dateStr = format(date, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('sebo_inventory_records')
    .select('*')
    .eq('factory_id', factoryId)
    .eq('date', dateStr)
    .order('tank_number', { ascending: true })

  if (error) {
    console.error('Error fetching sebo inventory:', error)
    throw error
  }

  return data.map((item: any) => ({
    id: item.id,
    factoryId: item.factory_id,
    userId: item.user_id,
    date: new Date(item.date),
    tankNumber: item.tank_number,
    quantityLt: item.quantity_lt,
    quantityKg: item.quantity_kg,
    acidity: item.acidity,
    moisture: item.moisture,
    impurity: item.impurity,
    soaps: item.soaps,
    iodine: item.iodine,
    label: item.label,
    category: item.category,
    description: item.description,
    createdAt: new Date(item.created_at),
  }))
}

export const fetchSeboInventoryHistory = async (
  startDate: Date,
  endDate: Date,
  factoryId: string,
): Promise<SeboInventoryRecord[]> => {
  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr = format(endDate, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('sebo_inventory_records')
    .select('*')
    .eq('factory_id', factoryId)
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching sebo inventory history:', error)
    throw error
  }

  return data.map((item: any) => ({
    id: item.id,
    factoryId: item.factory_id,
    userId: item.user_id,
    date: new Date(item.date),
    tankNumber: item.tank_number,
    quantityLt: item.quantity_lt,
    quantityKg: item.quantity_kg,
    acidity: item.acidity,
    moisture: item.moisture,
    impurity: item.impurity,
    soaps: item.soaps,
    iodine: item.iodine,
    label: item.label,
    category: item.category,
    description: item.description,
    createdAt: new Date(item.created_at),
  }))
}

export const saveSeboInventory = async (records: SeboInventoryRecord[]) => {
  const recordsToSave = records.map((r) => ({
    id: r.id, // Include ID if it exists for upsert
    factory_id: r.factoryId,
    user_id: r.userId,
    date: format(r.date, 'yyyy-MM-dd'),
    tank_number: r.tankNumber,
    quantity_lt: r.quantityLt,
    quantity_kg: r.quantityKg,
    acidity: r.acidity,
    moisture: r.moisture,
    impurity: r.impurity,
    soaps: r.soaps,
    iodine: r.iodine,
    label: r.label,
    category: r.category,
    description: r.description,
  }))

  const { data, error } = await supabase
    .from('sebo_inventory_records')
    .upsert(recordsToSave, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('Error saving sebo inventory:', error)
    throw error
  }

  return data
}

export const deleteSeboInventoryRecord = async (id: string) => {
  const { error } = await supabase
    .from('sebo_inventory_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}
