import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    )
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-muted p-4 rounded-full">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild className="mt-4">
          <a href="/">Voltar ao Início</a>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
