import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface TableConfig {
  name: string
  title: string
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return ''

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não'
  }

  if (value instanceof Date) {
    return format(value, 'dd/MM/yyyy HH:mm')
  }

  if (typeof value === 'string') {
    // Check for ISO date string patterns
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy HH:mm')
      }
    }
    return value
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Objeto]'
    }
  }

  return String(value)
}

const generateTableHtml = (title: string, data: any[]) => {
  if (!data || data.length === 0) {
    return `
      <section class="section">
        <h2>${title}</h2>
        <p class="empty-state">Nenhum registro encontrado.</p>
      </section>
    `
  }

  const headers = Object.keys(data[0])

  const headerRow = headers.map((h) => `<th>${h}</th>`).join('')
  const rows = data
    .map((row) => {
      const cells = headers
        .map((header) => {
          return `<td>${formatValue(row[header])}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `
}

export const exportSystemData = async () => {
  const tables: TableConfig[] = [
    { name: 'factories', title: 'Fábricas' },
    { name: 'production', title: 'Produção' },
    { name: 'shipping', title: 'Expedição' },
    { name: 'raw_materials', title: 'Matéria-Prima' },
    { name: 'quality_records', title: 'Controle de Qualidade' },
    { name: 'acidity_records', title: 'Registros de Acidez' },
  ]

  const results = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase.from(table.name).select('*')
      if (error) {
        throw new Error(
          `Erro ao buscar dados de ${table.title}: ${error.message}`,
        )
      }
      return { ...table, data: data || [] }
    }),
  )

  const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss')
  const style = `
    :root {
      --primary: #2563eb;
      --text: #1f2937;
      --text-light: #6b7280;
      --bg: #ffffff;
      --bg-alt: #f9fafb;
      --border: #e5e7eb;
    }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      color: var(--text); 
      line-height: 1.5; 
      padding: 2rem; 
      max-width: 1400px; 
      margin: 0 auto; 
    }
    header {
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--border);
      padding-bottom: 1rem;
    }
    h1 { 
      color: var(--primary); 
      margin: 0;
      font-size: 1.875rem;
    }
    .meta { 
      color: var(--text-light); 
      font-size: 0.875rem; 
      margin-top: 0.5rem;
    }
    .section {
      margin-bottom: 3rem;
    }
    h2 { 
      color: var(--text); 
      margin-bottom: 1rem; 
      font-size: 1.5rem; 
      border-left: 4px solid var(--primary);
      padding-left: 0.75rem;
    }
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 0.875rem; 
      white-space: nowrap;
    }
    th { 
      background-color: var(--bg-alt); 
      font-weight: 600; 
      text-align: left; 
      padding: 0.75rem 1rem; 
      border-bottom: 1px solid var(--border); 
      color: var(--text);
    }
    td { 
      padding: 0.75rem 1rem; 
      border-bottom: 1px solid var(--border); 
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background-color: var(--bg-alt);
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      background-color: var(--bg-alt);
      border-radius: 0.5rem;
      color: var(--text-light);
    }
    @media print {
      body { padding: 0; }
      .table-container { border: none; box-shadow: none; }
    }
  `

  const content = results
    .map((r) => generateTableHtml(r.title, r.data))
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Completo - Sistema de Produção Industrial</title>
      <style>${style}</style>
    </head>
    <body>
      <header>
        <h1>Relatório Completo do Sistema</h1>
        <div class="meta">Gerado em: ${timestamp}</div>
      </header>
      ${content}
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio_industrial_${format(new Date(), 'yyyy-MM-dd')}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
