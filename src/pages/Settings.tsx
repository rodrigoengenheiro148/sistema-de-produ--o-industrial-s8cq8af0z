import { useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Save,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Server,
  AlertTriangle,
  Bell,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { NotificationSettings } from '@/lib/types'

export default function Settings() {
  const {
    protheusConfig,
    updateProtheusConfig,
    testProtheusConnection,
    syncProtheusData,
    connectionStatus,
    clearAllData,
    systemSettings,
    updateSystemSettings,
    notificationSettings,
    updateNotificationSettings,
  } = useData()

  const { toast } = useToast()
  const navigate = useNavigate()

  const [config, setConfig] = useState(protheusConfig)
  const [testing, setTesting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [localSettings, setLocalSettings] = useState(systemSettings)
  const [localNotifications, setLocalNotifications] =
    useState<NotificationSettings>(notificationSettings)

  // Sync state with context when context updates
  useEffect(() => {
    setLocalNotifications(notificationSettings)
  }, [notificationSettings])

  useEffect(() => {
    setConfig(protheusConfig)
  }, [protheusConfig])

  const handleSaveConnection = async () => {
    updateProtheusConfig(config)
    toast({
      title: 'Configurações Salvas',
      description: 'As configurações de conexão foram atualizadas.',
    })

    if (config.isActive) {
      setTesting(true)
      const result = await testProtheusConnection()
      setTesting(false)

      if (result.success) {
        toast({
          title: 'Conexão Estabelecida',
          description: 'Conectado ao servidor com sucesso.',
          variant: 'default',
        })
        syncProtheusData()
      } else {
        toast({
          title: 'Falha na Conexão',
          description: result.message,
          variant: 'destructive',
        })
      }
    }
  }

  const handleSaveSystem = () => {
    updateSystemSettings(localSettings)
    toast({
      title: 'Preferências Salvas',
      description: 'As configurações do sistema foram atualizadas.',
    })
  }

  const handleSaveNotifications = async () => {
    if (localNotifications.yieldThreshold < 0) {
      toast({
        title: 'Valor Inválido',
        description: 'A meta de rendimento deve ser positiva.',
        variant: 'destructive',
      })
      return
    }

    await updateNotificationSettings(localNotifications)
    toast({
      title: 'Configurações de Alerta Salvas',
      description:
        'Suas preferências de notificação foram atualizadas com sucesso.',
    })
  }

  const handleClearData = async () => {
    setIsClearing(true)
    if (protheusConfig.isActive) {
      toast({
        title: 'Limpeza Global Iniciada',
        description:
          'Aguarde enquanto os registros são removidos do servidor e de todos os dispositivos...',
      })
    }

    try {
      await clearAllData()
      toast({
        title: 'Sistema Resetado',
        description: 'Todos os dados foram apagados com sucesso.',
        variant: 'default',
      })
      navigate('/')
    } catch (error) {
      toast({
        title: 'Erro no Reset',
        description: 'Ocorreu um problema ao tentar resetar os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6 container mx-auto p-4 md:p-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as conexões e preferências do sistema.
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Conexão API</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="danger">Zona de Perigo</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" /> Configuração do Servidor
              </CardTitle>
              <CardDescription>
                Configure a conexão com o ERP Protheus ou API externa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={config.isActive}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, isActive: checked })
                  }
                />
                <Label htmlFor="active">Ativar Sincronização</Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="baseUrl">URL Base da API</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.exemplo.com/v1"
                  value={config.baseUrl}
                  onChange={(e) =>
                    setConfig({ ...config, baseUrl: e.target.value })
                  }
                  disabled={!config.isActive}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) =>
                      setConfig({ ...config, username: e.target.value })
                    }
                    disabled={!config.isActive}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) =>
                      setConfig({ ...config, password: e.target.value })
                    }
                    disabled={!config.isActive}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="syncInv"
                    checked={config.syncInventory}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, syncInventory: checked })
                    }
                    disabled={!config.isActive}
                  />
                  <Label htmlFor="syncInv">Sincronizar Estoque</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="syncProd"
                    checked={config.syncProduction}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, syncProduction: checked })
                    }
                    disabled={!config.isActive}
                  />
                  <Label htmlFor="syncProd">Sincronizar Produção</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Status:{' '}
                <span
                  className={
                    connectionStatus === 'online'
                      ? 'text-green-500 font-bold'
                      : connectionStatus === 'error'
                        ? 'text-red-500 font-bold'
                        : connectionStatus === 'syncing'
                          ? 'text-blue-500 font-bold'
                          : 'text-gray-500'
                  }
                >
                  {connectionStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveConnection}
                  disabled={testing}
                >
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
                {config.isActive && (
                  <Button
                    onClick={() => handleSaveConnection()}
                    disabled={testing}
                  >
                    {testing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Testar Conexão
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>
                Ajuste os parâmetros de exibição e cálculo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="goal">Meta de Produção Diária (kg)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={localSettings.productionGoal}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      productionGoal: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refresh">Taxa de Atualização (segundos)</Label>
                <Input
                  id="refresh"
                  type="number"
                  min={1}
                  value={localSettings.refreshRate}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      refreshRate: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Intervalo para buscar novos dados do servidor.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveSystem}>
                <Save className="mr-2 h-4 w-4" /> Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Configurações de Alertas de
                Desempenho
              </CardTitle>
              <CardDescription>
                Defina como e quando você deseja ser notificado sobre
                indicadores de produção.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-alerts" className="text-base">
                      Alertas por E-mail
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações diárias sobre o desempenho da produção
                      no seu e-mail cadastrado.
                    </p>
                  </div>
                  <Switch
                    id="email-alerts"
                    checked={localNotifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      setLocalNotifications({
                        ...localNotifications,
                        emailEnabled: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-alerts" className="text-base">
                      Alertas por SMS
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas urgentes diretamente no seu telefone
                      celular.
                    </p>
                  </div>
                  <Switch
                    id="sms-alerts"
                    checked={localNotifications.smsEnabled}
                    onCheckedChange={(checked) =>
                      setLocalNotifications({
                        ...localNotifications,
                        smsEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2 pt-2">
                <Label htmlFor="yield-threshold">Meta de Rendimento (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="yield-threshold"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="max-w-[200px]"
                    value={localNotifications.yieldThreshold}
                    onChange={(e) =>
                      setLocalNotifications({
                        ...localNotifications,
                        yieldThreshold: Number(e.target.value),
                      })
                    }
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você será notificado se o rendimento diário cair abaixo deste
                  valor.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveNotifications}>
                <Save className="mr-2 h-4 w-4" /> Salvar Configurações de Alerta
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações destrutivas que afetam os dados do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {protheusConfig.isActive
                  ? 'ATENÇÃO: Como a sincronização está ativa, essa ação apagará TODOS os dados no servidor e propagará a exclusão para todos os dispositivos conectados. Esta ação é irreversível.'
                  : 'Limpar os dados removerá todas as informações armazenadas localmente neste dispositivo. Seus dados no servidor não serão afetados se estiverem desconectados.'}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isClearing}>
                    {isClearing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {protheusConfig.isActive
                      ? 'Limpar Dados Globais (Servidor + Local)'
                      : 'Resetar Aplicação Local'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Você tem certeza absoluta?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {protheusConfig.isActive
                        ? 'Esta ação apagará permanentemente todos os registros do servidor e resetará as configurações deste dispositivo. Todos os outros dispositivos sincronizados ficarão com os dados zerados.'
                        : 'Essa ação apagará os dados deste dispositivo e restaurará as configurações de fábrica locais.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isClearing}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        handleClearData()
                      }}
                      disabled={isClearing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isClearing ? 'Limpando...' : 'Confirmar Exclusão'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
