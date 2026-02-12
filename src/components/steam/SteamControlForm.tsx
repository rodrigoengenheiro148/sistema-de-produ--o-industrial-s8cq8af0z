import { useState } from 'react'
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
import { SteamControlEntry } from '@/lib/types'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  soyWaste: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
  firewood: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
  riceHusk: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
  woodChips: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
  meterStart: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
  meterEnd: z.coerce.number().min(0, 'Deve ser maior ou igual a 0'),
})

interface SteamControlFormProps {
  initialData?: SteamControlEntry
  onSuccess?: () => void
  onCancel?: () => void
}

export function SteamControlForm({
  initialData,
  onSuccess,
  onCancel,
}: SteamControlFormProps) {
  const { addSteamControlRecord, updateSteamControlRecord } = useData()
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
      soyWaste: initialData?.soyWaste || 0,
      firewood: initialData?.firewood || 0,
      riceHusk: initialData?.riceHusk || 0,
      woodChips: initialData?.woodChips || 0,
      meterStart: initialData?.meterStart || 0,
      meterEnd: initialData?.meterEnd || 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitAction = () => {
      setIsSubmitting(true)
      try {
        const dateObj = new Date(`${values.date}T12:00:00`)
        const steamConsumption = values.meterEnd - values.meterStart

        const entry = {
          date: dateObj,
          soyWaste: values.soyWaste,
          firewood: values.firewood,
          riceHusk: values.riceHusk,
          woodChips: values.woodChips,
          meterStart: values.meterStart,
          meterEnd: values.meterEnd,
          steamConsumption: steamConsumption < 0 ? 0 : steamConsumption,
          userId: '', // handled by context
          factoryId: '', // handled by context
        }

        if (initialData) {
          updateSteamControlRecord({ ...entry, id: initialData.id })
          toast({
            title: 'Registro atualizado',
            description: 'Os dados de controle de vapor foram atualizados.',
          })
        } else {
          addSteamControlRecord(entry)
          toast({
            title: 'Registro salvo',
            description: 'Os dados de controle de vapor foram registrados.',
          })
        }

        if (onSuccess) onSuccess()
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Verifique os dados e tente novamente.',
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="meterStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Início PR (Medidor)</FormLabel>
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
                  <FormLabel>Término PR (Medidor)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <FormLabel>Palha Arroz</FormLabel>
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
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
