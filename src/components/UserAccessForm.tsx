import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { UserAccessEntry } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.string().min(2, 'Função deve ter pelo menos 2 caracteres'),
  editProduction: z.boolean().default(false),
  deleteHistory: z.boolean().default(false),
  modifyConstants: z.boolean().default(false),
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
      role: initialData?.role || '',
      editProduction: initialData?.permissions.editProduction || false,
      deleteHistory: initialData?.permissions.deleteHistory || false,
      modifyConstants: initialData?.permissions.modifyConstants || false,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      name: values.name,
      role: values.role,
      permissions: {
        editProduction: values.editProduction,
        deleteHistory: values.deleteHistory,
        modifyConstants: values.modifyConstants,
      },
      createdAt: initialData?.createdAt || new Date(),
    }

    if (initialData) {
      updateUserAccess({ ...entryData, id: initialData.id })
      toast({
        title: 'Usuário Atualizado',
        description: 'Permissões e dados foram salvos.',
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
        <div className="space-y-4">
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
                <FormLabel>Função / Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Supervisor de Produção" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">
            Permissões de Acesso
          </h4>
          <FormField
            control={form.control}
            name="editProduction"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                <div className="space-y-0.5">
                  <FormLabel>Editar Produção</FormLabel>
                  <FormDescription>
                    Pode alterar registros de produção e indicadores.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modifyConstants"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                <div className="space-y-0.5">
                  <FormLabel>Modificar Constantes</FormLabel>
                  <FormDescription>
                    Pode alterar metas e limites do sistema.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deleteHistory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                <div className="space-y-0.5">
                  <FormLabel className="text-destructive">
                    Apagar Histórico
                  </FormLabel>
                  <FormDescription>
                    Pode excluir registros permanentemente.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Adicionar Usuário'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
