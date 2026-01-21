import { Outlet } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Button } from '@/components/ui/button'
import { Bell, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardLayout() {
  const location = useLocation()

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
      default:
        return 'Grupo BR Render'
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-10 shadow-sm/50">
          <SidebarTrigger className="-ml-1 hover:bg-secondary text-primary" />
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-bold text-primary tracking-tight">
              {getTitle()}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block font-medium">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary text-muted-foreground hover:text-primary"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-secondary text-muted-foreground hover:text-primary"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-secondary/30">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
