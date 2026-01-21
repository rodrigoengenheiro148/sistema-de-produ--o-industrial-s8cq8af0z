import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface ExportOptionsProps {
  className?: string
}

export function ExportOptions({ className }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const getFileName = (type: 'pdf' | 'png') => {
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    return `dashboard-producao-${dateStr}.${type}`
  }

  const handleExportPDF = () => {
    setIsExporting(true)
    const originalTitle = document.title
    const fileName = getFileName('pdf')
    document.title = fileName.replace('.pdf', '')

    toast({
      title: 'Preparando PDF',
      description:
        'A janela de impressão foi aberta. Selecione "Salvar como PDF".',
    })

    // Small delay to ensure title is updated and UI (spinners) renders
    setTimeout(() => {
      window.print()
      document.title = originalTitle
      setIsExporting(false)
    }, 500)
  }

  const handleExportPNG = async () => {
    try {
      setIsExporting(true)
      toast({
        title: 'Iniciando captura',
        description: 'Selecione a janela ou aba atual para capturar a imagem.',
      })

      // Use the Screen Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { preferCurrentTab: true },
        audio: false,
      })

      const track = stream.getVideoTracks()[0]
      const video = document.createElement('video')
      video.style.display = 'none'
      video.srcObject = stream

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve(true)
        }
      })

      // Wait a bit for the video to stabilize
      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to blob and download
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png', 1.0),
        )

        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = getFileName('png')
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          toast({
            title: 'Download iniciado',
            description: 'A imagem foi capturada com sucesso.',
          })
        }
      }

      // Stop sharing
      track.stop()
      video.remove()
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description:
          'Não foi possível capturar a imagem. Verifique as permissões.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 border-primary/20 text-primary hover:bg-primary/5 ${className}`}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar Dados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Selecione o formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          <span>Exportar como PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG} className="cursor-pointer">
          <ImageIcon className="mr-2 h-4 w-4" />
          <span>Exportar como PNG</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
