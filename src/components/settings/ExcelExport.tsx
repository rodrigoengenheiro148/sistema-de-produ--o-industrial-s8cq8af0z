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
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateAndDownloadExcel } from '@/services/excel-export'

export function ExcelExport() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      await generateAndDownloadExcel()
      toast({
        title: 'Download Iniciado',
        description:
          'Sua planilha Excel (.xls) com múltiplas abas foi gerada com sucesso.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro na Exportação',
        description: error.message || 'Falha ao gerar o arquivo Excel.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-500">
          <FileSpreadsheet className="h-5 w-5" /> Exportar para Excel
        </CardTitle>
        <CardDescription>
          Baixe todos os dados do sistema em uma planilha formatada com
          múltiplas abas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-white/50 dark:bg-black/20 p-4 text-sm text-muted-foreground border border-green-100 dark:border-green-900/30">
          <p className="leading-relaxed">
            Gera um arquivo compatível com Excel contendo abas separadas para:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Produção e Expedição</li>
            <li>Controle de Qualidade e Acidez</li>
            <li>Matéria-Prima e Fábricas</li>
          </ul>
          <p className="text-xs italic mt-2 opacity-80">
            * O arquivo é ideal para edição offline e compartilhamento com
            stakeholders.
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-green-100 dark:border-green-900/30 p-6">
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-100 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando Planilha...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Baixar Excel (.xls)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
