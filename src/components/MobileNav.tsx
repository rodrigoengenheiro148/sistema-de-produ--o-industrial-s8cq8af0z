import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Factory,
  PieChart,
  Truck,
  Send,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()

  const items = [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Entrada',
      url: '/entrada-mp',
      icon: Truck,
    },
    {
      title: 'Produção',
      url: '/producao',
      icon: Factory,
    },
    {
      title: 'Saída',
      url: '/expedicao',
      icon: Send,
    },
    {
      title: 'Rendimentos',
      url: '/rendimentos',
      icon: PieChart,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-between px-2 h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.url
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary/70',
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-full transition-colors',
                  isActive && 'bg-primary/10',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    isActive && 'scale-110',
                  )}
                />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.title}
              </span>
            </Link>
          )
        })}
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-primary hover:bg-transparent rounded-none"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </Button>
      </div>
    </div>
  )
}
