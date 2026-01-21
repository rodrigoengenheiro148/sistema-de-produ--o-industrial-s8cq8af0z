import { useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  User,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react'
import { FactoryForm } from '@/components/FactoryForm'
import { Factory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Factories() {
  const { factories, deleteFactory, currentFactoryId, setCurrentFactoryId } =
    useData()
  const { toast } = useToast()

  // State for the Factory Form (Create/Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFactory, setEditingFactory] = useState<Factory | undefined>(
    undefined,
  )

  // State for Password Verification
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingFactory, setPendingFactory] = useState<Factory | undefined>(
    undefined,
  )

  const handleCreate = () => {
    setEditingFactory(undefined)
    setIsDialogOpen(true)
  }

  const handleEditClick = (factory: Factory) => {
    setPendingFactory(factory)
    setPasswordInput('')
    setIsPasswordDialogOpen(true)
  }

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (passwordInput === '16071997') {
      setIsPasswordDialogOpen(false)
      setEditingFactory(pendingFactory)
      setIsDialogOpen(true)
      toast({
        title: 'Acesso Autorizado',
        description: 'Autenticação de administrador confirmada.',
        variant: 'default',
        className: 'bg-green-50 border-green-200 text-green-800',
      })
    } else {
      toast({
        title: 'Acesso Negado',
        description: 'A senha informada está incorreta.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = (id: string) => {
    if (factories.length <= 1) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Não é possível excluir a única fábrica do sistema.',
        variant: 'destructive',
      })
      return
    }
    if (id === currentFactoryId) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Você não pode excluir a fábrica que está visualizando.',
        variant: 'destructive',
      })
      return
    }
    deleteFactory(id)
    toast({
      title: 'Fábrica Removida',
      description: 'A unidade foi excluída com sucesso.',
    })
  }

  const handleSwitch = (id: string) => {
    setCurrentFactoryId(id)
    toast({
      title: 'Contexto Alterado',
      description: 'Visualizando dados da fábrica selecionada.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Minhas Fábricas
          </h2>
          <p className="text-muted-foreground">
            Gerencie as unidades fabris integradas ao sistema.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Fábrica
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingFactory ? 'Editar Fábrica' : 'Adicionar Nova Fábrica'}
              </DialogTitle>
              <DialogDescription>
                {editingFactory
                  ? 'Atualize os dados da unidade selecionada.'
                  : 'Preencha as informações para registrar uma nova planta fabril.'}
              </DialogDescription>
            </DialogHeader>
            <FactoryForm
              initialData={editingFactory}
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Verification Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Autenticação Necessária</DialogTitle>
            <DialogDescription>
              Esta ação é restrita a administradores. Digite a senha para
              continuar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha de Administrador</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Verificar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {factories.map((factory) => (
          <Card
            key={factory.id}
            className={cn(
              'transition-all hover:shadow-md cursor-pointer border-l-4',
              currentFactoryId === factory.id
                ? 'border-l-primary ring-1 ring-primary/20 bg-secondary/5'
                : 'border-l-transparent hover:border-l-muted-foreground/30',
            )}
            onClick={() => handleSwitch(factory.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  {factory.name}
                </CardTitle>
                {factory.status === 'active' ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Ativa
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inativa
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {factory.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <User className="h-4 w-4" />
                Gerente: <span className="font-medium">{factory.manager}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  {currentFactoryId === factory.id ? (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Selecionada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" /> Clique para ver
                    </span>
                  )}
                </div>
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEditClick(factory)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Fábrica</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover a unidade{' '}
                          <strong>{factory.name}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(factory.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
