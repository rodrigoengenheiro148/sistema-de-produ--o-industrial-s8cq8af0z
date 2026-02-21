import { useState, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Layers, Plus, Trash2 } from 'lucide-react'
import {
  formatSecondsAsTime,
  parseTimeAsSeconds,
  parseAsLocalNoon,
} from '@/lib/utils'

export default function DigesterControl() {
  const { digesterRecords, addDigesterRecord, deleteDigesterRecord } = useData()
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  )
  const [selectedDigester, setSelectedDigester] = useState<string>('Dig 1')
  const [duration, setDuration] = useState<string>('01:00:00')

  const handleAdd = () => {
    const seconds = parseTimeAsSeconds(duration)
    if (seconds <= 0) return
    addDigesterRecord({
      date: parseAsLocalNoon(selectedDate),
      digesterName: selectedDigester,
      durationSeconds: seconds,
      factoryId: '',
      userId: '',
    })
    setDuration('01:00:00')
  }

  // Filter for selected date
  const filteredRecords = useMemo(() => {
    return digesterRecords.filter((r) =>
      isSameDay(r.date, parseAsLocalNoon(selectedDate)),
    )
  }, [digesterRecords, selectedDate])

  const digesters = ['Dig 1', 'Dig 2', 'Dig 3', 'Dig 4', 'Dig 5']

  const groupedData = useMemo(() => {
    return digesters.map((name) => {
      const records = filteredRecords
        .filter((r) => r.digesterName === name)
        .sort(
          (a, b) =>
            (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0),
        )
      const count = records.length
      const sum = records.reduce((acc, curr) => acc + curr.durationSeconds, 0)
      const avg = count > 0 ? sum / count : 0
      return { name, records, count, sum, avg }
    })
  }, [filteredRecords])

  const totalBatches = groupedData.reduce((acc, curr) => acc + curr.count, 0)
  const totalSeconds = groupedData.reduce((acc, curr) => acc + curr.sum, 0)
  const grandAvg = totalBatches > 0 ? totalSeconds / totalBatches : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Controle de Digestores
        </h2>
        <p className="text-muted-foreground">
          Registre e monitore o tempo de cada batelada por digestor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamento de Batelada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Digestor</Label>
              <Select
                value={selectedDigester}
                onValueChange={setSelectedDigester}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {digesters.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Tempo (HH:MM:SS)</Label>
              <Input
                type="time"
                step="1"
                placeholder="01:30:00"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            Painel de Controle:{' '}
            {format(parseAsLocalNoon(selectedDate), 'dd/MM/yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px] border rounded-lg overflow-hidden flex flex-col text-sm bg-white dark:bg-card">
              {/* Header Row */}
              <div className="grid grid-cols-5 bg-muted font-bold border-b text-center">
                {groupedData.map((g) => (
                  <div key={g.name} className="p-3 border-r last:border-r-0">
                    {g.name}
                  </div>
                ))}
              </div>
              {/* Body Rows */}
              <div className="grid grid-cols-5 flex-1">
                {groupedData.map((g) => (
                  <div
                    key={g.name}
                    className="flex flex-col border-r last:border-r-0"
                  >
                    <div className="flex-1 min-h-[200px] p-2 space-y-1">
                      {g.records.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-2 py-1 bg-muted/20 hover:bg-muted/40 rounded-md border text-xs group transition-colors"
                        >
                          <span className="font-mono">
                            {formatSecondsAsTime(r.durationSeconds)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                            onClick={() => deleteDigesterRecord(r.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t bg-muted/10 divide-y mt-auto">
                      <div className="flex justify-between p-2 text-xs">
                        <span className="font-semibold text-muted-foreground">
                          Bateladas
                        </span>{' '}
                        <span className="font-bold">{g.count}</span>
                      </div>
                      <div className="flex justify-between p-2 text-xs">
                        <span className="font-semibold text-muted-foreground">
                          Soma
                        </span>{' '}
                        <span className="font-mono font-bold">
                          {formatSecondsAsTime(g.sum)}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 text-xs">
                        <span className="font-semibold text-muted-foreground">
                          Média
                        </span>{' '}
                        <span className="font-mono font-bold">
                          {formatSecondsAsTime(g.avg)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Footer Row */}
              <div className="grid grid-cols-5 bg-muted border-t">
                <div className="col-span-3 flex items-center justify-between p-4 font-bold border-r">
                  <span className="uppercase tracking-wider text-xs text-muted-foreground">
                    Tempo médio efetivo de Processo
                  </span>
                  <span className="text-lg font-mono underline decoration-2 underline-offset-4">
                    {formatSecondsAsTime(grandAvg)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-between p-4 font-bold">
                  <span className="uppercase tracking-wider text-xs text-muted-foreground">
                    Total Bateladas
                  </span>
                  <span className="text-lg underline decoration-2 underline-offset-4">
                    {totalBatches}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
