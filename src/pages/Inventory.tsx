import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

export default function Inventory() {
  const {
    rawMaterials,
    production,
    shipping,
    protheusConfig,
    syncProtheusData,
    lastProtheusSync,
  } = useData()
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)

  // MP Balance = Sum(Entries) - Sum(Used in Production)
  const mpIn = rawMaterials.reduce((acc, curr) => acc + curr.quantity, 0)
  const mpOut = production.reduce((acc, curr) => acc + curr.mpUsed, 0)
  const mpStock = mpIn - mpOut

  // Sebo Balance = Sum(Produced) - Sum(Shipped)
  const seboIn = production.reduce((acc, curr) => acc + curr.seboProduced, 0)
  const seboOut = shipping
    .filter((s) => s.product === 'Sebo')
    .reduce((acc, curr) => acc + curr.quantity, 0)
  const seboStock = seboIn - seboOut

  // FCO Balance
  const fcoIn = production.reduce((acc, curr) => acc + curr.fcoProduced, 0)
  const fcoOut = shipping
    .filter((s) => s.product === 'FCO')
    .reduce((acc, curr) => acc + curr.quantity, 0)
  const fcoStock = fcoIn - fcoOut

  // Farinheta Balance
  const farinhetaIn = production.reduce(
    (acc, curr) => acc + curr.farinhetaProduced,
    0,
  )
  const farinhetaOut = shipping
    .filter((s) => s.product === 'Farinheta')
    .reduce((acc, curr) => acc + curr.quantity, 0)
  const farinhetaStock = farinhetaIn - farinhetaOut

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncProtheusData()
      toast({
        title: 'Sincronização Concluída',
        description: 'Dados de estoque atualizados com o Protheus.',
      })
    } catch (error) {
      toast({
        title: 'Erro na Sincronização',
        description: 'Não foi possível comunicar com o ERP.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const InventoryCard = ({
    title,
    stock,
    inVal,
    outVal,
    capacity = 50000,
  }: {
    title: string
    stock: number
    inVal: number
    outVal: number
    capacity?: number
  }) => {
    const percentage = Math.min((stock / capacity) * 100, 100)
    const isLow = percentage < 20
    const isFull = percentage > 90

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {isLow ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stock.toLocaleString('pt-BR')} kg
          </div>
          <Progress value={percentage} className="mt-3 mb-2 h-2" />
          <p className="text-xs text-muted-foreground flex justify-between">
            <span>{percentage.toFixed(1)}% Cap.</span>
            {isFull && (
              <span className="text-red-500 font-medium">Crítico</span>
            )}
            {isLow && <span className="text-amber-500 font-medium">Baixo</span>}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" /> Entradas
              </span>
              <span className="font-semibold text-sm">
                {inVal.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                Saídas <ArrowDownRight className="h-3 w-3 text-red-500" />
              </span>
              <span className="font-semibold text-sm">
                {outVal.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h2>
        {protheusConfig.isActive && protheusConfig.syncInventory && (
          <div className="flex items-center gap-3">
            {lastProtheusSync && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Atualizado:{' '}
                {format(lastProtheusSync, "dd/MM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Sincronizando...' : 'Sync Protheus'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InventoryCard
          title="Matéria-Prima (MP)"
          stock={mpStock}
          inVal={mpIn}
          outVal={mpOut}
          capacity={100000} // Example capacity
        />
        <InventoryCard
          title="Sebo"
          stock={seboStock}
          inVal={seboIn}
          outVal={seboOut}
        />
        <InventoryCard
          title="Farinha Carne/Osso"
          stock={fcoStock}
          inVal={fcoIn}
          outVal={fcoOut}
        />
        <InventoryCard
          title="Farinheta"
          stock={farinhetaStock}
          inVal={farinhetaIn}
          outVal={farinhetaOut}
          capacity={20000}
        />
      </div>

      <Card className="bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> Status Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm">
                Movimentação Total (Entradas)
              </div>
              <div className="text-2xl font-bold mt-1">
                {mpIn.toLocaleString('pt-BR')} kg
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Produção Total</div>
              <div className="text-2xl font-bold mt-1">
                {(seboIn + fcoIn + farinhetaIn).toLocaleString('pt-BR')} kg
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Expedição Total</div>
              <div className="text-2xl font-bold mt-1">
                {(seboOut + fcoOut + farinhetaOut).toLocaleString('pt-BR')} kg
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
