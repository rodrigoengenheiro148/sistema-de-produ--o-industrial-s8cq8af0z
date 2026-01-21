import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectionStatus as StatusType } from '@/lib/types'

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
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          label: 'Online',
          color: 'bg-green-100 text-green-700 border-green-200',
          dot: 'bg-green-500',
        }
      case 'syncing':
        return {
          icon: RefreshCw,
          label: 'Syncing',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          animate: true,
        }
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Error',
          color: 'bg-red-100 text-red-700 border-red-200',
          dot: 'bg-red-500',
        }
      case 'offline':
      default:
        return {
          icon: WifiOff,
          label: 'Offline',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5 py-0.5 px-2 transition-all duration-300',
          config.color,
        )}
      >
        <Icon className={cn('h-3 w-3', config.animate && 'animate-spin')} />
        <span className="hidden sm:inline-block">{config.label}</span>
      </Badge>
    </div>
  )
}
