import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { ProductionEntry } from '@/lib/types'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

const formSchema = z.object({
  date: z.date({
    required_error: 'A data é obrigatória',
  }),
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
  factoryId: z.string().min(1, 'A fábrica é obrigatória'),
  mpUsed: z.coerce.number().min(0, 'O valor deve ser positivo'),
  bloodMealProduced: z.coerce
    .number()
    .min(0, 'O valor deve ser positivo')
    .refine((val) => val > 0, 'A produção deve ser maior que 0'),
  bloodMealBags: z.coerce
    .number()
    .min(0, 'A quantidade de sacos deve ser positiva')
    .int('O número de sacos deve ser inteiro'),
})

interface BloodProductionFormProps {
  initialData?: ProductionEntry
  onSuccess: () => void
  onCancel: () => void
}

export function BloodProductionForm({
  initialData,
  onSuccess,
  onCancel,
}: BloodProductionFormProps) {
  const { addProduction, updateProduction, factories, currentFactoryId } =
    useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()
  const [showPcpGate, setShowPcpGate] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      shift: initialData?.shift || 'Manhã',
      factoryId: initialData?.factoryId || currentFactoryId || '',
      mpUsed: initialData?.mpUsed || 0,
      bloodMealProduced: initialData?.bloodMealProduced || 0,
      bloodMealBags: initialData?.bloodMealBags || 0,
    },
  })

  const bloodMealBags = form.watch('bloodMealBags')

  // Auto-calculate kg from bags (approx. 1400kg/bag if standard, but keeping editable)
  useEffect(() => {
    if (form.formState.dirtyFields.bloodMealBags) {
      const bags = Number(bloodMealBags) || 0
      if (bags > 0) {
        form.setValue('bloodMealProduced', bags * 1400, {
          shouldValidate: true,
        })
      }
    }
  }, [bloodMealBags, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const submitAction = async () => {
      const entryData = {
        date: values.date, // already a Date object from calendar
        shift: values.shift,
        factoryId: values.factoryId,
        bloodMealProduced: values.bloodMealProduced,
        bloodMealBags: values.bloodMealBags,
        mpUsed: values.mpUsed,
        // Default other fields to 0 as per requirement
        seboProduced: 0,
        fcoProduced: 0,
        farinhetaProduced: 0,
        losses: 0,
      }

      try {
        if (initialData) {
          // Keep existing values for other fields if editing
          updateProduction({
            ...initialData,
            ...entryData,
            id: initialData.id,
          })
          toast({
            title: 'Registro atualizado',
            description: 'A produção de sangue foi atualizada com sucesso.',
          })
        } else {
          addProduction(entryData)
          toast({
            title: 'Registro criado',
            description: 'A produção de sangue foi registrada com sucesso.',
          })
        }
        form.reset()
        onSuccess()
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o registro.',
          variant: 'destructive',
        })
      }
    }

    checkPcpAuth(submitAction, () => {
      setPendingSubmit(() => submitAction)
      setShowPcpGate(true)
    })
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Produção</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="factoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fábrica</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fábrica" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {factories.map((factory) => (
                      <SelectItem key={factory.id} value={factory.id}>
                        {factory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-md">
            <FormField
              control={form.control}
              name="mpUsed"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>MP processada (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    Quantidade total de matéria-prima utilizada no processo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodMealBags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Sacos</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    Número total de bags produzidos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloodMealProduced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produção (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    Total em quilogramas (aprox. 1400kg/bag)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Registro</Button>
          </div>
        </form>
      </Form>
      <PcpGate
        isOpen={showPcpGate}
        onOpenChange={setShowPcpGate}
        onSuccess={() => {
          if (pendingSubmit) pendingSubmit()
          setPendingSubmit(null)
        }}
      />
    </>
  )
}
