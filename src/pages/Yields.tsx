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

export default function Yields() {
  const { production, dateRange } = useData()

  const calculateYield = (output: number, input: number) => {
    if (input === 0) return 0
    return (output / input) * 100
  }

  const getYieldColor = (percentage: number) => {
    if (percentage > 45)
      return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' // High yield total
    if (percentage > 35)
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
    return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200'
  }

  // Note: Thresholds above are arbitrary for "Total Yield".
  // Real world: Sebo ~10-15%, FCO ~25-30%, Water ~50-60% (Losses)
  // Let's adjust color logic for "Total Yield" (Solid Mass Recovery)
  // Typically 40-50% solid recovery is good.

  const filteredProduction = production
    .filter((item) => {
      // Apply global date filter if exists, else show all
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return true
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Análise de Rendimentos
        </h2>
        <p className="text-muted-foreground">
          Eficiência de processamento calculada automaticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Rendimentos (%)</CardTitle>
          <CardDescription>
            Percentual de recuperação de massa sobre MP processada.
          </CardDescription>
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

                  return (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <TableCell className="font-medium">
                        {format(entry.date, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{entry.shift}</TableCell>
                      <TableCell className="text-right">
                        {yieldSebo.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {yieldFCO.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {yieldFarinheta.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={getYieldColor(yieldTotal)}
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
