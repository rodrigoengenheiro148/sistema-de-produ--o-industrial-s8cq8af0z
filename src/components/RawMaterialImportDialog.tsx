import { useState, useRef } from 'react'
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
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { RawMaterialEntry } from '@/lib/types'
import { RAW_MATERIAL_TYPES, MEASUREMENT_UNITS } from '@/lib/constants'
import { parse, isValid } from 'date-fns'

export function RawMaterialImportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { bulkAddRawMaterials } = useData()

  const handleDownloadTemplate = () => {
    const headers = [
      'Data',
      'Fornecedor',
      'Tipo',
      'Quantidade',
      'Unidade',
      'Observações',
    ]
    const exampleRow = [
      '01/01/2026',
      'Fornecedor Exemplo',
      'Ossos',
      '1000',
      'kg',
      'Observação exemplo',
    ]

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'modelo_importacao_materia_prima.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseAndValidateCsv = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '')

    if (lines.length < 2) {
      throw new Error('O arquivo CSV está vazio ou contém apenas o cabeçalho.')
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const requiredHeaders = [
      'data',
      'fornecedor',
      'tipo',
      'quantidade',
      'unidade',
    ]

    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.includes(h.toLowerCase()),
    )
    if (missingHeaders.length > 0) {
      throw new Error(
        `Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`,
      )
    }

    const entries: Omit<RawMaterialEntry, 'id'>[] = []
    const errors: string[] = []

    // Map header indexes
    const idxDate = headers.indexOf('data')
    const idxSupplier = headers.indexOf('fornecedor')
    const idxType = headers.indexOf('tipo')
    const idxQuantity = headers.indexOf('quantidade')
    const idxUnit = headers.indexOf('unidade')
    const idxNotes = headers.indexOf('observações') // Optional

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Simple CSV split by comma (doesn't handle quoted commas well, but sufficient for template)
      const cols = line.split(',').map((c) => c.trim())

      if (cols.length < requiredHeaders.length) {
        errors.push(`Linha ${i + 1}: Dados insuficientes.`)
        continue
      }

      const dateStr = cols[idxDate]
      const supplier = cols[idxSupplier]
      const type = cols[idxType]
      const quantityStr = cols[idxQuantity]
      const unit = cols[idxUnit]
      const notes = idxNotes !== -1 ? cols[idxNotes] : ''

      // Validation
      // Date: Try dd/MM/yyyy then yyyy-MM-dd
      let date = parse(dateStr, 'dd/MM/yyyy', new Date())
      if (!isValid(date)) {
        date = parse(dateStr, 'yyyy-MM-dd', new Date())
      }

      if (!isValid(date)) {
        errors.push(`Linha ${i + 1}: Data inválida (${dateStr}).`)
        continue
      }

      // Force noon to avoid timezone issues
      date.setHours(12, 0, 0, 0)

      if (!supplier || supplier.length < 2) {
        errors.push(`Linha ${i + 1}: Fornecedor inválido.`)
        continue
      }

      // Type Validation
      if (
        !RAW_MATERIAL_TYPES.includes(type as any) &&
        !RAW_MATERIAL_TYPES.some((t) => t.toLowerCase() === type.toLowerCase())
      ) {
        errors.push(
          `Linha ${i + 1}: Tipo de matéria-prima inválido (${type}). Tipos permitidos: ${RAW_MATERIAL_TYPES.join(', ')}`,
        )
        continue
      }
      // Normalize type casing if needed
      const normalizedType =
        RAW_MATERIAL_TYPES.find(
          (t) => t.toLowerCase() === type.toLowerCase(),
        ) || type

      const quantity = Number(quantityStr)
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Linha ${i + 1}: Quantidade inválida (${quantityStr}).`)
        continue
      }

      const validUnits = MEASUREMENT_UNITS.map((u) => u.value)
      if (!validUnits.includes(unit as any)) {
        errors.push(`Linha ${i + 1}: Unidade inválida (${unit}).`)
        continue
      }

      entries.push({
        date,
        supplier,
        type: normalizedType,
        quantity,
        unit,
        notes,
      })
    }

    if (errors.length > 0) {
      // If too many errors, just show first 5
      const displayedErrors = errors.slice(0, 5)
      if (errors.length > 5) {
        displayedErrors.push(`...e mais ${errors.length - 5} erros.`)
      }
      throw new Error(`Erros encontrados:\n${displayedErrors.join('\n')}`)
    }

    return entries
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Arquivo não selecionado',
        description: 'Por favor, selecione um arquivo CSV para importar.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const entries = await parseAndValidateCsv(file)
      await bulkAddRawMaterials(entries)

      toast({
        title: 'Importação concluída',
        description: `${entries.length} registros foram importados com sucesso.`,
      })
      setIsOpen(false)
      setFile(null)
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importação em Massa</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para registrar múltiplas entradas de
            matéria-prima de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 rounded-md border p-4 bg-secondary/10">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                Modelo de Importação
              </p>
              <p className="text-sm text-muted-foreground">
                Baixe o modelo para garantir que seus dados estejam no formato
                correto.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4" /> Modelo
            </Button>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos permitidos: {RAW_MATERIAL_TYPES.join(', ')}
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span>Arquivo selecionado: {file.name}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? 'Processando...' : 'Confirmar Importação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
