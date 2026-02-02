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
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching sebo inventory:', error)
    throw error
  }

  return data.map((item: any) => ({
    id: item.id,
    factoryId: item.factory_id,
    userId: item.user_id,
    date: new Date(item.date),
    tankNumber: item.tank_number || '',
    quantityLt: Number(item.quantity_lt) || 0,
    quantityKg: Number(item.quantity_kg) || 0,
    acidity: item.acidity !== null ? Number(item.acidity) : undefined,
    moisture: item.moisture !== null ? Number(item.moisture) : undefined,
    impurity: item.impurity !== null ? Number(item.impurity) : undefined,
    soaps: item.soaps !== null ? Number(item.soaps) : undefined,
    iodine: item.iodine !== null ? Number(item.iodine) : undefined,
    label: item.label,
    category: item.category,
    description: item.description || '',
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
    tankNumber: item.tank_number || '',
    quantityLt: Number(item.quantity_lt) || 0,
    quantityKg: Number(item.quantity_kg) || 0,
    acidity: item.acidity !== null ? Number(item.acidity) : undefined,
    moisture: item.moisture !== null ? Number(item.moisture) : undefined,
    impurity: item.impurity !== null ? Number(item.impurity) : undefined,
    soaps: item.soaps !== null ? Number(item.soaps) : undefined,
    iodine: item.iodine !== null ? Number(item.iodine) : undefined,
    label: item.label,
    category: item.category,
    description: item.description || '',
    createdAt: new Date(item.created_at),
  }))
}

export const saveSeboInventory = async (records: SeboInventoryRecord[]) => {
  // Validate mandatory fields for all records
  const invalidRecords = records.filter(
    (r) => !r.factoryId || !r.userId || !r.date,
  )

  if (invalidRecords.length > 0) {
    throw new Error(
      'Dados incompletos: Fábrica, Usuário ou Data não identificados.',
    )
  }

  const recordsToSave = records.map((r) => ({
    id: r.id, // Include ID if it exists for upsert
    factory_id: r.factoryId,
    user_id: r.userId,
    date: format(r.date, 'yyyy-MM-dd'),
    tank_number: r.tankNumber || null,
    quantity_lt: r.quantityLt || 0,
    quantity_kg: r.quantityKg || 0,
    acidity: r.acidity !== undefined ? r.acidity : null,
    moisture: r.moisture !== undefined ? r.moisture : null,
    impurity: r.impurity !== undefined ? r.impurity : null,
    soaps: r.soaps !== undefined ? r.soaps : null,
    iodine: r.iodine !== undefined ? r.iodine : null,
    // Mapping description to 'description' column as per acceptance criteria
    // Also mapping description to 'label' for backward compatibility if needed, but primarily relying on description
    label: r.label || null,
    category: r.category,
    description: r.description || null,
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
