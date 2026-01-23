import { useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  isSameDay,
  isThisMonth,
  subDays,
  startOfMonth,
  endOfMonth,
  format,
  isWithinInterval,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Intent =
  | 'greeting'
  | 'factories'
  | 'production'
  | 'raw_material'
  | 'quality'
  | 'inventory'
  | 'shipping'
  | 'financial'
  | 'losses'
  | 'projection'
  | 'help'
  | 'unknown'

export function useRenderAI() {
  const {
    production,
    rawMaterials,
    qualityRecords,
    acidityRecords,
    factories,
    currentFactoryId,
    shipping,
    systemSettings,
    yieldTargets,
  } = useData()

  const [lastIntent, setLastIntent] = useState<Intent | null>(null)

  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatNumber = (val: number) => val.toLocaleString('pt-BR')

  const processQuery = async (query: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    const q = query.toLowerCase()

    // --- Helper for Date Filtering ---
    const getPeriodData = (data: any[], dateField: string = 'date') => {
      const now = new Date()
      if (q.includes('ontem')) {
        const yesterday = subDays(now, 1)
        return {
          data: data.filter((item) => isSameDay(item[dateField], yesterday)),
          label: 'de ontem',
        }
      }
      if (q.includes('hoje')) {
        return {
          data: data.filter((item) => isSameDay(item[dateField], now)),
          label: 'de hoje',
        }
      }
      if (
        q.includes('mês') ||
        q.includes('mes') ||
        q.includes('passado') === false
      ) {
        return {
          data: data.filter((item) => isThisMonth(item[dateField])),
          label: 'deste mês',
        }
      }
      // Default to "Recent/Today" if no period specified but context implies current
      return {
        data: data.filter((item) => isSameDay(item[dateField], now)),
        label: 'de hoje', // Default assumption
      }
    }

    // --- INTENT DETECTION ---
    let intent: Intent = 'unknown'

    if (
      q.includes('olá') ||
      q.includes('oi') ||
      q.includes('bom dia') ||
      q.includes('boa tarde')
    )
      intent = 'greeting'
    else if (q.includes('ajuda') || q.includes('help') || q.includes('menu'))
      intent = 'help'
    else if (
      q.includes('fábrica') ||
      q.includes('unidade') ||
      q.includes('filial')
    )
      intent = 'factories'
    else if (
      q.includes('perda') ||
      q.includes('quebra') ||
      q.includes('desperdício')
    )
      intent = 'losses'
    else if (
      q.includes('projeção') ||
      q.includes('previsão') ||
      q.includes('futuro') ||
      q.includes('estimativa')
    )
      intent = 'projection'
    else if (
      q.includes('faturamento') ||
      q.includes('receita') ||
      q.includes('venda') ||
      q.includes('vendas') ||
      q.includes('dinheiro')
    )
      intent = 'financial' // "vendas" can be shipping or money, grouping as financial/shipping
    else if (
      q.includes('expedição') ||
      q.includes('carga') ||
      q.includes('carregamento')
    )
      intent = 'shipping'
    else if (
      q.includes('produção') ||
      q.includes('rendimento') ||
      q.includes('produzido')
    )
      intent = 'production'
    else if (q.includes('entrada') || q.includes('matéria') || q.includes('mp'))
      intent = 'raw_material'
    else if (
      q.includes('qualidade') ||
      q.includes('acidez') ||
      q.includes('proteína')
    )
      intent = 'quality'
    else if (q.includes('estoque')) intent = 'inventory'

    // Context fallback (Basic)
    if (intent === 'unknown' && lastIntent) {
      if (
        q.includes('e') ||
        q.includes('mais') ||
        q.includes('detalhe') ||
        q.length < 10
      ) {
        intent = lastIntent
      }
    }

    setLastIntent(intent)

    // --- RESPONSES ---

    if (intent === 'greeting') {
      return `Olá! Sou o **Render**, seu assistente de inteligência industrial.
Estou conectado ao banco de dados da fábrica **${currentFactory?.name || 'Principal'}**.
Posso analisar *rendimentos*, *perdas*, *faturamento*, *qualidade* e até fazer *projeções de vendas*. Como posso ser útil?`
    }

    if (intent === 'help') {
      return `Eu sou especialista no sistema de produção. Tente me perguntar:
• **Financeiro:** "Qual o faturamento deste mês?" ou "Projeção de vendas"
• **Produção:** "Como está o rendimento hoje?" ou "Houve perdas ontem?"
• **Qualidade:** "Qual a acidez média do FCO?"
• **Logística:** "O que foi expedido hoje?"`
    }

    if (intent === 'factories') {
      if (q.includes('listar') || q.includes('todas')) {
        return `As unidades conectadas são: ${factories.map((f) => f.name).join(', ')}.`
      }
      return `Atualmente estamos monitorando a unidade **${currentFactory?.name}** (${currentFactory?.location}).\nGerente responsável: ${currentFactory?.manager}.`
    }

    if (intent === 'losses') {
      const { data: filtered, label } = getPeriodData(production)
      const totalLosses = filtered.reduce((acc, curr) => acc + curr.losses, 0)
      const totalMP = filtered.reduce((acc, curr) => acc + curr.mpUsed, 0)
      const lossRate = totalMP > 0 ? (totalLosses / totalMP) * 100 : 0

      if (filtered.length === 0)
        return `Não identifiquei registros de produção para analisar perdas ${label}.`

      const threshold = systemSettings.maxLossThreshold
      const highLossRecords = filtered.filter((p) => p.losses > threshold)

      let response = `**Análise de Perdas ${label}:**\n`
      response += `🚨 **Total Perdido:** ${formatNumber(totalLosses)} kg (${lossRate.toFixed(2)}% da MP processada)\n`

      if (highLossRecords.length > 0) {
        response += `\n⚠️ **Atenção:** Encontrei ${highLossRecords.length} turnos com perdas acima do limite de ${formatNumber(threshold)} kg.\n`
        response += `Maior registro: ${formatNumber(Math.max(...highLossRecords.map((r) => r.losses)))} kg em ${format(highLossRecords[0].date, 'dd/MM')}.`
      } else {
        response += `\n✅ Todas as operações mantiveram as perdas dentro do limite aceitável (< ${formatNumber(threshold)} kg).`
      }
      return response
    }

    if (intent === 'projection') {
      // Simple projection algorithm: Avg daily sales (last 30 days) * remaining days in month or next 30 days
      const last30Days = subDays(new Date(), 30)
      const recentSales = shipping.filter((s) => s.date >= last30Days)

      if (recentSales.length === 0)
        return 'Não tenho dados históricos suficientes nos últimos 30 dias para gerar uma projeção confiável.'

      const totalRevenue = recentSales.reduce(
        (acc, s) => acc + s.quantity * s.unitPrice,
        0,
      )
      const totalQty = recentSales.reduce((acc, s) => acc + s.quantity, 0)
      const daysWithSales = new Set(
        recentSales.map((s) => s.date.toISOString().split('T')[0]),
      ).size
      const effectiveDays = Math.max(daysWithSales, 1)

      const avgDailyRevenue = totalRevenue / 30 // Using 30 for monthly pace
      const avgDailyQty = totalQty / 30

      // Project for next 30 days
      const projRevenue = avgDailyRevenue * 30
      const projQty = avgDailyQty * 30

      return `**🔮 Projeção para os Próximos 30 Dias**\n(Baseada na média histórica recente)\n
💰 **Faturamento Estimado:** ${formatCurrency(projRevenue)}
📦 **Volume Estimado:** ${formatNumber(Math.round(projQty))} kg
\n*Nota: Esta é uma estimativa baseada na média diária de R$ ${formatCurrency(avgDailyRevenue)} dos últimos 30 dias.*`
    }

    if (intent === 'financial' || intent === 'shipping') {
      const { data: filtered, label } = getPeriodData(shipping)

      if (filtered.length === 0)
        return `Não há registros de expedição/vendas ${label}.`

      const totalRevenue = filtered.reduce(
        (acc, s) => acc + s.quantity * s.unitPrice,
        0,
      )
      const totalVolume = filtered.reduce((acc, s) => acc + s.quantity, 0)

      // Breakdown by product
      const byProduct = filtered.reduce(
        (acc, curr) => {
          acc[curr.product] =
            (acc[curr.product] || 0) + curr.quantity * curr.unitPrice
          return acc
        },
        {} as Record<string, number>,
      )

      const topProduct = Object.entries(byProduct).sort(
        (a, b) => b[1] - a[1],
      )[0]

      return `**💰 Financeiro & Expedição ${label}:**\n
💵 **Faturamento Total:** ${formatCurrency(totalRevenue)}
📦 **Volume Total:** ${formatNumber(totalVolume)} kg
🏆 **Principal Produto:** ${topProduct ? `${topProduct[0]} (${formatCurrency(topProduct[1])})` : 'N/A'}`
    }

    if (intent === 'production') {
      const { data: filtered, label } = getPeriodData(production)

      if (filtered.length === 0)
        return `Sem dados de produção registrados ${label}.`

      const mp = filtered.reduce((acc, c) => acc + c.mpUsed, 0)
      const sebo = filtered.reduce((acc, c) => acc + c.seboProduced, 0)
      const fco = filtered.reduce((acc, c) => acc + c.fcoProduced, 0)
      const farinheta = filtered.reduce(
        (acc, c) => acc + c.farinhetaProduced,
        0,
      )
      const totalOutput = sebo + fco + farinheta

      const yieldVal = mp > 0 ? (totalOutput / mp) * 100 : 0
      const target = yieldTargets.total

      let evaluation = ''
      if (yieldVal >= target) evaluation = '✅ Acima da meta!'
      else if (yieldVal >= target - 2) evaluation = '⚠️ Próximo da meta.'
      else evaluation = '🔻 Abaixo da meta crítica.'

      return `**🏭 Produção ${label}:**\n
📊 **Rendimento Global:** ${yieldVal.toFixed(2)}% (Meta: ${target}%) ${evaluation}
📥 **Matéria-Prima Processada:** ${formatNumber(mp)} kg
📤 **Produção Total:** ${formatNumber(totalOutput)} kg\n
• Sebo: ${formatNumber(sebo)} kg
• FCO: ${formatNumber(fco)} kg
• Farinheta: ${formatNumber(farinheta)} kg`
    }

    if (intent === 'raw_material') {
      const { data: filtered, label } = getPeriodData(rawMaterials)
      if (filtered.length === 0)
        return `Não houve recebimento de matéria-prima ${label}.`

      const total = filtered.reduce((acc, c) => acc + c.quantity, 0)
      const supplierCount = new Set(filtered.map((r) => r.supplier)).size

      return `**🚛 Recebimento MP ${label}:**\n
📦 **Total Recebido:** ${formatNumber(total)} kg
🏢 **Fornecedores:** ${supplierCount} distintos neste período.`
    }

    if (intent === 'quality') {
      const { data: filtered, label } = getPeriodData(qualityRecords)
      if (filtered.length === 0)
        return `Não encontrei análises de qualidade de produto final ${label}.`

      const fcoRecords = filtered.filter(
        (f) => f.product === 'FCO' || f.product === 'Farinha',
      )
      let response = `**🧪 Qualidade ${label}:**\n`

      if (fcoRecords.length > 0) {
        const avgAcid =
          fcoRecords.reduce((acc, c) => acc + c.acidity, 0) / fcoRecords.length
        response += `\n🦴 **FCO/Farinha:**\n• Acidez Média: ${avgAcid.toFixed(2)}%\n• Amostras: ${fcoRecords.length}`
        if (avgAcid > systemSettings.productionGoal / 10000) {
          // Dummy logic for threshold comparison
          response += ` (⚠️ Atenção à acidez)`
        }
      } else {
        response += '\nSem análises de FCO/Farinha no período.'
      }

      return response
    }

    if (intent === 'inventory') {
      return 'Para consultar o saldo atual detalhado de estoque, por favor acesse o menu **Gestão de Estoque**. Posso ajudar com informações sobre *Entradas* ou *Expedição* se preferir.'
    }

    return `Desculpe, ainda estou aprendendo. Tente perguntar sobre:
- "Rendimento de hoje"
- "Faturamento do mês"
- "Houve perdas ontem?"
- "Projeção de vendas"`
  }

  return { processQuery }
}
