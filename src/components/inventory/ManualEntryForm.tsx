import { useState, useMemo, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveSeboInventory } from '@/services/seboInventory'
import { useToast } from '@/hooks/use-toast'
import { SeboInventoryRecord } from '@/lib/types'

interface ManualEntryFormProps {
  onSuccess: () => void
}

const DEFAULT_OPTIONS = [
  { value: 'Sebo', label: 'Sebo', unit: 'Litros' },
  { value: 'Óleo', label: 'Óleo', unit: 'Litros' },
  { value: 'Farinha de Sangue', label: 'Farinha de Sangue', unit: 'kg' },
  { value: 'Farinha de Penas', label: 'Farinha de Penas', unit: 'kg' },
] as const

const MAR_OPTIONS = [
  { value: 'Torta de Carne', label: 'Torta de Carne', unit: 'kg' },
  { value: 'Farinha de Vísceras', label: 'Farinha de Vísceras', unit: 'kg' },
  { value: 'Farinha de Peixe', label: 'Farinha de Peixe', unit: 'kg' },
] as const

export function ManualEntryForm({ onSuccess }: ManualEntryFormProps) {
  const { currentFactoryId, factories, refreshOperationalData } = useData()
  const { user } = useAuth()
  const { toast } = useToast()

  const [date, setDate] = useState<Date>(new Date())
  const [material, setMaterial] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  const isMarReciclagem =
    currentFactory?.name === 'Mar Reciclagem' || currentFactory?.name === 'Mar'

  const availableOptions = useMemo(() => {
    if (isMarReciclagem) {
      return [...DEFAULT_OPTIONS, ...MAR_OPTIONS]
    }
    return DEFAULT_OPTIONS
  }, [isMarReciclagem])

  const selectedMaterial = availableOptions.find((m) => m.value === material)
  const unitLabel = selectedMaterial ? selectedMaterial.unit : 'Unidade'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !material || !quantity) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      })
      return
    }

    const qtyValue = parseFloat(quantity)
    if (isNaN(qtyValue) || qtyValue < 0) {
      toast({
        title: 'Quantidade Inválida',
        description: 'A quantidade deve ser um número válido e positivo.',
        variant: 'destructive',
      })
      return
    }

    if (!currentFactoryId || !user?.id) {
      toast({
        title: 'Erro de Contexto',
        description: 'Fábrica ou usuário não identificado.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const isLiquid = material === 'Sebo' || material === 'Óleo'
      const record: SeboInventoryRecord = {
        factoryId: currentFactoryId,
        userId: user.id,
        date: date,
        category: material as any,
        quantityLt: isLiquid ? qtyValue : 0,
        quantityKg: !isLiquid ? qtyValue : 0,
      }

      await saveSeboInventory([record])

      // Trigger data refresh to update charts in dashboard
      await refreshOperationalData()

      toast({
        title: 'Apontamento Salvo',
        description: 'O estoque foi atualizado com sucesso.',
        className: 'bg-green-600 text-white border-none',
      })

      // Reset form (keep date)
      setMaterial('')
      setQuantity('')
      onSuccess()
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao Salvar',
        description: error.message || 'Ocorreu um erro ao salvar o registro.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registro Manual de Estoque</CardTitle>
        <CardDescription>
          Informe a contagem física atual do material.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da Contagem</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger id="material">
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade {selectedMaterial && `(${unitLabel})`}
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!material}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm bg-muted/20 pl-2 border-l">
                {unitLabel}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading || !material || !quantity}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Registrar Estoque
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
