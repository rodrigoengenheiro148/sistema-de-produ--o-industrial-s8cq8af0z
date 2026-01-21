import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { Factory } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  location: z.string().min(2, 'Localização é obrigatória'),
  manager: z.string().min(2, 'Nome do responsável é obrigatório'),
  status: z.enum(['active', 'inactive']),
})

interface FactoryFormProps {
  initialData?: Factory
  onSuccess: () => void
}

export function FactoryForm({ initialData, onSuccess }: FactoryFormProps) {
  const { addFactory, updateFactory } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      location: initialData?.location || '',
      manager: initialData?.manager || '',
      status: initialData?.status || 'active',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      name: values.name,
      location: values.location,
      manager: values.manager,
      status: values.status,
      createdAt: initialData?.createdAt || new Date(),
    }

    if (initialData) {
      updateFactory({ ...entryData, id: initialData.id })
      toast({
        title: 'Fábrica Atualizada',
        description: 'Os dados da unidade foram atualizados.',
      })
    } else {
      addFactory(entryData)
      toast({
        title: 'Fábrica Adicionada',
        description: 'Nova unidade registrada no sistema.',
      })
    }

    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Unidade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Matriz - São Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localização</FormLabel>
              <FormControl>
                <Input placeholder="Cidade, Estado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gerente Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome do gerente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Operacional</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa / Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Define se a fábrica está operando e recebendo dados.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-4">
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Adicionar Fábrica'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
