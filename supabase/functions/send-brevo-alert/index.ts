import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { productionData } = await req.json()

    if (!productionData) {
      throw new Error('Dados de produção não fornecidos')
    }

    // Fetch settings for this user
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!settings) {
      console.log('No notification settings found for user.')
      return new Response(JSON.stringify({ message: 'Settings not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Calculate Yields
    const mpUsed = Number(productionData.mpUsed) || 0
    const sebo = Number(productionData.seboProduced) || 0
    const fco = Number(productionData.fcoProduced) || 0
    const farinheta = Number(productionData.farinhetaProduced) || 0

    if (mpUsed <= 0) {
      return new Response(JSON.stringify({ message: 'MP is zero or less' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const seboYield = (sebo / mpUsed) * 100
    const fcoYield = (fco / mpUsed) * 100
    const farinhetaYield = (farinheta / mpUsed) * 100
    const totalYield = ((sebo + fco + farinheta) / mpUsed) * 100

    const violations: string[] = []

    if (
      settings.sebo_threshold > 0 &&
      seboYield < Number(settings.sebo_threshold)
    ) {
      violations.push(
        `Rendimento Sebo: ${seboYield.toFixed(2)}% (Meta: ${settings.sebo_threshold}%)`,
      )
    }
    if (
      settings.farinha_threshold > 0 &&
      fcoYield < Number(settings.farinha_threshold)
    ) {
      violations.push(
        `Rendimento Farinha: ${fcoYield.toFixed(2)}% (Meta: ${settings.farinha_threshold}%)`,
      )
    }
    if (
      settings.farinheta_threshold > 0 &&
      farinhetaYield < Number(settings.farinheta_threshold)
    ) {
      violations.push(
        `Rendimento Farinheta: ${farinhetaYield.toFixed(2)}% (Meta: ${settings.farinheta_threshold}%)`,
      )
    }
    if (
      settings.yield_threshold > 0 &&
      totalYield < Number(settings.yield_threshold)
    ) {
      violations.push(
        `Rendimento Total: ${totalYield.toFixed(2)}% (Meta: ${settings.yield_threshold}%)`,
      )
    }

    if (violations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No threshold violations' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // If we have violations, check if we can send alerts
    const apiKey = settings.brevo_api_key

    if (!apiKey) {
      console.log('Brevo API Key not configured.')
      return new Response(
        JSON.stringify({ message: 'Brevo API Key missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const alertMessage = `ALERTA DE PRODUÇÃO - ${new Date().toLocaleDateString()}\n\nAs seguintes metas não foram atingidas:\n- ${violations.join('\n- ')}`
    const results = []

    // Send Email
    if (settings.email_enabled && settings.notification_email) {
      const emailBody = {
        sender: { name: 'Sistema Industrial', email: 'alertas@goskip.app' },
        to: [{ email: settings.notification_email }],
        subject: 'Alerta de Baixo Rendimento',
        htmlContent: `<p>ALERTA DE PRODUÇÃO</p><p>Data: ${new Date().toLocaleDateString()}</p><p>As seguintes metas não foram atingidas:</p><ul>${violations.map((v) => `<li>${v}</li>`).join('')}</ul>`,
      }

      try {
        const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify(emailBody),
        })
        const data = await emailRes.json()
        results.push({ type: 'email', success: emailRes.ok, data })
      } catch (err) {
        results.push({ type: 'email', success: false, error: err })
      }
    }

    // Send SMS
    if (settings.sms_enabled && settings.notification_phone) {
      const smsBody = {
        sender: 'Industria',
        recipient: settings.notification_phone,
        content: alertMessage,
      }

      try {
        const smsRes = await fetch(
          'https://api.brevo.com/v3/transactionalSMS/sms',
          {
            method: 'POST',
            headers: {
              'api-key': apiKey,
              'Content-Type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify(smsBody),
          },
        )
        const data = await smsRes.json()
        results.push({ type: 'sms', success: smsRes.ok, data })
      } catch (err) {
        results.push({ type: 'sms', success: false, error: err })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
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
