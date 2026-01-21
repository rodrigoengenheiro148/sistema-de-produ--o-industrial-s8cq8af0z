import { Badge } from '@/components/ui/badge'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CloudUpload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectionStatus as StatusType } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/context/DataContext'

interface ConnectionStatusProps {
  status: StatusType
  className?: string
  lastSync?: Date | null
}

export function ConnectionStatus({
  status,
  className,
  lastSync,
}: ConnectionStatusProps) {
  const { pendingOperationsCount } = useData()

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle2,
          label: 'Sincronizado',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          desc: 'Conexão estável com o servidor.',
        }
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Sincronizando...',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          animate: true,
          desc: 'Atualizando dados em tempo real.',
        }
      case 'pending':
        return {
          icon: CloudUpload,
          label:
            pendingOperationsCount > 0
              ? `Pendente (${pendingOperationsCount})`
              : 'Pendente',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          desc: `${pendingOperationsCount} operações aguardando envio.`,
        }
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Erro de Sync',
          color: 'bg-red-100 text-red-700 border-red-200',
          desc: 'Falha ao comunicar com o servidor. Verifique a configuração.',
        }
      case 'offline':
      default:
        return {
          icon: WifiOff,
          label: 'Offline',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          desc: 'Sem conexão com a internet.',
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 py-1 px-3 transition-all duration-300 shadow-sm cursor-help',
                config.color,
              )}
            >
              <Icon
                className={cn('h-3.5 w-3.5', config.animate && 'animate-spin')}
              />
              <span className="font-medium hidden sm:inline-block">
                {config.label}
              </span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="text-xs max-w-[200px]"
        >
          <p className="font-semibold mb-1">{config.desc}</p>
          {status === 'pending' && pendingOperationsCount > 0 && (
            <p className="text-xs text-muted-foreground mb-1">
              Os dados serão enviados assim que a conexão for restabelecida.
            </p>
          )}
          {lastSync && (
            <p className="text-muted-foreground border-t pt-1 mt-1">
              Último sync: {format(lastSync, 'HH:mm:ss', { locale: ptBR })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
