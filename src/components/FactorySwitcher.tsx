import { useData } from '@/context/DataContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, Check, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function FactorySwitcher() {
  const { factories, currentFactoryId, setCurrentFactoryId } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between gap-2 border-dashed border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent/80"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">
              {currentFactory ? currentFactory.name : 'Selecione a Fábrica'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Unidades Fabris
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {factories.map((factory) => (
            <DropdownMenuItem
              key={factory.id}
              onClick={() => setCurrentFactoryId(factory.id)}
              className="gap-2 cursor-pointer"
            >
              <div className="flex flex-col flex-1 truncate">
                <span className="truncate font-medium">{factory.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {factory.location}
                </span>
              </div>
              {factory.id === currentFactoryId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
          <Link to="/fabricas">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium text-muted-foreground">
              Adicionar Fábrica
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
