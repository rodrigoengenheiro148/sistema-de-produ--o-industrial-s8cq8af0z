import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Factory,
  Building2,
  Menu,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()

  const items = [
    {
      title: 'Home',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Fábricas',
      url: '/fabricas',
      icon: Building2,
    },
    {
      title: 'Produção',
      url: '/producao',
      icon: Factory,
    },
    {
      title: 'Estoque',
      url: '/estoque',
      icon: Package,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.url
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors active:scale-95 duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary/70',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-all',
                  isActive && 'fill-current/20 scale-110',
                )}
              />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center w-full h-full gap-1 h-auto py-0 rounded-none hover:bg-transparent text-muted-foreground hover:text-primary/70 active:scale-95 duration-200"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </Button>
      </div>
    </div>
  )
}
