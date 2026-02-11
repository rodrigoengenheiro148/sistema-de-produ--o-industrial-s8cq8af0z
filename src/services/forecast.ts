import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export const saveForecast = async (
  date: Date,
  mpForecast: number,
  materialType: string,
  factoryId: string,
  userId: string,
) => {
  const dateStr = format(date, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('daily_production_forecasts')
    .upsert(
      {
        date: dateStr,
        mp_forecast: mpForecast,
        material_type: materialType,
        factory_id: factoryId,
        user_id: userId,
      },
      { onConflict: 'factory_id,date,material_type' },
    )

  if (error) throw error
  return data
}

export const deleteForecast = async (id: string) => {
  const { error } = await supabase
    .from('daily_production_forecasts')
    .delete()
    .eq('id', id)

  if (error) throw error
}
