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
    const { productionData, user_id, source } = await req.json()

    if (!productionData) {
      throw new Error('Dados de produção não fornecidos')
    }

    // Determine Authentication Strategy
    let supabaseClient
    let userId = user_id

    // If triggered by database (trusted source with user_id provided)
    if (source === 'database_trigger' && user_id) {
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )
    } else {
      // Standard Client-side invocation (JWT required)
      supabaseClient = createClient(
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
      userId = user.id
    }

    // Fetch settings for this user
    const { data: settings } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!settings) {
      console.log('No notification settings found for user.')
      return new Response(JSON.stringify({ message: 'Settings not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Calculate Yields - Handle both camelCase (JSON) and snake_case (DB)
    const mpUsed = Number(productionData.mpUsed || productionData.mp_used) || 0
    const sebo =
      Number(productionData.seboProduced || productionData.sebo_produced) || 0
    const fco =
      Number(productionData.fcoProduced || productionData.fco_produced) || 0
    const farinheta =
      Number(
        productionData.farinhetaProduced || productionData.farinheta_produced,
      ) || 0

    const date =
      productionData.date ||
      productionData.created_at ||
      new Date().toISOString()
    const formattedDate = new Date(date).toLocaleDateString('pt-BR')

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
    const htmlViolations: string[] = []

    // Check Sebo
    if (
      settings.sebo_threshold > 0 &&
      seboYield < Number(settings.sebo_threshold)
    ) {
      const diff = (Number(settings.sebo_threshold) - seboYield).toFixed(2)
      violations.push(
        `Rendimento Sebo: ${seboYield.toFixed(2)}% (Meta: ${settings.sebo_threshold}%) - Desvio: -${diff}%`,
      )
      htmlViolations.push(
        `<li><b>Rendimento Sebo:</b> ${seboYield.toFixed(2)}% <span style="color:red">(Meta: ${settings.sebo_threshold}%)</span> - Abaixo por ${diff}%</li>`,
      )
    }

    // Check FCO (using fco_threshold if available, fallback to farinha_threshold)
    const fcoTarget = Number(
      settings.fco_threshold || settings.farinha_threshold || 0,
    )
    if (fcoTarget > 0 && fcoYield < fcoTarget) {
      const diff = (fcoTarget - fcoYield).toFixed(2)
      violations.push(
        `Rendimento FCO: ${fcoYield.toFixed(2)}% (Meta: ${fcoTarget}%) - Desvio: -${diff}%`,
      )
      htmlViolations.push(
        `<li><b>Rendimento FCO:</b> ${fcoYield.toFixed(2)}% <span style="color:red">(Meta: ${fcoTarget}%)</span> - Abaixo por ${diff}%</li>`,
      )
    }

    // Check Farinheta
    if (
      settings.farinheta_threshold > 0 &&
      farinhetaYield < Number(settings.farinheta_threshold)
    ) {
      const diff = (
        Number(settings.farinheta_threshold) - farinhetaYield
      ).toFixed(2)
      violations.push(
        `Rendimento Farinheta: ${farinhetaYield.toFixed(2)}% (Meta: ${settings.farinheta_threshold}%) - Desvio: -${diff}%`,
      )
      htmlViolations.push(
        `<li><b>Rendimento Farinheta:</b> ${farinhetaYield.toFixed(2)}% <span style="color:red">(Meta: ${settings.farinheta_threshold}%)</span> - Abaixo por ${diff}%</li>`,
      )
    }

    // Check Total
    if (
      settings.yield_threshold > 0 &&
      totalYield < Number(settings.yield_threshold)
    ) {
      const diff = (Number(settings.yield_threshold) - totalYield).toFixed(2)
      violations.push(
        `Rendimento Total Fábrica: ${totalYield.toFixed(2)}% (Meta: ${settings.yield_threshold}%) - Desvio: -${diff}%`,
      )
      htmlViolations.push(
        `<li><b>Rendimento Total Fábrica:</b> ${totalYield.toFixed(2)}% <span style="color:red">(Meta: ${settings.yield_threshold}%)</span> - Abaixo por ${diff}%</li>`,
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

    // Check if we can send alerts
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

    const alertMessage = `ALERTA DE PRODUÇÃO - ${formattedDate}\n\nAs seguintes metas não foram atingidas:\n- ${violations.join('\n- ')}`
    const results = []

    // Send Email
    if (settings.email_enabled && settings.notification_email) {
      const emailBody = {
        sender: { name: 'Sistema Industrial', email: 'alertas@goskip.app' },
        to: [{ email: settings.notification_email }],
        subject: `Alerta de Baixo Rendimento - ${formattedDate}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #e11d48;">ALERTA DE PRODUÇÃO</h2>
            <p>Atenção, foram detectados rendimentos abaixo da meta para o registro de produção do dia <strong>${formattedDate}</strong>.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <h3>Detalhes dos Indicadores:</h3>
              <ul>${htmlViolations.join('')}</ul>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Este é um alerta automático gerado pelo Sistema de Controle Industrial.</p>
          </div>
        `,
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

    // Send SMS (Optional, if configured)
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
