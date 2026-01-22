import { useEffect, useRef, useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  Info,
  Settings,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Yields() {
  const { production, dateRange, yieldTargets, updateYieldTargets } = useData()
  const { toast } = useToast()
  // Ref to track the last alerted state to prevent duplicate toasts
  const lastAlertedRef = useRef<string | null>(null)

  // Dialog & Auth State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [editTargets, setEditTargets] = useState(yieldTargets)

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Reset state on close
      setIsAuthenticated(false)
      setPassword('')
      setAuthError(false)
    } else {
      // Init temp state on open
      setEditTargets(yieldTargets)
    }
  }

  const handlePasswordSubmit = () => {
    if (password === '16071997') {
      setIsAuthenticated(true)
      setAuthError(false)
    } else {
      setAuthError(true)
    }
  }

  const handleSaveTargets = () => {
    updateYieldTargets(editTargets)
    setIsDialogOpen(false)
    toast({
      title: 'Metas Atualizadas',
      description:
        'Os novos valores de referência foram aplicados e os alertas recalculados.',
      duration: 4000,
    })
  }

  const calculateYield = (output: number, input: number) => {
    if (input === 0) return 0
    return (output / input) * 100
  }

  const filteredProduction = production
    .filter((item) => {
      // Apply global date filter if exists, else show all
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return true
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  // Real-time Alert Monitoring
  useEffect(() => {
    if (filteredProduction.length === 0) return

    // Monitor the most recent entry (Real-time trigger)
    const latest = filteredProduction[0]

    // Destructure current targets
    const {
      sebo: TARGET_SEBO,
      fco: TARGET_FCO,
      farinheta: TARGET_FARINHETA,
      total: TARGET_TOTAL,
    } = yieldTargets

    const yieldSebo = calculateYield(latest.seboProduced, latest.mpUsed)
    const yieldFCO = calculateYield(latest.fcoProduced, latest.mpUsed)
    const yieldFarinheta = calculateYield(
      latest.farinhetaProduced,
      latest.mpUsed,
    )
    const yieldTotal = calculateYield(
      latest.seboProduced + latest.fcoProduced + latest.farinhetaProduced,
      latest.mpUsed,
    )

    const issues: string[] = []

    if (yieldFarinheta < TARGET_FARINHETA) {
      issues.push(
        `Farinheta: ${yieldFarinheta.toFixed(2)}% (Meta: ${TARGET_FARINHETA}%)`,
      )
    }
    if (yieldFCO < TARGET_FCO) {
      issues.push(
        `Farinha (FCO): ${yieldFCO.toFixed(2)}% (Meta: ${TARGET_FCO}%)`,
      )
    }
    if (yieldSebo < TARGET_SEBO) {
      issues.push(`Sebo: ${yieldSebo.toFixed(2)}% (Meta: ${TARGET_SEBO}%)`)
    }
    if (yieldTotal < TARGET_TOTAL) {
      issues.push(
        `Total Fábrica: ${yieldTotal.toFixed(2)}% (Meta: ${TARGET_TOTAL}%)`,
      )
    }

    // Generate unique key for this alert state, including targets to re-trigger if targets change
    const alertKey = `${latest.id}-${issues.join('|')}`

    if (issues.length > 0) {
      // Only alert if this specific set of issues for this ID hasn't been alerted yet
      if (lastAlertedRef.current !== alertKey) {
        toast({
          variant: 'destructive',
          title: 'Alerta de Desvio de Meta',
          description: (
            <div className="mt-2 flex flex-col gap-2">
              <p className="font-medium text-xs">
                A produção de {format(latest.date, 'dd/MM')} apresenta desvios:
              </p>
              <ul className="list-disc pl-4 text-xs space-y-1">
                {issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          ),
          duration: 8000,
        })
        lastAlertedRef.current = alertKey
      }
    } else {
      // Reset if resolved, so we can alert again if it regresses
      lastAlertedRef.current = `${latest.id}-OK`
    }
  }, [filteredProduction, toast, yieldTargets])

  const getStatusIcon = (value: number, target: number) => {
    if (value >= target)
      return <CheckCircle2 className="h-3 w-3 text-green-500" />
    return <AlertTriangle className="h-3 w-3 text-red-500" />
  }

  const getTextColor = (value: number, target: number) => {
    if (value >= target) return 'text-green-600 dark:text-green-500'
    return 'text-red-600 dark:text-red-400 font-bold'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Análise de Rendimentos
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de eficiência e cumprimento de metas operacionais.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurar Metas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configuração de Metas</DialogTitle>
              <DialogDescription>
                Ajuste os percentuais mínimos de rendimento esperados.
              </DialogDescription>
            </DialogHeader>

            {!isAuthenticated ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha de Administrador</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha para desbloquear"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handlePasswordSubmit()
                    }
                  />
                  {authError && (
                    <p className="text-sm text-destructive font-medium">
                      Senha incorreta.
                    </p>
                  )}
                </div>
                <Button className="w-full gap-2" onClick={handlePasswordSubmit}>
                  <Unlock className="h-4 w-4" /> Desbloquear
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Sebo (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editTargets.sebo}
                      onChange={(e) =>
                        setEditTargets({
                          ...editTargets,
                          sebo: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta FCO (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editTargets.fco}
                      onChange={(e) =>
                        setEditTargets({
                          ...editTargets,
                          fco: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Farinheta (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editTargets.farinheta}
                      onChange={(e) =>
                        setEditTargets({
                          ...editTargets,
                          farinheta: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Fábrica (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editTargets.total}
                      onChange={(e) =>
                        setEditTargets({
                          ...editTargets,
                          total: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTargets}>Salvar Alterações</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-secondary/20 border-primary/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Meta Sebo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">
              {yieldTargets.sebo}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-primary/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Meta FCO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">
              {yieldTargets.fco}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-primary/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Meta Farinheta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">
              {yieldTargets.farinheta}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Meta Fábrica
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">
              {yieldTargets.total}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tabela de Rendimentos (%)</CardTitle>
              <CardDescription>
                Percentual de recuperação de massa sobre MP processada.
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Valores em{' '}
                    <span className="text-green-500 font-bold">verde</span>{' '}
                    atingiram a meta. <br />
                    Valores em{' '}
                    <span className="text-red-500 font-bold">
                      vermelho
                    </span>{' '}
                    estão abaixo do esperado e geram alertas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="text-right">Sebo %</TableHead>
                <TableHead className="text-right">FCO %</TableHead>
                <TableHead className="text-right">Farinheta %</TableHead>
                <TableHead className="text-right">Rendimento Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProduction.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProduction.map((entry) => {
                  const yieldSebo = calculateYield(
                    entry.seboProduced,
                    entry.mpUsed,
                  )
                  const yieldFCO = calculateYield(
                    entry.fcoProduced,
                    entry.mpUsed,
                  )
                  const yieldFarinheta = calculateYield(
                    entry.farinhetaProduced,
                    entry.mpUsed,
                  )
                  const yieldTotal = calculateYield(
                    entry.seboProduced +
                      entry.fcoProduced +
                      entry.farinhetaProduced,
                    entry.mpUsed,
                  )

                  const isTotalLow = yieldTotal < yieldTargets.total

                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {format(entry.date, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{entry.shift}</TableCell>

                      {/* Sebo Cell */}
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1.5',
                            getTextColor(yieldSebo, yieldTargets.sebo),
                          )}
                        >
                          {yieldSebo.toFixed(2)}%
                          {getStatusIcon(yieldSebo, yieldTargets.sebo)}
                        </div>
                      </TableCell>

                      {/* FCO Cell */}
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1.5',
                            getTextColor(yieldFCO, yieldTargets.fco),
                          )}
                        >
                          {yieldFCO.toFixed(2)}%
                          {getStatusIcon(yieldFCO, yieldTargets.fco)}
                        </div>
                      </TableCell>

                      {/* Farinheta Cell */}
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1.5',
                            getTextColor(
                              yieldFarinheta,
                              yieldTargets.farinheta,
                            ),
                          )}
                        >
                          {yieldFarinheta.toFixed(2)}%
                          {getStatusIcon(
                            yieldFarinheta,
                            yieldTargets.farinheta,
                          )}
                        </div>
                      </TableCell>

                      {/* Total Cell */}
                      <TableCell className="text-right">
                        <Badge
                          variant={isTotalLow ? 'destructive' : 'default'}
                          className={cn(
                            'ml-auto w-fit',
                            !isTotalLow && 'bg-green-600 hover:bg-green-700',
                          )}
                        >
                          {yieldTotal.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
