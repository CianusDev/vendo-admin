import { createFileRoute } from '@tanstack/react-router'
import { requireGuest } from '#/features/auth/auth.guard'
import { LoginForm } from '#/features/auth/components/login-form'

export const Route = createFileRoute('/login/')({
  beforeLoad: () => requireGuest(),
  component: PageConnexion,
})

function PageConnexion() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="text-muted-foreground text-sm">
            Accédez à votre espace d'administration.
          </p>
        </header>
        <LoginForm />
      </div>
    </div>
  )
}
