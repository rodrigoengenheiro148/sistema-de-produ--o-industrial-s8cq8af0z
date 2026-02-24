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
import { Textarea } from '@/components/ui/textarea'
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
import { RawMaterialEntry } from '@/lib/types'
import { DialogFooter } from '@/components/ui/dialog'
import {
  RAW_MATERIAL_TYPES,
  MAR_RECICLAGEM_TYPES,
  MEASUREMENT_UNITS,
} from '@/lib/constants'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

interface RawMaterialFormProps {
  initialData?: RawMaterialEntry
  onSuccess: () => void
  onCancel: () => void
}

export function RawMaterialForm({
  initialData,
  onSuccess,
  onCancel,
}: RawMaterialFormProps) {
  const { addRawMaterial, updateRawMaterial, factories, currentFactoryId } =
    useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()
  const [showPcpGate, setShowPcpGate] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)

  const isMarReciclagem = useMemo(() => {
    const currentFactory = factories.find((f) => f.id === currentFactoryId)
    return currentFactory?.name?.trim().toLowerCase().includes('reciclagem')
  }, [factories, currentFactoryId])

  const materialTypes = useMemo(() => {
    return isMarReciclagem ? MAR_RECICLAGEM_TYPES : RAW_MATERIAL_TYPES
  }, [isMarReciclagem])

  const formSchema = useMemo(() => {
    const baseSchema = z.object({
      date: z.string().min(1, 'Data é obrigatória'),
      type: z.string().min(1, 'Tipo é obrigatório'),
      quantity: z
        .string()
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: 'Quantidade deve ser um número positivo',
        }),
      unit: z.string().min(1, 'Unidade é obrigatória'),
      notes: z.string().optional(),
    })

    if (isMarReciclagem) {
      return baseSchema.extend({
        supplier: z.string().optional(),
      })
    }

    return baseSchema.extend({
      supplier: z
        .string()
        .min(2, 'Fornecedor deve ter pelo menos 2 caracteres'),
    })
  }, [isMarReciclagem])

  type FormSchemaType = z.infer<typeof formSchema>

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      supplier: initialData?.supplier || '',
      type: initialData?.type || '',
      quantity: initialData ? String(initialData.quantity) : '',
      unit: initialData?.unit || 'kg',
      notes: initialData?.notes || '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        date: format(initialData.date, 'yyyy-MM-dd'),
        supplier: initialData.supplier,
        type: initialData.type,
        quantity: String(initialData.quantity),
        unit: initialData.unit || 'kg',
        notes: initialData.notes || '',
      })
    } else {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        supplier: '',
        type: '',
        quantity: '',
        unit: 'kg',
        notes: '',
      })
    }
  }, [initialData, form])

  function onSubmit(values: FormSchemaType) {
    const submitAction = () => {
      const quantityValue = Number(values.quantity)
      // Append T12:00:00 to force local noon interpretation and prevent timezone shifts
      const dateValue = new Date(`${values.date}T12:00:00`)

      // Ensure supplier is treated as string, defaulting to empty string if undefined/null
      const supplierValue = values.supplier || ''

      const entryData = {
        date: dateValue,
        supplier: supplierValue,
        type: values.type,
        quantity: quantityValue,
        unit: values.unit,
        notes: values.notes,
      }

      if (initialData) {
        updateRawMaterial({ ...entryData, id: initialData.id })
        toast({
          title: 'Sucesso',
          description: 'Entrada atualizada com sucesso!',
        })
      } else {
        addRawMaterial(entryData)
        toast({
          title: 'Sucesso',
          description: 'Entrada registrada com sucesso!',
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Entrada</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fornecedor{isMarReciclagem ? ' (Opcional)' : ''}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Matéria-Prima</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  key={`select-${materialTypes.length}`} // Force re-render if types change
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Un." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhes adicionais..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {initialData ? 'Salvar Alterações' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
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
