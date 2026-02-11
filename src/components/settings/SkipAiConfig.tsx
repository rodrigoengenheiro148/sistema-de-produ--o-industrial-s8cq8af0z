import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Save, Link } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

const formSchema = z.object({
  baseUrl: z.string().optional(),
  apiToken: z.string().optional(),
  apiDocumentationUrl: z.string().optional(),
})

export function SkipAiConfig() {
  const { protheusConfig, updateProtheusConfig } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseUrl: protheusConfig.baseUrl,
      apiToken: protheusConfig.apiToken,
      apiDocumentationUrl: protheusConfig.apiDocumentationUrl,
    },
  })

  // Update form values when context data changes
  useEffect(() => {
    form.reset({
      baseUrl: protheusConfig.baseUrl || '',
      apiToken: protheusConfig.apiToken || '',
      apiDocumentationUrl: protheusConfig.apiDocumentationUrl || '',
    })
  }, [protheusConfig, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const configToSave = {
      ...protheusConfig,
      baseUrl: values.baseUrl || '',
      apiToken: values.apiToken || '',
      apiDocumentationUrl: values.apiDocumentationUrl || '',
    }

    try {
      updateProtheusConfig(configToSave)
      toast({
        title: 'Configurações de Dados Salvas',
        description:
          'As credenciais de integração foram atualizadas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Ocorreu um problema ao salvar as configurações.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/10 dark:border-indigo-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <Settings className="h-5 w-5" />
          Configuração Skip AI
        </CardTitle>
        <CardDescription>
          Gerencie as credenciais e endpoints para integração com a API de
          produção industrial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint de API</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.industrial.com/v1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL base para as requisições de dados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token de autenticação</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Bearer token..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Chave de segurança para acesso aos serviços externos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiDocumentationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documentação da API</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="https://docs.api.com" {...field} />
                      {field.value && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(field.value, '_blank')}
                          title="Abrir documentação"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Link para referência técnica da integração.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" /> Salvar Credenciais
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
