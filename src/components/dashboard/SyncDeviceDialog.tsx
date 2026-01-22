import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Copy, Laptop, Smartphone, Wifi } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SyncDeviceDialogProps {
  className?: string
}

export function SyncDeviceDialog({ className }: SyncDeviceDialogProps) {
  const { protheusConfig } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate the shareable link with the current configuration
  const generateShareLink = () => {
    if (typeof window === 'undefined') return ''

    // Create a config object to share
    // We only share the connection details, not local user state
    const shareableConfig = {
      baseUrl: protheusConfig.baseUrl,
      username: protheusConfig.username,
      password: protheusConfig.password,
      isActive: protheusConfig.isActive,
      syncInventory: protheusConfig.syncInventory,
      syncProduction: protheusConfig.syncProduction,
    }

    // Simple Base64 encoding for the URL
    // In a production environment, this should be encrypted
    const encodedConfig = btoa(JSON.stringify(shareableConfig))
    const url = new URL(window.location.origin)
    url.searchParams.set('config', encodedConfig)

    return url.toString()
  }

  const shareUrl = generateShareLink()

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({
      title: 'Link copiado!',
      description:
        'Envie este link para o seu dispositivo móvel para sincronizar.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('gap-2', className)}>
          <Wifi className="h-4 w-4" />
          <span className="hidden sm:inline">Sincronizar Dispositivos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            <span className="text-muted-foreground mx-1">↔</span>
            <Smartphone className="h-5 w-5" />
            Sincronização
          </DialogTitle>
          <DialogDescription>
            Use este link para conectar outro dispositivo ao mesmo servidor de
            dados. As configurações de conexão serão importadas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Atenção:</strong> O link abaixo contém as credenciais de
            acesso ao servidor. Compartilhe apenas com você mesmo ou pessoas
            autorizadas.
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="link">Link de Sincronização</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="submit"
                size="sm"
                className="px-3"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copiar</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {/* Using a placeholder for QR Code since we can't use external QR libraries easily */}
            <div className="flex flex-col items-center gap-2 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code de Sincronização"
                className="w-[150px] h-[150px]"
              />
              <span className="text-xs text-muted-foreground mt-2">
                Escaneie com a câmera do celular
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
