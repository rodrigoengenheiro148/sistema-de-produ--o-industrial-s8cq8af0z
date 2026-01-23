import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { BYPASS_PASSWORD } from '@/lib/security'
import { cn } from '@/lib/utils'

interface SecurityGateProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function SecurityGate({
  isOpen,
  onOpenChange,
  onSuccess,
  title = 'Proteção de Registro Histórico',
  description = 'Este registro tem mais de 24 horas. Para editar ou excluir, informe a senha de liberação.',
}: SecurityGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === BYPASS_PASSWORD) {
      setError(false)
      setPassword('')
      onSuccess()
    } else {
      setError(true)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('')
      setError(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Lock className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Senha de liberação"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(false)
              }}
              className={cn(
                error && 'border-destructive focus-visible:ring-destructive',
              )}
              autoFocus
            />
            {error && (
              <p className="text-sm font-medium text-destructive">
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
