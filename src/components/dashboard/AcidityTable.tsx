import { format } from 'date-fns'
import { Pencil } from 'lucide-react'
import { AcidityEntry } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useData } from '@/context/DataContext'

interface AcidityTableProps {
  data: AcidityEntry[]
  onEdit: (entry: AcidityEntry) => void
}

export function AcidityTable({ data, onEdit }: AcidityTableProps) {
  const { isViewerMode } = useData()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead>Tanque</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead className="text-right">Peso (kg)</TableHead>
          <TableHead className="text-right">Volume (L)</TableHead>
          <TableHead>Horários Real.</TableHead>
          <TableHead>Observações</TableHead>
          {!isViewerMode && <TableHead className="w-[80px]">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={!isViewerMode ? 9 : 8}
              className="text-center h-24 text-muted-foreground"
            >
              Nenhum registro encontrado no período.
            </TableCell>
          </TableRow>
        ) : (
          data.map((entry) => (
            <TableRow
              key={entry.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              <TableCell className="font-medium">
                {format(entry.date, 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>{entry.time}</TableCell>
              <TableCell>
                <span className="font-medium text-primary">{entry.tank}</span>
              </TableCell>
              <TableCell>{entry.responsible}</TableCell>
              <TableCell className="text-right font-mono">
                {entry.weight.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-right font-mono">
                {entry.volume.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {entry.performedTimes}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {entry.notes || '-'}
              </TableCell>
              {!isViewerMode && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(entry)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
