import { AlertTriangle, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Você não tem permissão para acessar esta área do sistema. Verifique
            seu nível de acesso com o administrador.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
