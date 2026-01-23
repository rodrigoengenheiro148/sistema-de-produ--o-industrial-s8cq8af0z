import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { supabase } from '@/lib/supabase/client'
import {
  isSameDay,
  isThisMonth,
  subDays,
  startOfMonth,
  endOfMonth,
  format,
  differenceInDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Intent =
  | 'greeting'
  | 'factories'
  | 'production'
  | 'raw_material'
  | 'quality'
  | 'acidity_specific'
  | 'inventory_realtime'
  | 'shipping'
  | 'financial'
  | 'losses'
  | 'projection'
  | 'correlation'
  | 'external_search'
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

  const calculateStock = () => {
    // MP Balance
    const mpIn = rawMaterials.reduce((acc, curr) => acc + curr.quantity, 0)
    const mpOut = production.reduce((acc, curr) => acc + curr.mpUsed, 0)
    const mpStock = mpIn - mpOut

    // Sebo Balance
    const seboIn = production.reduce((acc, curr) => acc + curr.seboProduced, 0)
    const seboOut = shipping
      .filter((s) => s.product === 'Sebo')
      .reduce((acc, curr) => acc + curr.quantity, 0)
    const seboStock = seboIn - seboOut

    // FCO Balance
    const fcoIn = production.reduce((acc, curr) => acc + curr.fcoProduced, 0)
    const fcoOut = shipping
      .filter((s) => s.product === 'FCO')
      .reduce((acc, curr) => acc + curr.quantity, 0)
    const fcoStock = fcoIn - fcoOut

    // Farinheta Balance
    const farinhetaIn = production.reduce(
      (acc, curr) => acc + curr.farinhetaProduced,
      0,
    )
    const farinhetaOut = shipping
      .filter((s) => s.product === 'Farinheta')
      .reduce((acc, curr) => acc + curr.quantity, 0)
    const farinhetaStock = farinhetaIn - farinhetaOut

    return { mpStock, seboStock, fcoStock, farinhetaStock }
  }

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
        (q.includes('passado') === false && !q.includes('semana'))
      ) {
        return {
          data: data.filter((item) => isThisMonth(item[dateField])),
          label: 'deste mês',
        }
      }
      return {
        data: data.filter((item) => isSameDay(item[dateField], now)),
        label: 'recente (hoje)',
      }
    }

    // --- INTENT DETECTION ---
    let intent: Intent = 'unknown'

    // External / Edge Function Triggers
    if (
      q.includes('externo') ||
      q.includes('mercado') ||
      q.includes('preço') ||
      q.includes('cotação') ||
      q.includes('norma') ||
      q.includes('lei') ||
      q.includes('clima') ||
      q.includes('google')
    ) {
      intent = 'external_search'
    } else if (
      q.includes('olá') ||
      q.includes('oi') ||
      q.includes('bom dia') ||
      q.includes('boa tarde')
    ) {
      intent = 'greeting'
    } else if (
      q.includes('ajuda') ||
      q.includes('help') ||
      q.includes('menu')
    ) {
      intent = 'help'
    } else if (
      q.includes('fábrica') ||
      q.includes('unidade') ||
      q.includes('filial')
    ) {
      intent = 'factories'
    } else if (
      (q.includes('relação') || q.includes('influencia')) &&
      (q.includes('acidez') || q.includes('qualidade')) &&
      (q.includes('produção') ||
        q.includes('rendimento') ||
        q.includes('perda'))
    ) {
      intent = 'correlation'
    } else if (
      q.includes('perda') ||
      q.includes('quebra') ||
      q.includes('desperdício')
    ) {
      intent = 'losses'
    } else if (
      q.includes('projeção') ||
      q.includes('previsão') ||
      q.includes('futuro')
    ) {
      intent = 'projection'
    } else if (
      q.includes('faturamento') ||
      q.includes('receita') ||
      q.includes('venda') ||
      q.includes('financeiro')
    ) {
      intent = 'financial'
    } else if (
      q.includes('expedição') ||
      q.includes('carga') ||
      q.includes('enviado')
    ) {
      intent = 'shipping'
    } else if (
      q.includes('acidez') &&
      (q.includes('tanque') ||
        q.includes('responsável') ||
        q.includes('medição') ||
        q.includes('hoje') ||
        q.includes('ontem'))
    ) {
      intent = 'acidity_specific'
    } else if (
      q.includes('produção') ||
      q.includes('rendimento') ||
      q.includes('produzido')
    ) {
      intent = 'production'
    } else if (
      q.includes('entrada') ||
      q.includes('matéria') ||
      q.includes('mp')
    ) {
      intent = 'raw_material'
    } else if (
      q.includes('qualidade') ||
      q.includes('proteína') ||
      q.includes('análise')
    ) {
      intent = 'quality'
    } else if (
      q.includes('estoque') ||
      q.includes('saldo') ||
      q.includes('armazenado')
    ) {
      intent = 'inventory_realtime'
    }

    // Context fallback
    if (intent === 'unknown' && lastIntent) {
      if (
        q.includes('e') ||
        q.includes('mais') ||
        q.includes('detalhe') ||
        q.length < 15
      ) {
        intent = lastIntent
      }
    }

    setLastIntent(intent)

    // --- RESPONSES ---

    if (intent === 'external_search') {
      try {
        const { data, error } = await supabase.functions.invoke(
          'render-search',
          {
            body: { query },
          },
        )
        if (error) throw error
        return data.answer || 'Não consegui obter uma resposta externa válida.'
      } catch (e) {
        console.error(e)
        return 'Desculpe, não consegui conectar à minha base de conhecimento externa no momento.'
      }
    }

    if (intent === 'greeting') {
      return `Olá! Sou o **Render**, seu assistente avançado.
Estou conectado à unidade **${currentFactory?.name || 'Principal'}**.
Agora posso responder sobre:
• **Estoques em Tempo Real** (MP, Sebo, FCO)
• **Análises de Acidez** detalhadas por tanque
• **Consultas Externas** (Mercado, Normas)
• **Correlações** (ex: Acidez vs Rendimento)
Como posso ajudar hoje?`
    }

    if (intent === 'help') {
      return `Aqui estão exemplos do que posso fazer:
• **Estoque:** "Qual o saldo atual de Sebo?"
• **Acidez:** "Como estava a acidez do Tanque 1 ontem?"
• **Externo:** "Preço do sebo no mercado" ou "Norma IN 34"
• **Correlação:** "A acidez influenciou o rendimento?"
• **Geral:** "Faturamento do mês", "Perdas ontem"`
    }

    if (intent === 'inventory_realtime') {
      const stock = calculateStock()
      return `**📦 Posição de Estoque Atual:**\n
• **Matéria-Prima:** ${formatNumber(stock.mpStock)} kg
• **Sebo:** ${formatNumber(stock.seboStock)} kg
• **FCO (Farinha):** ${formatNumber(stock.fcoStock)} kg
• **Farinheta:** ${formatNumber(stock.farinhetaStock)} kg
\n*Valores calculados com base nas entradas, produção e expedição registradas.*`
    }

    if (intent === 'acidity_specific') {
      const { data: filtered, label } = getPeriodData(acidityRecords)
      if (filtered.length === 0)
        return `Não encontrei medições de acidez nos tanques ${label}.`

      const avgWeight =
        filtered.reduce((acc, c) => acc + c.weight, 0) / filtered.length
      const avgVol =
        filtered.reduce((acc, c) => acc + c.volume, 0) / filtered.length
      const responsibles = [
        ...new Set(filtered.map((r) => r.responsible)),
      ].join(', ')
      const tanks = [...new Set(filtered.map((r) => r.tank))].join(', ')

      // Group by tank
      const byTank = filtered.reduce(
        (acc, curr) => {
          if (!acc[curr.tank]) acc[curr.tank] = []
          acc[curr.tank].push(curr.weight)
          return acc
        },
        {} as Record<string, number[]>,
      )

      let details = ''
      for (const [tank, weights] of Object.entries(byTank)) {
        const tankAvg = weights.reduce((a, b) => a + b, 0) / weights.length
        details += `\n• **${tank}:** Média ${tankAvg.toFixed(2)} kg`
      }

      return `**🧪 Análise de Acidez (Tanques) ${label}:**\n
📊 **Total de Medições:** ${filtered.length}
👥 **Responsáveis:** ${responsibles}
🛢️ **Tanques Monitorados:** ${tanks}
⚖️ **Médias Gerais:** Peso ${avgWeight.toFixed(2)} kg | Vol ${avgVol.toFixed(2)} L
${details ? `\n**Detalhes por Tanque:**${details}` : ''}`
    }

    if (intent === 'correlation') {
      // Correlation logic: Check if days with high acidity (quality records) had low yield
      const dataPoints = production
        .map((prod) => {
          const qual = qualityRecords.find((q) => isSameDay(q.date, prod.date))
          if (!qual) return null
          const yieldVal =
            prod.mpUsed > 0
              ? ((prod.seboProduced +
                  prod.fcoProduced +
                  prod.farinhetaProduced) /
                  prod.mpUsed) *
                100
              : 0
          return {
            date: prod.date,
            yield: yieldVal,
            acidity: qual.acidity,
          }
        })
        .filter((item) => item !== null) as {
        yield: number
        acidity: number
        date: Date
      }[]

      if (dataPoints.length < 3)
        return 'Não tenho dados suficientes (Produção + Qualidade no mesmo dia) para estabelecer uma correlação confiável.'

      // Simple checks
      const highAcidity = dataPoints.filter((d) => d.acidity > 5) // Assumption > 5 is high
      const avgYieldHighAcid =
        highAcidity.length > 0
          ? highAcidity.reduce((acc, c) => acc + c.yield, 0) /
            highAcidity.length
          : 0

      const lowAcidity = dataPoints.filter((d) => d.acidity <= 5)
      const avgYieldLowAcid =
        lowAcidity.length > 0
          ? lowAcidity.reduce((acc, c) => acc + c.yield, 0) / lowAcidity.length
          : 0

      let conclusion = ''
      if (highAcidity.length === 0) {
        conclusion = 'Não houve dias com acidez crítica (>5%) para comparação.'
      } else if (avgYieldLowAcid > avgYieldHighAcid) {
        conclusion = `📉 **Tendência Negativa:** Dias com acidez mais baixa tiveram rendimento médio de **${avgYieldLowAcid.toFixed(1)}%**, enquanto dias de acidez alta caíram para **${avgYieldHighAcid.toFixed(1)}%**.`
      } else {
        conclusion =
          '⚖️ **Sem Correlação Clara:** O rendimento manteve-se estável independentemente das variações de acidez registradas no período.'
      }

      return `**🔗 Análise de Correlação (Acidez x Rendimento):**\n
${conclusion}\n
*Base de dados: ${dataPoints.length} dias cruzados.*`
    }

    // Reuse existing logic blocks
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
      const last30Days = subDays(new Date(), 30)
      const recentSales = shipping.filter((s) => s.date >= last30Days)

      if (recentSales.length === 0)
        return 'Não tenho dados históricos suficientes nos últimos 30 dias para gerar uma projeção confiável.'

      const totalRevenue = recentSales.reduce(
        (acc, s) => acc + s.quantity * s.unitPrice,
        0,
      )
      const totalQty = recentSales.reduce((acc, s) => acc + s.quantity, 0)
      const avgDailyRevenue = totalRevenue / 30
      const avgDailyQty = totalQty / 30

      const projRevenue = avgDailyRevenue * 30
      const projQty = avgDailyQty * 30

      return `**🔮 Projeção para os Próximos 30 Dias**\n
💰 **Faturamento Estimado:** ${formatCurrency(projRevenue)}
📦 **Volume Estimado:** ${formatNumber(Math.round(projQty))} kg
\n*Nota: Estimativa baseada na média diária dos últimos 30 dias.*`
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
📥 **MP Processada:** ${formatNumber(mp)} kg
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
🏢 **Fornecedores:** ${supplierCount} distintos.`
    }

    if (intent === 'quality') {
      const { data: filtered, label } = getPeriodData(qualityRecords)
      if (filtered.length === 0)
        return `Não encontrei análises de qualidade de produto final ${label}.`

      const fcoRecords = filtered.filter(
        (f) => f.product === 'FCO' || f.product === 'Farinha',
      )
      let response = `**🧪 Qualidade (Produto Final) ${label}:**\n`

      if (fcoRecords.length > 0) {
        const avgAcid =
          fcoRecords.reduce((acc, c) => acc + c.acidity, 0) / fcoRecords.length
        response += `\n🦴 **FCO/Farinha:**\n• Acidez Média: ${avgAcid.toFixed(2)}%\n• Amostras: ${fcoRecords.length}`
        if (avgAcid > systemSettings.productionGoal / 10000) {
          response += ` (⚠️ Atenção)`
        }
      } else {
        response += '\nSem análises de FCO/Farinha no período.'
      }

      return response
    }

    return `Desculpe, não entendi. Tente perguntar sobre:
- "Estoque de Sebo"
- "Acidez do tanque 1"
- "Rendimento vs Acidez"
- "Preço do sebo no mercado" (Busca Externa)`
  }

  return { processQuery }
}
