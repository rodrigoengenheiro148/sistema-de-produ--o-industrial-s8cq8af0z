import {
  LayoutDashboard,
  Truck,
  Factory,
  PieChart,
  Package,
  Send,
  Settings,
  FlaskConical,
  Building2,
  ClipboardCheck,
  LineChart,
  Database,
  Timer,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import logoBrRender from '@/assets/logotipo-br-render.png'
import { UserSwitcher } from '@/components/UserSwitcher'
import { FactorySwitcher } from '@/components/FactorySwitcher'

const operationalItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Entrada MP',
    url: '/entrada-mp',
    icon: Truck,
  },
  {
    title: 'Produção',
    url: '/producao',
    icon: Factory,
  },
  {
    title: 'Rendimentos',
    url: '/rendimentos',
    icon: PieChart,
  },
  {
    title: 'Acidez Diária',
    url: '/acidez-diaria',
    icon: FlaskConical,
  },
  {
    title: 'Qualidade',
    url: '/qualidade',
    icon: ClipboardCheck,
  },
  {
    title: 'Relatórios',
    url: '/relatorios-avancados',
    icon: LineChart,
  },
  {
    title: 'Estoque',
    url: '/estoque',
    icon: Package,
  },
  {
    title: 'Expedição',
    url: '/expedicao',
    icon: Send,
  },
  {
    title: 'Fábricas',
    url: '/fabricas',
    icon: Building2,
  },
]

const managementItems = [
  {
    title: 'Estoque de Sebo',
    url: '/gestao/estoque-sebo',
    icon: Database,
  },
  {
    title: 'Tempos de Processo',
    url: '/gestao/processo',
    icon: Timer,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border bg-white dark:bg-sidebar-background space-y-4">
        <div className="flex flex-col items-center gap-2 justify-center py-2">
          <img
            src={logoBrRender}
            alt="Grupo BR Render"
            className="h-14 w-auto object-contain"
          />
        </div>
        <FactorySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operacional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          location.pathname === item.url
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground',
                        )}
                      />
                      <span
                        className={cn(
                          location.pathname === item.url &&
                            'font-semibold text-sidebar-primary',
                        )}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          location.pathname === item.url
                            ? 'text-sidebar-primary'
                            : 'text-muted-foreground',
                        )}
                      />
                      <span
                        className={cn(
                          location.pathname === item.url &&
                            'font-semibold text-sidebar-primary',
                        )}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border gap-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/settings'}
            >
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <UserSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}
