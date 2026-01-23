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
import { FileDown, Loader2, Database } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportSystemData } from '@/services/export'

export function DataExport() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      await exportSystemData()
      toast({
        title: 'Exportação Concluída',
        description: 'O arquivo HTML foi gerado e o download iniciado.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro na Exportação',
        description:
          error.message ||
          'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Exportação de Dados
        </CardTitle>
        <CardDescription>
          Exporte todos os registros do sistema para um arquivo HTML offline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground border border-muted">
          <p className="leading-relaxed">
            Esta ferramenta irá coletar todos os dados das tabelas de{' '}
            <strong>
              Produção, Expedição, Qualidade, Acidez, Matéria-Prima e Fábricas
            </strong>
            , gerando um relatório completo e formatado para visualização em
            qualquer navegador web. Isso serve como um backup portátil dos dados
            do sistema.
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t p-6">
        <Button
          onClick={handleExport}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando Relatório...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Gerar Relatório HTML
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
