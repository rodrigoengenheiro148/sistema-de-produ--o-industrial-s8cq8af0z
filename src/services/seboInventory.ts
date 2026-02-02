import { supabase } from '@/lib/supabase/client'
import { SeboInventoryRecord } from '@/lib/types'
import { format } from 'date-fns'

// Helper to generate UUID client-side if crypto.randomUUID is not available
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper to parse YYYY-MM-DD string to local Date object (00:00:00)
// This avoids timezone shifts that occur with new Date('YYYY-MM-DD') which is UTC
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date()
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const fetchSeboInventory = async (
  date: Date,
  factoryId: string,
  userId: string,
): Promise<SeboInventoryRecord[]> => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida.')
  }
  if (!factoryId) {
    throw new Error('Fábrica não selecionada.')
  }
  if (!userId) {
    throw new Error('Usuário não identificado.')
  }

  const dateStr = format(date, 'yyyy-MM-dd')

  try {
    const { data, error } = await supabase
      .from('sebo_inventory_records')
      .select('*')
      .eq('factory_id', factoryId)
      .eq('user_id', userId)
      .eq('date', dateStr)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return data.map((item: any) => ({
      id: item.id,
      factoryId: item.factory_id,
      userId: item.user_id,
      date: parseLocalDate(item.date),
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
  } catch (error: any) {
    console.error('Error fetching sebo inventory:', error)
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Falha na conexão com o servidor. Verifique sua conexão com a internet.',
      )
    }
    throw error
  }
}

export const fetchSeboInventoryHistory = async (
  startDate: Date,
  endDate: Date,
  factoryId: string,
): Promise<SeboInventoryRecord[]> => {
  if (!startDate || isNaN(startDate.getTime())) {
    throw new Error('Data inicial inválida.')
  }
  if (!endDate || isNaN(endDate.getTime())) {
    throw new Error('Data final inválida.')
  }
  if (!factoryId) {
    throw new Error('Fábrica não selecionada.')
  }

  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr = format(endDate, 'yyyy-MM-dd')

  try {
    const { data, error } = await supabase
      .from('sebo_inventory_records')
      .select('*')
      .eq('factory_id', factoryId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })

    if (error) {
      throw error
    }

    return data.map((item: any) => ({
      id: item.id,
      factoryId: item.factory_id,
      userId: item.user_id,
      date: parseLocalDate(item.date),
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
  } catch (error: any) {
    console.error('Error fetching sebo inventory history:', error)
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Não foi possível carregar o histórico. Verifique sua conexão.',
      )
    }
    throw error
  }
}

export const saveSeboInventory = async (records: SeboInventoryRecord[]) => {
  // Validate mandatory fields for all records
  const invalidRecords = records.filter(
    (r) => !r.factoryId || !r.userId || !r.date || isNaN(r.date.getTime()),
  )

  if (invalidRecords.length > 0) {
    throw new Error(
      'Dados incompletos: Fábrica, Usuário ou Data não identificados.',
    )
  }

  try {
    const recordsToSave = records.map((r) => {
      // Generate UUID for new records to ensure upsert works correctly with mixed insert/updates
      const id = r.id || generateUUID()

      return {
        id: id,
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
        label: r.label || null,
        category: r.category,
        description: r.description || null,
      }
    })

    const { data, error } = await supabase
      .from('sebo_inventory_records')
      .upsert(recordsToSave, { onConflict: 'id' })
      .select()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error('Error saving sebo inventory:', error)
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Falha ao salvar. Verifique sua conexão e tente novamente.',
      )
    }
    throw error
  }
}

export const deleteSeboInventoryRecord = async (id: string) => {
  if (!id) throw new Error('ID do registro inválido.')
  try {
    const { error } = await supabase
      .from('sebo_inventory_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error: any) {
    console.error('Error deleting record:', error)
    if (error.message === 'Failed to fetch') {
      throw new Error('Erro de conexão ao tentar deletar o registro.')
    }
    throw error
  }
}
