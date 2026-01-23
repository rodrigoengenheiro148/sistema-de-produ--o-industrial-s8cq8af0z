import { Outlet } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { Bell, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/context/DataContext'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { RenderAssistant } from '@/components/RenderAssistant'

export default function DashboardLayout() {
  const location = useLocation()
  const { factories, currentFactoryId, connectionStatus, lastProtheusSync } =
    useData()
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
      <SidebarInset className="bg-background flex flex-col min-h-screen relative">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
          <SidebarTrigger className="-ml-2 hover:bg-secondary text-primary hidden md:flex" />
          <div className="h-4 w-px bg-border mx-2 hidden md:block" />
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col min-w-0">
                <h1 className="text-base md:text-lg font-bold text-primary tracking-tight leading-tight truncate">
                  {getTitle()}
                </h1>
                {/* Factory name moved to Sidebar for better context switching, keeping breadcrumb style here if needed */}
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
        {/* Adjusted padding bottom to account for MobileNav */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-secondary/30 pb-24 md:pb-6">
          <Outlet />
        </main>
        <MobileNav />
        {/* Render Assistant - Global Availability */}
        <RenderAssistant />
      </SidebarInset>
    </SidebarProvider>
  )
}
