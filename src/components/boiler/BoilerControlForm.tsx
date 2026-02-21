import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { BoilerControlRecord } from '@/lib/types'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'
import { parseAsLocalNoon } from '@/lib/utils'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  cald01Pct: z.coerce.number().min(0).optional(),
  cald01M3: z.coerce.number().min(0).optional(),
  cald02Pct: z.coerce.number().min(0).optional(),
  cald02M3: z.coerce.number().min(0).optional(),
  woodEntryPct: z.coerce.number().min(0).optional(),
  woodEntryM3: z.coerce.number().min(0).optional(),
  initialStockPct: z.coerce.number().min(0).optional(),
  initialStockM3: z.coerce.number().min(0).optional(),
})

interface Props {
  initialData?: BoilerControlRecord
  onSuccess?: () => void
  onCancel?: () => void
}

export function BoilerControlForm({ initialData, onSuccess, onCancel }: Props) {
  const {
    addBoilerControlRecord,
    updateBoilerControlRecord,
    boilerControlRecords,
  } = useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()

  const [showPcpGate, setShowPcpGate] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      cald01Pct: initialData?.cald01Pct || 0,
      cald01M3: initialData?.cald01M3 || 0,
      cald02Pct: initialData?.cald02Pct || 0,
      cald02M3: initialData?.cald02M3 || 0,
      woodEntryPct: initialData?.woodEntryPct || 0,
      woodEntryM3: initialData?.woodEntryM3 || 0,
      initialStockPct: initialData?.initialStockPct || 0,
      initialStockM3: initialData?.initialStockM3 || 0,
    },
  })

  // Auto-calculate initial stock based on previous records if it's a new entry
  useEffect(() => {
    if (!initialData) {
      const selectedDateStr = form.watch('date')
      if (selectedDateStr) {
        const selectedDate = parseAsLocalNoon(selectedDateStr)

        const pastRecords = boilerControlRecords
          .filter((r) => r.date < selectedDate)
          .sort((a, b) => a.date.getTime() - b.date.getTime())

        if (pastRecords.length > 0) {
          let currentPct = 0
          let currentM3 = 0
          pastRecords.forEach((r) => {
            const startPct =
              r.initialStockPct > 0 ? r.initialStockPct : currentPct
            const startM3 = r.initialStockM3 > 0 ? r.initialStockM3 : currentM3
            currentPct = startPct + r.woodEntryPct - r.cald01Pct - r.cald02Pct
            currentM3 = startM3 + r.woodEntryM3 - r.cald01M3 - r.cald02M3
          })

          form.setValue('initialStockPct', Number(currentPct.toFixed(2)))
          form.setValue('initialStockM3', Number(currentM3.toFixed(2)))
        } else {
          form.setValue('initialStockPct', 0)
          form.setValue('initialStockM3', 0)
        }
      }
    }
  }, [form.watch('date'), boilerControlRecords, initialData, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitAction = () => {
      setIsSubmitting(true)
      try {
        const entry = {
          date: parseAsLocalNoon(values.date),
          cald01Pct: values.cald01Pct || 0,
          cald01M3: values.cald01M3 || 0,
          cald02Pct: values.cald02Pct || 0,
          cald02M3: values.cald02M3 || 0,
          woodEntryPct: values.woodEntryPct || 0,
          woodEntryM3: values.woodEntryM3 || 0,
          initialStockPct: values.initialStockPct || 0,
          initialStockM3: values.initialStockM3 || 0,
          factoryId: '', // Filled in DataContext
        }

        if (initialData) {
          updateBoilerControlRecord({ ...entry, id: initialData.id })
          toast({ title: 'Registro atualizado com sucesso.' })
        } else {
          addBoilerControlRecord(entry)
          toast({ title: 'Registro salvo com sucesso.' })
        }

        if (onSuccess) onSuccess()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar o registro.',
        })
      } finally {
        setIsSubmitting(false)
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Registro</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
              <h3 className="font-semibold text-sm text-primary">
                CALDEIRA PCT
              </h3>
              <FormField
                control={form.control}
                name="cald01Pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cald 01</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cald02Pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cald 02</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
              <h3 className="font-semibold text-sm text-primary">
                CALDEIRA M³
              </h3>
              <FormField
                control={form.control}
                name="cald01M3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cald 01</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cald02M3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cald 02</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
              <h3 className="font-semibold text-sm text-primary">
                ENTRADA DE LENHA
              </h3>
              <FormField
                control={form.control}
                name="woodEntryPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PCT</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="woodEntryM3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M³</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border p-4 rounded-md bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-sm text-primary">
                ESTOQUE INICIAL
              </h3>
              <p className="text-xs text-muted-foreground -mt-3">
                Ajuste apenas se necessário. O saldo é calculado
                automaticamente.
              </p>
              <FormField
                control={form.control}
                name="initialStockPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PCT</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialStockM3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M³</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
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
