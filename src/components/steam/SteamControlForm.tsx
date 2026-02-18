import { useState, useMemo } from 'react'
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
  FormDescription,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { SteamControlEntry } from '@/lib/types'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

// Combined schema that works for both modes.
// Fields are optional because they depend on the factory mode.
const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  // Standard fields
  soyWaste: z.coerce.number().min(0).optional(),
  firewood: z.coerce.number().min(0).optional(),
  riceHusk: z.coerce.number().min(0).optional(),
  woodChips: z.coerce.number().min(0).optional(),
  meterStart: z.coerce.number().min(0).optional(),
  meterEnd: z.coerce.number().min(0).optional(),
  // Farinorte fields
  weightKg: z.coerce.number().min(0).optional(),
  packageCount: z.coerce.number().min(0).optional(),
  volumeM3: z.coerce.number().min(0).optional(),
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
  const {
    addSteamControlRecord,
    updateSteamControlRecord,
    factories,
    currentFactoryId,
  } = useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()
  const [showPcpGate, setShowPcpGate] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentFactory = useMemo(
    () => factories.find((f) => f.id === currentFactoryId),
    [factories, currentFactoryId],
  )
  const isFarinorte =
    currentFactory?.name.toLowerCase().includes('farinorte') ?? false

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      // Standard defaults
      soyWaste: initialData?.soyWaste || 0,
      firewood: initialData?.firewood || 0,
      riceHusk: initialData?.riceHusk || 0,
      woodChips: initialData?.woodChips || 0,
      meterStart: initialData?.meterStart || 0,
      meterEnd: initialData?.meterEnd || 0,
      // Farinorte defaults
      weightKg: initialData?.weightKg || 0,
      packageCount: initialData?.packageCount || 0,
      volumeM3: initialData?.volumeM3 || 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitAction = () => {
      setIsSubmitting(true)
      try {
        const dateObj = new Date(`${values.date}T12:00:00`)
        const steamConsumption =
          (values.meterEnd || 0) - (values.meterStart || 0)

        // Ensure we send 0 for fields not visible in current mode
        const entry = {
          date: dateObj,
          soyWaste: isFarinorte ? 0 : values.soyWaste || 0,
          firewood: isFarinorte ? 0 : values.firewood || 0,
          riceHusk: isFarinorte ? 0 : values.riceHusk || 0,
          woodChips: isFarinorte ? 0 : values.woodChips || 0,
          meterStart: isFarinorte ? 0 : values.meterStart || 0,
          meterEnd: isFarinorte ? 0 : values.meterEnd || 0,
          steamConsumption: isFarinorte
            ? 0
            : steamConsumption < 0
              ? 0
              : steamConsumption,
          // Farinorte specific
          weightKg: isFarinorte ? values.weightKg || 0 : 0,
          packageCount: isFarinorte ? values.packageCount || 0 : 0,
          volumeM3: isFarinorte ? values.volumeM3 || 0 : 0,
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

          {isFarinorte ? (
            /* Farinorte Specific Fields */
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrada Kg</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription className="text-emerald-600 font-medium">
                        Cálculo (x 0.18):{' '}
                        {((Number(field.value) || 0) * 0.18).toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrada de pacotes</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormDescription className="text-emerald-600 font-medium">
                        Cálculo (x 2):{' '}
                        {((Number(field.value) || 0) * 2).toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volumeM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrada m³</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : (
            /* Standard Fields */
            <>
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
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
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
