import { FileBarChart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QualityReport } from '@/components/dashboard/QualityReport'
import { YieldsReport } from '@/components/dashboard/YieldsReport'

export default function AdvancedReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Relatórios Avançados
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Análises detalhadas de qualidade e rendimentos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="quality" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="quality">Qualidade</TabsTrigger>
          <TabsTrigger value="yields">Rendimentos</TabsTrigger>
        </TabsList>

        <TabsContent
          value="quality"
          className="animate-in fade-in slide-in-from-bottom-2"
        >
          <QualityReport />
        </TabsContent>

        <TabsContent
          value="yields"
          className="animate-in fade-in slide-in-from-bottom-2"
        >
          <YieldsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
