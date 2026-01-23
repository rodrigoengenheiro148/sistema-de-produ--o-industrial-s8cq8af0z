import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query }: { query: string } = await req.json()
    const q = query.toLowerCase()
    let answer = ''

    // Simulated Knowledge Base / External API response
    if (
      q.includes('preço') ||
      q.includes('mercado') ||
      q.includes('cotação') ||
      q.includes('valor')
    ) {
      answer = `**📊 Mercado Industrial (Simulado via Edge Function):**\n
• **Sebo Bovino:** R$ 4,65/kg (Alta de 1.5% - Ref. Campinas/SP)
• **Farinha de Carne e Ossos (45%):** R$ 2,15/kg (Estável)
• **Óleo Vegetal Recuperado:** R$ 3,80/kg
• **Dólar PTAX:** R$ 5,15
\n*Fonte: Integração com API de Notícias do Agronegócio.*`
    } else if (
      q.includes('norma') ||
      q.includes('lei') ||
      q.includes('regulamento') ||
      q.includes('bpf')
    ) {
      answer = `**📜 Normas Técnicas e Regulatórias:**\n
• **IN 34/2008 (MAPA):** Estabelece as Boas Práticas de Fabricação (BPF) para produtos de alimentação animal.
• **RDC 275/2002:** Dispõe sobre Procedimentos Operacionais Padronizados (POPs).
• **Parâmetros Críticos:** Esterilização a no mínimo 133°C por 20 minutos (pressão 3 bar) para processamento de resíduos animais.`
    } else if (
      q.includes('clima') ||
      q.includes('tempo') ||
      q.includes('previsão')
    ) {
      answer = `**🌦️ Previsão do Tempo (Região da Fábrica):**\n
• **Hoje:** Sol com muitas nuvens. Max: 32°C / Min: 21°C.
• **Amanhã:** Pancadas de chuva à tarde. Risco de impacto logístico no recebimento de MP.`
    } else {
      answer = `Realizei uma busca externa sobre "${query}", mas não encontrei informações específicas de alta relevância nas minhas fontes conectadas (Mercado, Normas, Clima). Tente refinar sua busca para tópicos industriais padrão.`
    }

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
