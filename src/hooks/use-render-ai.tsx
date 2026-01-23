import { useData } from '@/context/DataContext'
import { isSameDay, isThisMonth, subDays } from 'date-fns'

export function useRenderAI() {
  const {
    production,
    rawMaterials,
    qualityRecords,
    acidityRecords,
    factories,
    currentFactoryId,
    shipping,
  } = useData()

  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  const processQuery = async (query: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const q = query.toLowerCase()

    // Helper to filter by date
    const getPeriodData = (data: any[], dateField: string = 'date') => {
      if (q.includes('ontem')) {
        const yesterday = subDays(new Date(), 1)
        return data.filter((item) => isSameDay(item[dateField], yesterday))
      }
      if (q.includes('hoje')) {
        return data.filter((item) => isSameDay(item[dateField], new Date()))
      }
      if (q.includes('mês') || q.includes('mes')) {
        return data.filter((item) => isThisMonth(item[dateField]))
      }
      // Default to today if asking about "current" status, or recently added
      if (q.includes('agora') || q.includes('atual')) {
        return data.filter((item) => isSameDay(item[dateField], new Date()))
      }
      // Fallback: return everything if no specific time filter is detected but usually users ask for 'production' meaning 'recent'
      // To be safe, let's default to "Today" if the query implies daily tracking, or "This Month" for reports.
      // For this simple bot, let's default to Today for operational data unless specified.
      return data.filter((item) => isSameDay(item[dateField], new Date()))
    }

    const getPeriodLabel = () => {
      if (q.includes('ontem')) return 'de ontem'
      if (q.includes('mês') || q.includes('mes')) return 'deste mês'
      return 'de hoje'
    }

    // GREETINGS
    if (
      q.includes('olá') ||
      q.includes('oi') ||
      q.includes('bom dia') ||
      q.includes('boa tarde')
    ) {
      return `Olá! Sou o Render, seu assistente virtual. Estou monitorando a fábrica **${currentFactory?.name || 'Principal'}**. Posso ajudar com dados de produção, qualidade, estoque e mais.`
    }

    // FACTORIES
    if (q.includes('fábrica') || q.includes('unidade')) {
      if (q.includes('lista') || q.includes('quais') || q.includes('todas')) {
        const names = factories.map((f) => f.name).join(', ')
        return `As unidades cadastradas são: ${names}.`
      }
      return `Estamos operando no contexto da fábrica: **${currentFactory?.name}**.\nGerente responsável: ${currentFactory?.manager}.`
    }

    // PRODUCTION
    if (
      q.includes('produção') ||
      q.includes('produzido') ||
      q.includes('rendimento')
    ) {
      const filtered = getPeriodData(production)
      const label = getPeriodLabel()

      if (filtered.length === 0) {
        return `Não encontrei registros de produção para o período ${label}.`
      }

      const totalSebo = filtered.reduce(
        (acc, curr) => acc + curr.seboProduced,
        0,
      )
      const totalFCO = filtered.reduce((acc, curr) => acc + curr.fcoProduced, 0)
      const totalFarinheta = filtered.reduce(
        (acc, curr) => acc + curr.farinhetaProduced,
        0,
      )
      const total = totalSebo + totalFCO + totalFarinheta

      const mpUsed = filtered.reduce((acc, curr) => acc + curr.mpUsed, 0)
      const yieldVal = mpUsed > 0 ? (total / mpUsed) * 100 : 0

      return `**Produção ${label}:**\n
🏭 **Total:** ${total.toLocaleString('pt-BR')} kg
📊 **Rendimento:** ${yieldVal.toFixed(2)}%\n
• Sebo: ${totalSebo.toLocaleString('pt-BR')} kg
• FCO: ${totalFCO.toLocaleString('pt-BR')} kg
• Farinheta: ${totalFarinheta.toLocaleString('pt-BR')} kg`
    }

    // RAW MATERIAL
    if (q.includes('entrada') || q.includes('matéria') || q.includes('mp')) {
      const filtered = getPeriodData(rawMaterials)
      const label = getPeriodLabel()

      if (filtered.length === 0)
        return `Não houve entradas de matéria-prima registradas ${label}.`

      const total = filtered.reduce((acc, curr) => acc + curr.quantity, 0)
      const suppliers = [
        ...new Set(filtered.map((item) => item.supplier)),
      ].join(', ')

      return `**Entrada MP ${label}:**\n📦 Volume: ${total.toLocaleString('pt-BR')} kg\n🚛 Fornecedores: ${suppliers}`
    }

    // QUALITY / ACIDITY
    if (
      q.includes('acidez') ||
      q.includes('qualidade') ||
      q.includes('proteína') ||
      q.includes('proteina')
    ) {
      if (q.includes('tanque') || q.includes('processo')) {
        const filtered = getPeriodData(acidityRecords)
        if (filtered.length === 0)
          return 'Sem medições de acidez de tanque para o período.'

        const totalVol = filtered.reduce((acc, c) => acc + c.volume, 0)
        return `Foram realizadas **${filtered.length} medições** nos tanques. Volume total processado: ${totalVol.toLocaleString()} L.`
      }

      const filtered = getPeriodData(qualityRecords)
      if (filtered.length === 0)
        return 'Não há análises de qualidade de produto final neste período.'

      const farinha = filtered.filter(
        (f) => f.product === 'Farinha' || f.product === 'FCO',
      )
      const farinheta = filtered.filter((f) => f.product === 'Farinheta')

      let response = `**Qualidade Média ${getPeriodLabel()}:**\n`

      if (farinha.length > 0) {
        const avgAcidity =
          farinha.reduce((acc, c) => acc + c.acidity, 0) / farinha.length
        const avgProtein =
          farinha.reduce((acc, c) => acc + c.protein, 0) / farinha.length
        response += `\n🦴 **FCO:** Acidez ${avgAcidity.toFixed(2)}% | Proteína ${avgProtein.toFixed(2)}%`
      }

      if (farinheta.length > 0) {
        const avgAcidity =
          farinheta.reduce((acc, c) => acc + c.acidity, 0) / farinheta.length
        const avgProtein =
          farinheta.reduce((acc, c) => acc + c.protein, 0) / farinheta.length
        response += `\n🌾 **Farinheta:** Acidez ${avgAcidity.toFixed(2)}% | Proteína ${avgProtein.toFixed(2)}%`
      }

      return response
    }

    // INVENTORY / SHIPPING
    if (
      q.includes('estoque') ||
      q.includes('expedição') ||
      q.includes('vendas')
    ) {
      if (q.includes('expedição') || q.includes('venda')) {
        const filtered = getPeriodData(shipping)
        const label = getPeriodLabel()
        if (filtered.length === 0)
          return `Nenhuma expedição registrada ${label}.`

        const totalValue = filtered.reduce(
          (acc, s) => acc + s.quantity * s.unitPrice,
          0,
        )
        const totalVol = filtered.reduce((acc, s) => acc + s.quantity, 0)

        return `**Expedição ${label}:**\n💰 Faturamento: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📦 Volume: ${totalVol.toLocaleString('pt-BR')} kg`
      }

      return 'Para ver o saldo atualizado de todos os produtos, por favor acesse a página de **Gestão de Estoque**.'
    }

    // HELP
    if (q.includes('ajuda') || q.includes('help') || q.includes('menu')) {
      return `Eu posso responder sobre:
- **Produção** (Ex: "produção de hoje", "rendimento ontem")
- **Qualidade** (Ex: "como está a acidez?", "qualidade farinha")
- **Entradas** (Ex: "entrada mp hoje")
- **Expedição** (Ex: "vendas deste mês")
- **Fábricas** (Ex: "listar fábricas")`
    }

    return "Desculpe, não entendi. Tente perguntar sobre 'produção de hoje', 'qualidade', 'estoque' ou digite 'ajuda'."
  }

  return { processQuery }
}
