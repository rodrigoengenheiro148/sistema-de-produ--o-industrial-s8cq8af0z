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
import { ShieldCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePcp } from '@/context/PcpContext'

interface PcpGateProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function PcpGate({
  isOpen,
  onOpenChange,
  onSuccess,
  title = 'Autorização PCP',
  description = 'Esta ação requer autorização de Planejamento e Controle de Produção. Informe a senha PCP.',
}: PcpGateProps) {
  const { authorizePcp } = usePcp()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    setLoading(true)

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (authorizePcp(password)) {
      setPassword('')
      setLoading(false)
      onOpenChange(false)
      onSuccess()
    } else {
      setError(true)
      setLoading(false)
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
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Senha PCP"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(false)
              }}
              className={cn(
                error && 'border-destructive focus-visible:ring-destructive',
                'text-center tracking-widest font-bold',
              )}
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="text-sm font-medium text-destructive text-center">
                Senha incorreta. Acesso negado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !password}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
