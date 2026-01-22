import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DialogFooter } from '@/components/ui/dialog'
import { UserAccessEntry, UserRole } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['Administrator', 'Manager', 'Operator']),
})

interface UserAccessFormProps {
  initialData?: UserAccessEntry
  onSuccess: () => void
}

export function UserAccessForm({
  initialData,
  onSuccess,
}: UserAccessFormProps) {
  const { addUserAccess, updateUserAccess } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      role: initialData?.role || 'Operator',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      name: values.name,
      role: values.role as UserRole,
      createdAt: initialData?.createdAt || new Date(),
    }

    if (initialData) {
      updateUserAccess({ ...entryData, id: initialData.id })
      toast({
        title: 'Usuário Atualizado',
        description: 'Dados salvos com sucesso.',
      })
    } else {
      addUserAccess(entryData)
      toast({
        title: 'Usuário Adicionado',
        description: 'Novo usuário com acesso registrado.',
      })
    }

    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Maria Oliveira" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função / Perfil</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Administrator">Administrador</SelectItem>
                  <SelectItem value="Manager">Gerente</SelectItem>
                  <SelectItem value="Operator">Operador</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Define as permissões de acesso ao sistema.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Adicionar Usuário'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
