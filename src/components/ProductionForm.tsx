import { useEffect, useState, useMemo } from 'react'
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
} from '@/components/ui/form'
import { SheetFooter } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { ProductionEntry } from '@/lib/types'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
  mpUsed: z.coerce.number().min(0, 'Valor deve ser positivo'),
  sebo: z.coerce.number().min(0, 'Valor deve ser positivo'),
  fco: z.coerce.number().min(0, 'Valor deve ser positivo'),
  farinheta: z.coerce.number().min(0, 'Valor deve ser positivo'),
  bloodMealProduced: z.coerce.number().min(0, 'Valor deve ser positivo'),
  viscerasMealProduced: z.coerce.number().min(0, 'Valor deve ser positivo'),
  featherMealProduced: z.coerce.number().min(0, 'Valor deve ser positivo'),
  fishMealProduced: z.coerce.number().min(0, 'Valor deve ser positivo'),
  viscerasOilProduced: z.coerce.number().min(0, 'Valor deve ser positivo'),
  losses: z.coerce.number(),
})

interface ProductionFormProps {
  initialData?: ProductionEntry
  onSuccess: () => void
}

export function ProductionForm({
  initialData,
  onSuccess,
}: ProductionFormProps) {
  const { addProduction, updateProduction, currentFactoryId, factories } =
    useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()
  const [showPcpGate, setShowPcpGate] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)

  const isMarReciclagem = useMemo(() => {
    const factory = factories.find((f) => f.id === currentFactoryId)
    return factory?.name.toLowerCase().includes('mar reciclagem')
  }, [factories, currentFactoryId])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      shift: initialData?.shift || 'Manhã',
      mpUsed: initialData?.mpUsed || 0,
      sebo: initialData?.seboProduced || 0,
      fco: initialData?.fcoProduced || 0,
      farinheta: initialData?.farinhetaProduced || 0,
      bloodMealProduced: initialData?.bloodMealProduced || 0,
      viscerasMealProduced: initialData?.viscerasMealProduced || 0,
      featherMealProduced: initialData?.featherMealProduced || 0,
      fishMealProduced: initialData?.fishMealProduced || 0,
      viscerasOilProduced: initialData?.viscerasOilProduced || 0,
      losses: initialData?.losses || 0,
    },
  })

  const mpUsed = form.watch('mpUsed')
  const sebo = form.watch('sebo')
  const fco = form.watch('fco')
  const farinheta = form.watch('farinheta')
  const bloodMealProduced = form.watch('bloodMealProduced')
  const viscerasMealProduced = form.watch('viscerasMealProduced')
  const featherMealProduced = form.watch('featherMealProduced')
  const fishMealProduced = form.watch('fishMealProduced')
  const viscerasOilProduced = form.watch('viscerasOilProduced')

  useEffect(() => {
    // Loss Calculation
    // Losses = Input (MP) - Output (Sum of produced items)
    const input = Number(mpUsed) || 0
    let output = 0

    if (isMarReciclagem) {
      // Mar Reciclagem: Sum all specific outputs
      output =
        (Number(sebo) || 0) +
        (Number(fco) || 0) +
        (Number(bloodMealProduced) || 0) +
        (Number(viscerasMealProduced) || 0) +
        (Number(featherMealProduced) || 0) +
        (Number(fishMealProduced) || 0) +
        (Number(viscerasOilProduced) || 0)
    } else {
      // Standard: Sebo + FCO + Farinheta
      output =
        (Number(sebo) || 0) + (Number(fco) || 0) + (Number(farinheta) || 0)
    }

    const calculatedLosses = input - output

    form.setValue('losses', Math.max(0, calculatedLosses), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }, [
    mpUsed,
    sebo,
    fco,
    farinheta,
    bloodMealProduced,
    viscerasMealProduced,
    featherMealProduced,
    fishMealProduced,
    viscerasOilProduced,
    form,
    isMarReciclagem,
  ])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitAction = () => {
      // Append T12:00:00 to force local noon interpretation
      const entryData = {
        date: new Date(`${values.date}T12:00:00`),
        shift: values.shift,
        mpUsed: values.mpUsed,
        seboProduced: values.sebo,
        fcoProduced: values.fco,
        farinhetaProduced: isMarReciclagem ? 0 : values.farinheta,
        losses: values.losses,
        bloodMealProduced: isMarReciclagem ? values.bloodMealProduced : 0,
        bloodMealBags: 0,
        viscerasMealProduced: isMarReciclagem ? values.viscerasMealProduced : 0,
        featherMealProduced: isMarReciclagem ? values.featherMealProduced : 0,
        fishMealProduced: isMarReciclagem ? values.fishMealProduced : 0,
        viscerasOilProduced: isMarReciclagem ? values.viscerasOilProduced : 0,
      }

      if (initialData) {
        // If editing, preserve legacy data or other fields if not in current view
        // But for Mar Reciclagem vs Standard, we mostly overwrite
        const updatedData = {
          ...entryData,
          bloodMealProduced: isMarReciclagem
            ? values.bloodMealProduced
            : initialData.bloodMealProduced || 0,
          bloodMealBags: initialData.bloodMealBags || 0,
        }

        updateProduction({ ...updatedData, id: initialData.id })
        toast({
          title: 'Sucesso',
          description: 'Produção atualizada com sucesso!',
        })
      } else {
        addProduction(entryData)
        toast({
          title: 'Sucesso',
          description: 'Produção registrada com sucesso!',
        })
      }

      form.reset()
      onSuccess()
    }

    checkPcpAuth(submitAction, () => {
      setPendingSubmit(() => submitAction)
      setShowPcpGate(true)
    })
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
                        <SelectValue placeholder="Selecione" />
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

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
            <h3 className="font-medium text-sm text-slate-500">
              {isMarReciclagem ? 'Produção Mar Reciclagem' : 'Linha Principal'}
            </h3>
            <FormField
              control={form.control}
              name="mpUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entrada de MP (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMarReciclagem ? (
              // Mar Reciclagem Fields
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bloodMealProduced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinha de Sangue (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FCO (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viscerasMealProduced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinha de Vísceras (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featherMealProduced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinha de Penas (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fishMealProduced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinha de Peixe (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sebo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sebo (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="viscerasOilProduced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Óleo de Vísceras (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              // Standard Fields
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sebo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sebo (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinha Carne/Osso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="farinheta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farinheta (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="losses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perdas (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        readOnly
                        tabIndex={-1}
                        className="bg-red-50 border-red-200 text-red-700 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" className="w-full">
              {initialData ? 'Atualizar Produção' : 'Salvar Produção'}
            </Button>
          </SheetFooter>
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
