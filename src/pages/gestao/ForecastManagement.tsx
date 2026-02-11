import { useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CalendarIcon, Plus, Trash2, TrendingUp, Package } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { RAW_MATERIAL_TYPES } from '@/lib/constants'
import { DatePicker } from '@/components/ui/date-picker'

export default function ForecastManagement() {
  const { dailyForecasts, saveDailyForecast, deleteDailyForecast } = useData()
  const { toast } = useToast()

  const [date, setDate] = useState<Date>(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [materialType, setMaterialType] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter forecasts for selected date
  const forecastsForDate = dailyForecasts.filter((f) => isSameDay(f.date, date))

  const totalForecast = forecastsForDate.reduce(
    (acc, curr) => acc + curr.mpForecast,
    0,
  )

  const handleSave = async () => {
    if (!materialType) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o tipo de matéria-prima.',
        variant: 'destructive',
      })
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'A quantidade deve ser um número positivo.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await saveDailyForecast(date, qty, materialType)
      toast({
        title: 'Previsão Salva',
        description: 'A previsão foi registrada com sucesso.',
      })
      setIsOpen(false)
      setMaterialType('')
      setQuantity('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a previsão.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDailyForecast(id)
      toast({
        title: 'Previsão Removida',
        description: 'O registro foi excluído com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Previsão de Entrada de MP
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de previsões de recebimento para planejamento
            logístico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DatePicker date={date} setDate={setDate} />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nova Previsão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Previsão</DialogTitle>
                <DialogDescription>
                  Informe o tipo e a quantidade estimada para o dia{' '}
                  {format(date, 'dd/MM/yyyy')}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matéria-Prima</label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RAW_MATERIAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                      <SelectItem value="Geral">
                        Geral (Misto/Outros)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quantidade (Toneladas)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Previsão'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Previsões para {format(date, 'dd/MM/yyyy')}</CardTitle>
            <CardDescription>
              Lista de materiais previstos para o ciclo de 24h.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantidade (t)</TableHead>
                  <TableHead className="text-right">Quantidade (kg)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastsForDate.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground h-24"
                    >
                      Nenhuma previsão registrada para esta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  forecastsForDate.map((forecast) => (
                    <TableRow key={forecast.id}>
                      <TableCell className="font-medium">
                        {forecast.materialType || 'Geral'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(forecast.mpForecast / 1000).toFixed(2)} t
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {forecast.mpForecast.toLocaleString('pt-BR')} kg
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                          onClick={() => handleDelete(forecast.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Total Previsto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-primary">
                {(totalForecast / 1000).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                t
              </span>
              <span className="text-sm text-muted-foreground">
                {totalForecast.toLocaleString('pt-BR')} kg
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-primary/10 text-xs text-muted-foreground">
              Esta previsão é utilizada para o cálculo de fluxo e capacidade no
              Dashboard Logístico.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
