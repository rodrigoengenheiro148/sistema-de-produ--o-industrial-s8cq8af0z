import { Outlet } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { Bell, User, Terminal, Eye, Lock, Unlock } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export default function DashboardLayout() {
  const location = useLocation()
  const {
    isDeveloperMode,
    isViewerMode,
    setViewerMode,
    factories,
    currentFactoryId,
    connectionStatus,
    lastProtheusSync,
  } = useData()
  const { toast } = useToast()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === '16071997') {
      setViewerMode(false)
      setIsUnlockDialogOpen(false)
      setPasswordInput('')
      toast({
        title: 'Modo Operacional Restaurado',
        description: 'As funções de edição foram reabilitadas.',
      })
    } else {
      toast({
        title: 'Senha Incorreta',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Operacional'
      case '/entrada-mp':
        return 'Entrada de Matéria-Prima'
      case '/producao':
        return 'Produção Diária'
      case '/rendimentos':
        return 'Análise de Rendimentos'
      case '/acidez-diaria':
        return 'Controle de Acidez'
      case '/qualidade':
        return 'Gestão de Qualidade'
      case '/estoque':
        return 'Gestão de Estoque'
      case '/expedicao':
        return 'Expedição de Produtos'
      case '/fabricas':
        return 'Unidades Fabris'
      case '/settings':
        return 'Configurações do Sistema'
      default:
        return 'Grupo BR Render'
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background flex flex-col min-h-screen">
        <header
          className={cn(
            'flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 transition-colors',
            isDeveloperMode && 'border-b-amber-400/50 bg-amber-50/10',
            isViewerMode && 'border-b-blue-400/50 bg-blue-50/10',
          )}
        >
          <SidebarTrigger className="-ml-2 hover:bg-secondary text-primary hidden md:flex" />
          <div className="h-4 w-px bg-border mx-2 hidden md:block" />
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              {isDeveloperMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Terminal className="h-4 w-4 text-amber-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modo Desenvolvedor Ativo</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isViewerMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Eye className="h-4 w-4 text-blue-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modo Visualizador (Leitura)</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex flex-col min-w-0">
                <h1 className="text-base md:text-lg font-bold text-primary tracking-tight leading-tight truncate">
                  {getTitle()}
                </h1>
                {currentFactory && location.pathname !== '/fabricas' && (
                  <p className="text-xs text-muted-foreground hidden sm:block truncate">
                    {currentFactory.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-2">
              <ConnectionStatus
                status={connectionStatus}
                lastSync={lastProtheusSync}
              />

              {isViewerMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUnlockDialogOpen(true)}
                  className="hidden md:flex gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <Lock className="h-3 w-3" />
                  Sair do Modo Leitura
                </Button>
              )}

              <span className="text-sm text-muted-foreground hidden lg:inline-block font-medium border-l pl-4 ml-2">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary text-muted-foreground hover:text-primary hidden md:inline-flex"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary text-muted-foreground hover:text-primary hidden md:inline-flex"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-secondary/30 pb-24 md:pb-6">
          <Outlet />
        </main>
        <MobileNav />

        <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-primary" />
                Desativar Modo Visualizador
              </DialogTitle>
              <DialogDescription>
                Digite a senha de administrador para habilitar as funções de
                edição.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUnlockSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="unlock-password">Senha</Label>
                  <Input
                    id="unlock-password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Confirmar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
