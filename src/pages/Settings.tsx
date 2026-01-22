import { useState } from 'react'
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
import { Save, RefreshCw, Trash2, ShieldCheck, Server } from 'lucide-react'

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
  } = useData()

  const { toast } = useToast()

  const [config, setConfig] = useState(protheusConfig)
  const [testing, setTesting] = useState(false)
  const [localSettings, setLocalSettings] = useState(systemSettings)

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

  const handleClearData = () => {
    if (
      confirm(
        'Tem certeza? Isso apagará todos os dados locais e reiniciará o aplicativo.',
      )
    ) {
      clearAllData()
      window.location.reload()
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

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis que afetam seus dados locais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Limpar os dados removerá todas as informações armazenadas neste
                dispositivo e restaurará os dados de demonstração padrão. Se
                você estiver sincronizado, os dados do servidor serão baixados
                novamente.
              </p>
              <Button variant="destructive" onClick={handleClearData}>
                <Trash2 className="mr-2 h-4 w-4" /> Resetar Aplicação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
