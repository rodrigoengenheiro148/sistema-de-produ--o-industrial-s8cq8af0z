import { useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Database,
  Save,
  ShieldAlert,
  Lock,
  Unlock,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AccessControl } from '@/components/AccessControl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Settings() {
  const {
    isDeveloperMode,
    toggleDeveloperMode,
    systemSettings,
    updateSystemSettings,
    clearAllData,
  } = useData()
  const { toast } = useToast()

  const [settingsForm, setSettingsForm] = useState(systemSettings)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  const handleSaveSettings = () => {
    updateSystemSettings(settingsForm)
    toast({
      title: 'Configurações Salvas',
      description: 'As constantes do sistema foram atualizadas com sucesso.',
    })
  }

  const handleClearData = () => {
    clearAllData()
    toast({
      title: 'Sistema Resetado',
      description: 'Todos os registros foram apagados permanentemente.',
      variant: 'destructive',
    })
  }

  const handleModeToggle = (checked: boolean) => {
    if (checked) {
      // Trying to enable
      setIsPasswordDialogOpen(true)
    } else {
      // Trying to disable - allowed without password
      toggleDeveloperMode()
    }
  }

  const confirmPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (passwordInput === '16071997') {
      toggleDeveloperMode()
      setIsPasswordDialogOpen(false)
      setPasswordInput('')
      toast({
        title: 'Modo Desenvolvedor Ativado',
        description:
          'Você tem acesso completo às configurações e controle de acesso.',
      })
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'Senha incorreta.',
        variant: 'destructive',
      })
      setPasswordInput('')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as preferências e parâmetros do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isDeveloperMode ? (
                  <Unlock className="h-5 w-5 text-amber-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                Modo Desenvolvedor
              </CardTitle>
              <CardDescription>
                Habilita funções avançadas de edição, remoção e configuração de
                parâmetros.
              </CardDescription>
            </div>
            <Switch
              checked={isDeveloperMode}
              onCheckedChange={handleModeToggle}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Autenticação Requerida</DialogTitle>
            <DialogDescription>
              Digite a senha de administrador para habilitar o modo
              desenvolvedor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmPassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Senha de Administrador</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Confirmar Acesso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isDeveloperMode && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AccessControl />

          <Card className="border-primary/20 bg-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Parâmetros do Sistema
              </CardTitle>
              <CardDescription>
                Constantes utilizadas para cálculos de KPI e alertas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="goal">Meta de Produção Diária (kg)</Label>
                  <Input
                    id="goal"
                    type="number"
                    value={settingsForm.productionGoal}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        productionGoal: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loss">Limite Máximo de Perdas (kg)</Label>
                  <Input
                    id="loss"
                    type="number"
                    value={settingsForm.maxLossThreshold}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        maxLossThreshold: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh">Taxa de Atualização (seg)</Label>
                  <Input
                    id="refresh"
                    type="number"
                    value={settingsForm.refreshRate}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        refreshRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={handleSaveSettings} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Parâmetros
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis para manutenção do banco de dados local.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  A limpeza de dados removerá permanentemente todos os registros
                  de produção, estoque e qualidade.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Resetar Todo o Sistema
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá
                        permanentemente todos os dados armazenados localmente e
                        resetará o sistema para o estado inicial.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
