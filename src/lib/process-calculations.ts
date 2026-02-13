import { differenceInMinutes } from 'date-fns'

export interface ProcessBatch {
  id: string
  start_time: string
  end_time?: string | null
  raw_material_weight?: number
  product_weight?: number
  status?: string
}

export interface DailyMetrics {
  totalProcessed: number
  totalProduced: number
  cookingTimeMinutes: number
  yieldPercentage: number
  throughput: number // t/h
}

export function calculateDailyMetrics(batches: ProcessBatch[]): DailyMetrics {
  let totalProcessed = 0
  let totalProduced = 0
  let cookingTimeMinutes = 0

  batches.forEach((batch) => {
    // Sum weights (assuming input in kg)
    const processed = batch.raw_material_weight || 0
    const produced = batch.product_weight || 0

    totalProcessed += processed
    totalProduced += produced

    // Calculate duration
    if (batch.start_time && batch.end_time) {
      const start = new Date(batch.start_time)
      const end = new Date(batch.end_time)
      // Ensure valid dates
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const duration = differenceInMinutes(end, start)
        if (duration > 0) {
          cookingTimeMinutes += duration
        }
      }
    }
  })

  const yieldPercentage =
    totalProcessed > 0 ? (totalProduced / totalProcessed) * 100 : 0

  // Throughput calculation
  // Throughput (t/h) = Total Processed (Tons) / Total Cooking Time (Hours)
  // Assuming weights are in kg
  const totalProcessedTons = totalProcessed / 1000
  const cookingHours = cookingTimeMinutes / 60

  const throughput = cookingHours > 0 ? totalProcessedTons / cookingHours : 0

  return {
    totalProcessed,
    totalProduced,
    cookingTimeMinutes,
    yieldPercentage,
    throughput,
  }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}
