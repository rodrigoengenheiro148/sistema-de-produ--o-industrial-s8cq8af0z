import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isSameDay } from 'date-fns'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import { SteamControlRecord } from '@/lib/types'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  meterStart: z.coerce.number().min(0, 'Valor deve ser positivo'),
  meterEnd: z.coerce.number().min(0, 'Valor deve ser positivo'),
  soyWaste: z.coerce.number().min(0, 'Valor deve ser positivo'),
  firewood: z.coerce.number().min(0, 'Valor deve ser positivo'),
  riceHusk: z.coerce.number().min(0, 'Valor deve ser positivo'),
  woodChips: z.coerce.number().min(0, 'Valor deve ser positivo'),
  steamConsumption: z.coerce.number().optional(),
})

interface SteamControlFormProps {
  initialData?: SteamControlRecord
  onSuccess?: () => void
  onCancel?: () => void
}

export function SteamControlForm({
  initialData,
  onSuccess,
  onCancel,
}: SteamControlFormProps) {
  const { addSteamRecord, updateSteamRecord, rawMaterials } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      meterStart: initialData?.meterStart || 0,
      meterEnd: initialData?.meterEnd || 0,
      soyWaste: initialData?.soyWaste || 0,
      firewood: initialData?.firewood || 0,
      riceHusk: initialData?.riceHusk || 0,
      woodChips: initialData?.woodChips || 0,
      steamConsumption: initialData?.steamConsumption || 0,
    },
  })

  const selectedDateStr = form.watch('date')
  const meterStart = form.watch('meterStart')
  const meterEnd = form.watch('meterEnd')

  // Auto-calculate steam consumption based on meter readings
  useEffect(() => {
    // We update the calculated consumption field for visibility
    // AC requirement: Consumo Vapor = Medidor Fim - Medidor Início
    const diff = meterEnd - meterStart
    form.setValue('steamConsumption', diff)
  }, [meterStart, meterEnd, form])

  const calculatedMpEntry = useMemo(() => {
    if (!selectedDateStr) return 0
    const selectedDate = new Date(`${selectedDateStr}T12:00:00`)
    return rawMaterials
      .filter((rm) => isSameDay(rm.date, selectedDate) && rm.type !== 'Sangue') // Exclude "Sangue" from MP sum
      .reduce((acc, curr) => acc + curr.quantity, 0)
  }, [selectedDateStr, rawMaterials])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dateObj = new Date(`${values.date}T12:00:00`)
    // Ensure steam consumption is strictly meterEnd - meterStart
    const calculatedConsumption = values.meterEnd - values.meterStart

    if (initialData) {
      updateSteamRecord({
        ...initialData,
        date: dateObj,
        meterStart: values.meterStart,
        meterEnd: values.meterEnd,
        soyWaste: values.soyWaste,
        firewood: values.firewood,
        riceHusk: values.riceHusk,
        woodChips: values.woodChips,
        steamConsumption: calculatedConsumption,
      })
      toast({
        title: 'Registro atualizado',
        description: 'Dados de vapor salvos com sucesso.',
      })
    } else {
      addSteamRecord({
        date: dateObj,
        meterStart: values.meterStart,
        meterEnd: values.meterEnd,
        soyWaste: values.soyWaste,
        firewood: values.firewood,
        riceHusk: values.riceHusk,
        woodChips: values.woodChips,
        steamConsumption: calculatedConsumption,
        factoryId: '', // Handled by context
        userId: '', // Handled by context
      })
      toast({
        title: 'Registro criado',
        description: 'Dados de vapor salvos com sucesso.',
      })
    }

    if (onSuccess) onSuccess()
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-primary" />
          {initialData ? 'Editar Registro' : 'Novo Registro Diário'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Entrada MP (Automático)</FormLabel>
                <FormControl>
                  <Input
                    value={calculatedMpEntry.toLocaleString('pt-BR')}
                    disabled
                    className="bg-muted font-bold"
                  />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">
                  Soma das matérias-primas do dia selecionado.
                </p>
              </FormItem>

              <FormField
                control={form.control}
                name="meterStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medidor Início</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meterEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medidor Fim</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="soyWaste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resíduos de Soja</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firewood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lenha</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riceHusk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palha de Arroz</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="woodChips"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cavaco</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="steamConsumption"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-primary font-bold">
                      Consumo Vapor (Calculado)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="border-primary/30 bg-primary/5 font-bold"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit">Salvar Registro</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
