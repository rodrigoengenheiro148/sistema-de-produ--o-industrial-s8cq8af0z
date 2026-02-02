import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

const escapeCsvField = (value: any): string => {
  if (value === null || value === undefined) {
    return ''
  }

  let stringValue = ''

  if (value instanceof Date) {
    stringValue = format(value, 'yyyy-MM-dd HH:mm:ss')
  } else if (typeof value === 'string') {
    // Check if it's an ISO date
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        stringValue = format(d, 'yyyy-MM-dd HH:mm:ss')
      } else {
        stringValue = value
      }
    } else {
      stringValue = value
    }
  } else if (typeof value === 'object') {
    try {
      stringValue = JSON.stringify(value)
    } catch {
      stringValue = '[Object]'
    }
  } else {
    stringValue = String(value)
  }

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

const downloadCsv = (data: any[], columns: string[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado encontrado para exportação')
  }

  const headerRow = columns.map((h) => `"${h}"`).join(',')
  const rows = data.map((row) => {
    return columns.map((col) => escapeCsvField(row[col])).join(',')
  })

  const csvContent = [headerRow, ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportProcessReport = async (
  reportType: string,
  factoryId: string,
) => {
  let data: any[] = []
  let columns: string[] = []
  let filename = ''

  switch (reportType) {
    case 'yield_performance': {
      filename = 'performance_rendimentos'
      const { data: production, error } = await supabase
        .from('production')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Turno',
        'Matéria-Prima (kg)',
        'Sebo (kg)',
        'Rendimento Sebo (%)',
        'FCO (kg)',
        'Rendimento FCO (%)',
        'Farinheta (kg)',
        'Rendimento Farinheta (%)',
        'Perdas (kg)',
      ]

      data = production.map((p) => {
        const mp = p.mp_used || 0
        return {
          Data: p.date,
          Turno: p.shift,
          'Matéria-Prima (kg)': mp,
          'Sebo (kg)': p.sebo_produced,
          'Rendimento Sebo (%)':
            mp > 0 ? ((p.sebo_produced / mp) * 100).toFixed(2) : '0.00',
          'FCO (kg)': p.fco_produced,
          'Rendimento FCO (%)':
            mp > 0 ? ((p.fco_produced / mp) * 100).toFixed(2) : '0.00',
          'Farinheta (kg)': p.farinheta_produced,
          'Rendimento Farinheta (%)':
            mp > 0 ? ((p.farinheta_produced / mp) * 100).toFixed(2) : '0.00',
          'Perdas (kg)': p.losses,
        }
      })
      break
    }

    case 'yield_history': {
      filename = 'historico_rendimentos'
      const { data: production, error } = await supabase
        .from('production')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Turno',
        'Matéria-Prima (kg)',
        'Sebo Produzido (kg)',
        'FCO Produzido (kg)',
        'Farinheta Produzida (kg)',
        'Perdas (kg)',
        'Registrado Em',
      ]

      data = production.map((p) => ({
        Data: p.date,
        Turno: p.shift,
        'Matéria-Prima (kg)': p.mp_used,
        'Sebo Produzido (kg)': p.sebo_produced,
        'FCO Produzido (kg)': p.fco_produced,
        'Farinheta Produzida (kg)': p.farinheta_produced,
        'Perdas (kg)': p.losses,
        'Registrado Em': p.created_at,
      }))
      break
    }

    case 'daily_acidity': {
      filename = 'acidez_diaria'
      const { data: acidity, error } = await supabase
        .from('acidity_records')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Hora',
        'Tanque',
        'Acidez (%)',
        'Volume',
        'Peso',
        'Vezes Executado',
        'Responsável',
        'Observações',
      ]

      data = acidity.map((a) => ({
        Data: a.date,
        Hora: a.time,
        Tanque: a.tank,
        'Acidez (%)': a.acidity,
        Volume: a.volume,
        Peso: a.weight,
        'Vezes Executado': a.performed_times,
        Responsável: a.responsible,
        Observações: a.notes,
      }))
      break
    }

    case 'measurement_evolution': {
      filename = 'evolucao_medicoes'
      const { data: quality, error } = await supabase
        .from('quality_records')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Produto',
        'Proteína (%)',
        'Acidez (%)',
        'Responsável',
        'Observações',
      ]

      data = quality.map((q) => ({
        Data: q.date,
        Produto: q.product,
        'Proteína (%)': q.protein,
        'Acidez (%)': q.acidity,
        Responsável: q.responsible,
        Observações: q.notes,
      }))
      break
    }

    case 'sebo_stock_evolution': {
      filename = 'evolucao_estoque_sebo'
      const { data: stock, error } = await supabase
        .from('sebo_inventory_records')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Tanque',
        'Categoria',
        'Quantidade (kg)',
        'Quantidade (L)',
        'Acidez',
        'Umidade',
        'Impureza',
        'Sabões',
        'Iodo',
      ]

      data = stock.map((s) => ({
        Data: s.date,
        Tanque: s.tank_number,
        Categoria: s.category,
        'Quantidade (kg)': s.quantity_kg,
        'Quantidade (L)': s.quantity_lt,
        Acidez: s.acidity,
        Umidade: s.moisture,
        Impureza: s.impurity,
        Sabões: s.soaps,
        Iodo: s.iodine,
      }))
      break
    }

    case 'hourly_production': {
      filename = 'producao_por_hora'
      const { data: production, error } = await supabase
        .from('production')
        .select('*')
        .eq('factory_id', factoryId)
        .order('created_at', { ascending: false })

      if (error) throw error

      columns = [
        'Data Referência',
        'Hora Registro',
        'Turno',
        'Produção Total (kg)',
        'Sebo (kg)',
        'FCO (kg)',
        'Farinheta (kg)',
      ]

      data = production.map((p) => {
        const total =
          (p.sebo_produced || 0) +
          (p.fco_produced || 0) +
          (p.farinheta_produced || 0)
        let horaRegistro = ''
        if (p.created_at) {
          const d = new Date(p.created_at)
          horaRegistro = format(d, 'HH:mm')
        }

        return {
          'Data Referência': p.date,
          'Hora Registro': horaRegistro,
          Turno: p.shift,
          'Produção Total (kg)': total,
          'Sebo (kg)': p.sebo_produced,
          'FCO (kg)': p.fco_produced,
          'Farinheta (kg)': p.farinheta_produced,
        }
      })
      break
    }

    case 'process_status': {
      filename = 'estado_processo'
      const { data: cooking, error: errCooking } = await supabase
        .from('cooking_time_records')
        .select('*')
        .eq('factory_id', factoryId)

      const { data: downtime, error: errDowntime } = await supabase
        .from('downtime_records')
        .select('*')
        .eq('factory_id', factoryId)

      if (errCooking) throw errCooking
      if (errDowntime) throw errDowntime

      columns = [
        'Data',
        'Tipo Evento',
        'Hora Início',
        'Hora Fim',
        'Duração (Horas)',
        'Detalhes/Motivo',
      ]

      const cookingEvents = (cooking || []).map((c) => {
        let duration = 0
        if (c.start_time && c.end_time) {
          const [sh, sm] = c.start_time.split(':').map(Number)
          const [eh, em] = c.end_time.split(':').map(Number)
          duration = (eh * 60 + em - (sh * 60 + sm)) / 60
          if (duration < 0) duration += 24 // Handle overnight
        }

        return {
          dateObj: new Date(`${c.date}T${c.start_time}:00`),
          Data: c.date,
          'Tipo Evento': 'Cozimento',
          'Hora Início': c.start_time,
          'Hora Fim': c.end_time || 'Em andamento',
          'Duração (Horas)': duration.toFixed(2),
          'Detalhes/Motivo': 'Ciclo de processo normal',
        }
      })

      const downtimeEvents = (downtime || []).map((d) => {
        let startTimeStr = ''
        let endTimeStr = ''

        if (d.start_time) {
          const ds = new Date(d.start_time)
          startTimeStr = format(ds, 'HH:mm')
        }
        if (d.end_time) {
          const de = new Date(d.end_time)
          endTimeStr = format(de, 'HH:mm')
        }

        return {
          dateObj: new Date(`${d.date}T12:00:00`), // Fallback for sort
          Data: d.date,
          'Tipo Evento': 'Parada',
          'Hora Início': startTimeStr || '-',
          'Hora Fim': endTimeStr || '-',
          'Duração (Horas)': d.duration_hours.toFixed(2),
          'Detalhes/Motivo': d.reason,
        }
      })

      data = [...cookingEvents, ...downtimeEvents].sort(
        (a, b) => b.dateObj.getTime() - a.dateObj.getTime(),
      )
      break
    }

    case 'steam_control': {
      filename = 'controle_vapor'
      const { data: steam, error } = await supabase
        .from('steam_control_records')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false })

      if (error) throw error

      columns = [
        'Data',
        'Lenha (m³)',
        'Cavaco (ton)',
        'Casca de Arroz (ton)',
        'Resíduo Soja (ton)',
        'Consumo Vapor (ton)',
        'Leitura Inicial',
        'Leitura Final',
      ]

      data = steam.map((s) => ({
        Data: s.date,
        'Lenha (m³)': s.firewood,
        'Cavaco (ton)': s.wood_chips,
        'Casca de Arroz (ton)': s.rice_husk,
        'Resíduo Soja (ton)': s.soy_waste,
        'Consumo Vapor (ton)': s.steam_consumption,
        'Leitura Inicial': s.meter_start,
        'Leitura Final': s.meter_end,
      }))
      break
    }

    default:
      throw new Error('Tipo de relatório inválido')
  }

  downloadCsv(data, columns, filename)
}
