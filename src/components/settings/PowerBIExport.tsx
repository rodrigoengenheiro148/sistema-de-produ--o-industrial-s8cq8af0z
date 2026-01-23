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
import { FileBarChart, Loader2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { fetchAndExportPowerBIData } from '@/services/powerbi-export'

export function PowerBIExport() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      toast({
        title: 'Iniciando Exportação Power BI',
        description:
          'Gerando arquivos CSV e medidas DAX. Por favor, permita o download de múltiplos arquivos se solicitado.',
      })

      await fetchAndExportPowerBIData()

      toast({
        title: 'Bundle Power BI Gerado',
        description:
          'Todos os arquivos foram processados e baixados com sucesso.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro na Exportação',
        description:
          error.message ||
          'Não foi possível gerar os arquivos para Power BI. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
          <FileBarChart className="h-5 w-5" /> Exportação para Power BI
        </CardTitle>
        <CardDescription>
          Gere um pacote de dados compatível com Microsoft Power BI para análise
          avançada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-white/50 dark:bg-black/20 p-4 text-sm text-muted-foreground border border-yellow-100 dark:border-yellow-900/30">
          <p className="leading-relaxed mb-3">
            Esta funcionalidade prepara seus dados industriais para Business
            Intelligence:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>
              <strong>CSVs Individuais:</strong> Tabelas de Produção, Expedição,
              Qualidade, Acidez, Matéria-Prima e Fábricas formatadas para
              importação.
            </li>
            <li>
              <strong>Arquivo DAX:</strong> Script com as medidas essenciais já
              escritas (Rendimento, Receita, Médias).
            </li>
          </ul>
          <p className="text-xs italic mt-2 opacity-80">
            * O navegador pode solicitar permissão para baixar múltiplos
            arquivos sequencialmente.
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-yellow-100 dark:border-yellow-900/30 p-6">
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="w-full sm:w-auto border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-950"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando Bundle...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Gerar Power BI Bundle
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
