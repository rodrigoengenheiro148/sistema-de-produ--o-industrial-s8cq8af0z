import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, config } = await req.json()

    if (action === 'test-connection') {
      const { baseUrl, username, password } = config

      if (!baseUrl) {
        throw new Error('URL da API não informada.')
      }

      // Mocking a connection test to Protheus API
      // In a real scenario, we would fetch(baseUrl + '/health') or similar

      console.log(`Testing connection to: ${baseUrl} for user: ${username}`)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (baseUrl.includes('error')) {
        throw new Error(
          'Falha ao conectar com o servidor Protheus. Host inacessível.',
        )
      }

      // Return success mock
      return new Response(
        JSON.stringify({
          success: true,
          message:
            'Conexão estabelecida com sucesso! API Protheus v12.1.33 disponível.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'sync-data') {
      // Implement sync logic here
      return new Response(
        JSON.stringify({ success: true, message: 'Sync started' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    throw new Error('Ação desconhecida')
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
