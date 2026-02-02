import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, insira um endereço de email válido.',
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await resetPassword(email)
      if (error) throw error

      setIsSubmitted(true)
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao solicitar',
        description:
          error.message ||
          'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md border-primary/10 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            {isSubmitted
              ? 'Email de recuperação enviado!'
              : 'Digite seu email para receber o link de redefinição.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Se existir uma conta associada ao email{' '}
                <span className="font-medium text-foreground">{email}</span>,
                você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-xs text-muted-foreground">
                Não recebeu? Verifique sua pasta de spam ou tente novamente.
              </p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsSubmitted(false)}
              >
                Tentar outro email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Link
            to="/auth"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
