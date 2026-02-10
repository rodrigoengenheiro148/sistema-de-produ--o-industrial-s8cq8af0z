import { useData } from '@/context/DataContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, Users, ChevronDown, Check, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export function UserSwitcher() {
  const { userAccessList, currentUser, login } = useData()
  const { signOut } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-2 bg-sidebar-accent/50 border-sidebar-border"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex flex-col items-start text-xs truncate">
              <span className="font-medium truncate max-w-[100px]">
                {currentUser?.name || 'Usuário'}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {currentUser?.role || 'Logado'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Trocar Usuário
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userAccessList.length > 0 ? (
          userAccessList.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => login(user.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.role}
                </span>
              </div>
              {currentUser?.id === user.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-2 text-xs text-muted-foreground text-center">
            Nenhum perfil disponível
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair do Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
