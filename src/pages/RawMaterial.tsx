import { useState, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Calendar as CalendarIcon,
  Package,
  Lock,
  MoreVertical,
  Filter,
  Scale,
  Percent,
  X,
  Download,
} from 'lucide-react'
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { RawMaterialForm } from '@/components/RawMaterialForm'
import { RawMaterialEntry } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { shouldRequireAuth } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'
import { RawMaterialImportDialog } from '@/components/RawMaterialImportDialog'
import { RAW_MATERIAL_TYPES, MAR_RECICLAGEM_TYPES } from '@/lib/constants'
import { DatePickerWithRange } from '@/components/DateRangePicker'
import { cn } from '@/lib/utils'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'
import { exportDataToExcel } from '@/services/excel-export'

export default function RawMaterial() {
  const {
    rawMaterials,
    deleteRawMaterial,
    dateRange,
    setDateRange,
    production,
    factories,
    currentFactoryId,
  } = useData()
  const { toast } = useToast()
  const { checkPcpAuth } = usePcp()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<RawMaterialEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Security Gate State (Legacy / Admin)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // PCP Gate State (New Records)
  const [isPcpGateOpen, setIsPcpGateOpen] = useState(false)
  const [pcpPendingAction, setPcpPendingAction] = useState<(() => void) | null>(
    null,
  )

  const materialTypes = useMemo(() => {
    const currentFactory = factories.find((f) => f.id === currentFactoryId)
    const isMarReciclagem = currentFactory?.name
      ?.trim()
      .toLowerCase()
      .includes('reciclagem')
    return isMarReciclagem ? MAR_RECICLAGEM_TYPES : RAW_MATERIAL_TYPES
  }, [factories, currentFactoryId])

  const handleProtectedAction = (
    createdAt: Date | undefined,
    action: () => void,
  ) => {
    if (shouldRequireAuth(createdAt)) {
      setPendingAction(() => action)
      setSecurityOpen(true)
    } else {
      action()
    }
  }

  const handleSecuritySuccess = () => {
    setSecurityOpen(false)
    if (pendingAction) pendingAction()
    setPendingAction(null)
  }

  const handleNewEntry = () => {
    checkPcpAuth(
      () => {
        setEditingItem(undefined)
        setIsOpen(true)
      },
      () => {
        setPcpPendingAction(() => () => {
          setEditingItem(undefined)
          setIsOpen(true)
        })
        setIsPcpGateOpen(true)
      },
    )
  }

  const handleEdit = (item: RawMaterialEntry) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteRawMaterial(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A entrada foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setEditingItem(undefined)
  }

  const handleResetDate = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    })
  }

  const isDefaultDate =
    dateRange.from &&
    dateRange.to &&
    isSameDay(dateRange.from, startOfMonth(new Date())) &&
    isSameDay(dateRange.to, endOfMonth(new Date()))

  // Filter Data
  const filteredMaterials = rawMaterials
    .filter((item) => {
      // Date Filter
      if (dateRange.from) {
        const start = startOfDay(dateRange.from)
        const end = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from)
        if (item.date < start || item.date > end) return false
      }

      // Type Filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false

      // Search Filter
      return (
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const handleExportExcel = () => {
    const exportData = filteredMaterials.map((item) => ({
      Data: format(item.date, 'dd/MM/yyyy'),
      Fornecedor: item.supplier,
      'Matéria-Prima': item.type,
      Quantidade: item.quantity,
      Unidade: item.unit,
      Observações: item.notes || '',
    }))

    const currentFactory = factories.find((f) => f.id === currentFactoryId)
    const factoryName =
      currentFactory?.name?.toLowerCase().replace(/\s+/g, '-') || 'geral'
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    const filename = `entradas-mp-${factoryName}-${dateStr}.xlsx`

    exportDataToExcel(exportData, filename, 'Entradas MP')

    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo Excel foi gerado com sucesso.',
    })
  }

  // --- Metrics Calculation ---
  const totalInputKg = filteredMaterials.reduce((acc, item) => {
    const unit = item.unit?.toLowerCase() || ''
    if (unit === 'bag') return acc + item.quantity * 1400
    if (unit === 'ton') return acc + item.quantity * 1000
    return acc + item.quantity
  }, 0)

  // Yield Percentage
  const filteredProduction = production.filter((item) => {
    if (dateRange.from) {
      const start = startOfDay(dateRange.from)
      const end = dateRange.to
        ? endOfDay(dateRange.to)
        : endOfDay(dateRange.from)
      if (item.date < start || item.date > end) return false
    }
    return true
  })

  const totalOutput = filteredProduction.reduce(
    (acc, curr) =>
      acc + (curr.seboProduced + curr.fcoProduced + curr.farinhetaProduced),
    0,
  )
  const totalMpUsed = filteredProduction.reduce(
    (acc, curr) => acc + curr.mpUsed,
    0,
  )
  const yieldPercentage =
    totalMpUsed > 0 ? (totalOutput / totalMpUsed) * 100 : 0

  const formatMass = (val: number) => {
    if (val === 0) return '0,00 t'
    if (val >= 1000)
      return `${(val / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t`
    return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
  }

  const isSingleDay =
    dateRange.from && (!dateRange.to || isSameDay(dateRange.from, dateRange.to))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Entrada de Matéria-Prima
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
            onClick={handleExportExcel}
            disabled={filteredMaterials.length === 0}
          >
            <Download className="h-4 w-4" />{' '}
            {isMobile ? 'Exportar' : 'Exportar Excel'}
          </Button>
          <RawMaterialImportDialog />
          <Button
            className="gap-2 flex-1 sm:flex-none"
            onClick={handleNewEntry}
            size={isMobile ? 'default' : 'default'}
          >
            <Plus className="h-4 w-4" /> {isMobile ? 'Nova' : 'Nova Entrada'}
          </Button>

          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Entrada' : 'Registrar Entrada'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Atualize os detalhes do registro selecionado.'
                    : 'Insira os detalhes do recebimento de matéria-prima.'}
                </DialogDescription>
              </DialogHeader>
              <RawMaterialForm
                initialData={editingItem}
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Visão Geral Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Visão Geral
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Entrada
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMass(totalInputKg)}
              </div>
              <p className="text-xs text-muted-foreground">
                Soma da quantidade baseada nos filtros aplicados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendimentos</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {yieldPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Eficiência produtiva no período selecionado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="hidden sm:block">
                Histórico de Entradas
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">
                  {isSingleDay ? 'Total do Dia:' : 'Total Listado:'}
                </span>
                <span className="font-bold text-foreground">
                  {formatMass(totalInputKg)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <DatePickerWithRange
                  date={dateRange}
                  setDate={(range) => {
                    if (range) {
                      setDateRange({
                        from: range.from ? startOfDay(range.from) : undefined,
                        to: range.to ? endOfDay(range.to) : undefined,
                      })
                    }
                  }}
                  className="w-full sm:w-[260px]"
                />
                {!isDefaultDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetDate}
                    title="Redefinir filtro de data"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Todos os tipos" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {materialTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedor..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          {isMobile ? (
            <div className="space-y-4">
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              ) : (
                filteredMaterials.map((entry) => {
                  const isLocked = shouldRequireAuth(entry.createdAt)
                  return (
                    <Card key={entry.id} className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <span className="font-semibold text-lg line-clamp-1">
                              {entry.supplier}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(entry.date, 'dd/MM/yyyy')}
                              {isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground/50" />
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProtectedAction(entry.createdAt, () =>
                                    handleEdit(entry),
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProtectedAction(entry.createdAt, () =>
                                    setDeleteId(entry.id),
                                  )
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between py-2 border-t border-b border-border/50 mb-3 bg-secondary/20 rounded px-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-medium">{entry.type}</span>
                          </div>
                          <span className="font-mono font-bold text-lg">
                            {entry.quantity.toLocaleString('pt-BR')}{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                              {entry.unit}
                            </span>
                          </span>
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            "{entry.notes}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Matéria-Prima</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum registro encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((entry) => {
                    const isLocked = shouldRequireAuth(entry.createdAt)
                    return (
                      <TableRow
                        key={entry.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {format(entry.date, 'dd/MM/yyyy')}
                            {isLocked && (
                              <Lock className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{entry.supplier}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.quantity.toLocaleString('pt-BR')}{' '}
                          {entry.unit || 'kg'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {entry.notes || '-'}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() =>
                              handleProtectedAction(entry.createdAt, () =>
                                handleEdit(entry),
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleProtectedAction(entry.createdAt, () =>
                                setDeleteId(entry.id),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta entrada? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SecurityGate
        isOpen={securityOpen}
        onOpenChange={setSecurityOpen}
        onSuccess={handleSecuritySuccess}
      />

      <PcpGate
        isOpen={isPcpGateOpen}
        onOpenChange={setIsPcpGateOpen}
        onSuccess={() => {
          if (pcpPendingAction) pcpPendingAction()
          setPcpPendingAction(null)
        }}
      />
    </div>
  )
}
