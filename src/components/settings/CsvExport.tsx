import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { fetchAndZipCsvData } from '@/services/csv-export'

export function CsvExport() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Preparando Arquivos',
        description: 'Buscando dados e gerando arquivo ZIP...',
      })

      await fetchAndZipCsvData()

      toast({
        title: 'Download Iniciado',
        description: 'Seu arquivo ZIP com os CSVs foi gerado com sucesso.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro na Exportação',
        description:
          error.message || 'Falha ao gerar o arquivo ZIP. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
          <FileText className="h-5 w-5" /> Exportar para CSV
        </CardTitle>
        <CardDescription>
          Baixe os dados brutos de cada módulo em formato CSV, agrupados em um
          único arquivo ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-white/50 dark:bg-black/20 p-4 text-sm text-muted-foreground border border-blue-100 dark:border-blue-900/30">
          <p className="leading-relaxed">
            Ideal para importação em outros sistemas ou análise de dados. O
            pacote inclui:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Tabelas individuais para cada módulo (Produção, Expedição, etc.)
            </li>
            <li>Formato universal (.csv) separado por vírgulas</li>
            <li>Compactação automática em arquivo .zip</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="border-t border-blue-100 dark:border-blue-900/30 p-6">
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="w-full sm:w-auto border-blue-600 text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Compactando Dados...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar ZIP (CSV)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
