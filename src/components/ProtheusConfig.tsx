import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Activity,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  baseUrl: z.string().min(1, 'Base URL é obrigatória').url('URL inválida'),
  clientId: z.string().min(1, 'Client ID é obrigatório'),
  clientSecret: z.string().min(1, 'Client Secret é obrigatório'),
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  syncInventory: z.boolean(),
  syncProduction: z.boolean(),
  isActive: z.boolean(),
})

export function ProtheusConfig() {
  const { protheusConfig, updateProtheusConfig, testProtheusConnection } =
    useData()
  const { toast } = useToast()
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: protheusConfig,
  })

  const isActive = form.watch('isActive')

  async function onSubmit(values: z.infer<typeof formSchema>) {
    updateProtheusConfig(values)
    toast({
      title: 'Configurações Salvas',
      description: 'As credenciais do Protheus foram atualizadas.',
    })
    // Reset connection status on save to force re-test if needed
    setConnectionStatus('idle')
  }

  async function handleTestConnection() {
    setIsTesting(true)
    setConnectionStatus('idle')

    // Save current form values to context before testing to ensure latest data is used
    const currentValues = form.getValues()
    updateProtheusConfig(currentValues)

    try {
      const result = await testProtheusConnection()
      if (result.success) {
        setConnectionStatus('success')
        toast({
          title: 'Conexão Bem-sucedida',
          description: result.message,
          className: 'bg-green-50 border-green-200',
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: 'Erro na Conexão',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      setConnectionStatus('error')
      toast({
        title: 'Erro Inesperado',
        description: 'Não foi possível contatar o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/10 dark:border-blue-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Server className="h-5 w-5" />
              Integração Protheus ERP
            </CardTitle>
            <CardDescription>
              Configure a conexão API para sincronização de dados corporativos.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'success' && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-200 flex gap-1"
              >
                <CheckCircle2 className="h-3 w-3" /> Online
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge
                variant="destructive"
                className="bg-red-100 text-red-700 border-red-200 flex gap-1 hover:bg-red-200"
              >
                <XCircle className="h-3 w-3" /> Erro
              </Badge>
            )}
            {connectionStatus === 'idle' && isActive && (
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-700 border-gray-200 flex gap-1"
              >
                <Activity className="h-3 w-3" /> Aguardando Teste
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Habilitar Integração
                </FormLabel>
                <FormDescription>
                  Ativa a comunicação com o servidor Protheus.
                </FormDescription>
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
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

            {isActive && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>API Base URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.protheus.empresa.com.br/v1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="user.api" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Client ID da aplicação"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Client Secret da aplicação"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Mapeamento de Entidades
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="syncInventory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                          <div className="space-y-0.5">
                            <FormLabel>Sincronizar Estoque</FormLabel>
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
                      name="syncProduction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                          <div className="space-y-0.5">
                            <FormLabel>Ordens de Produção</FormLabel>
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
                </div>
              </div>
            )}

            <CardFooter className="px-0 pt-2 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={!isActive || isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                Testar Conexão
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" /> Salvar Configuração
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
