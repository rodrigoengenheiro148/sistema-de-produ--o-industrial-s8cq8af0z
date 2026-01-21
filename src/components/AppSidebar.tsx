import {
  LayoutDashboard,
  Truck,
  Factory,
  PieChart,
  Package,
  Send,
  Settings,
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

const items = [
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
    title: 'Estoque',
    url: '/estoque',
    icon: Package,
  },
  {
    title: 'Expedição',
    url: '/expedicao',
    icon: Send,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <h2 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <Factory className="h-6 w-6 text-primary" />
          <span>IndústriaSys</span>
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          location.pathname === item.url
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
