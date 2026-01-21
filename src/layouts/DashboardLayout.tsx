import { Outlet } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { Bell, User, Terminal } from 'lucide-react'
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

export default function DashboardLayout() {
  const location = useLocation()
  const {
    isDeveloperMode,
    factories,
    currentFactoryId,
    connectionStatus,
    lastProtheusSync,
  } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)

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
            'flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-10 shadow-sm/50 transition-colors',
            isDeveloperMode && 'border-b-amber-400/50 bg-amber-50/10',
          )}
        >
          <SidebarTrigger className="-ml-1 hover:bg-secondary text-primary hidden md:flex" />
          <div className="h-4 w-px bg-border mx-2 hidden md:block" />
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDeveloperMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Terminal className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modo Desenvolvedor Ativo</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-primary tracking-tight leading-tight">
                  {getTitle()}
                </h1>
                {currentFactory && location.pathname !== '/fabricas' && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {currentFactory.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <ConnectionStatus
                status={connectionStatus}
                lastSync={lastProtheusSync}
              />

              <span className="text-sm text-muted-foreground hidden md:inline-block font-medium border-l pl-4 ml-2">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary text-muted-foreground hover:text-primary hidden md:inline-flex"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
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
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-secondary/30 pb-20 md:pb-6">
          <Outlet />
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
