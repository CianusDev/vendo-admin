import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '#/shared/providers/auth-provider'
import { useStoreContext } from '#/shared/providers/store-provider'
import { Button } from '#/shared/components/ui/button'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { session, can, logout } = useAuth()
  const { activeStore } = useStoreContext()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          {session?.user.nom} — {session?.user.email}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">
          Permissions effectives
          {activeStore && (
            <span className="text-muted-foreground font-normal">
              {' '}
              — {activeStore.nom}
            </span>
          )}
        </h2>
        {session?.allPermissions ? (
          <p className="text-sm">
            Propriétaire : toutes les permissions, sur toutes les boutiques.
          </p>
        ) : (
          <ul className="text-muted-foreground list-inside list-disc text-sm">
            {session?.permissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        )}
      </section>

      {can('stores.create') && (
        <p className="text-sm">Vous pouvez créer une boutique.</p>
      )}

      <Button variant="outline" onClick={() => void logout()}>
        Se déconnecter
      </Button>
    </div>
  )
}
