import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '#/features/auth/auth.guard'
import { storesResource } from '#/features/stores/stores.service'
import { StoreSwitcher } from '#/shared/components/store-switcher'
import { readActiveStoreOnServer } from '#/shared/lib/relay-cookie'
import { lireBoutiqueActiveClient } from '#/shared/lib/active-store'
import { AuthProvider } from '#/shared/providers/auth-provider'
import { StoreProvider } from '#/shared/providers/store-provider'

/**
 * Layout des écrans authentifiés.
 *
 * `beforeLoad` s'exécute avant tout rendu, côté serveur au premier chargement :
 * la session est vérifiée auprès du back-end, pas devinée d'après un jeton
 * local. Les permissions sont demandées **pour la boutique active**, puisque
 * les mêmes identifiants n'ouvrent pas les mêmes droits d'une boutique à
 * l'autre (§2 du cahier des charges).
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const storeId =
      typeof window === 'undefined'
        ? await readActiveStoreOnServer()
        : lireBoutiqueActiveClient()

    const session = await requireAuth(storeId)
    return { session, storeId }
  },
  loader: async () => {
    // La liste alimente le sélecteur. La RLS ne renvoie que les boutiques
    // autorisées : aucun filtrage n'est nécessaire ici.
    const { data } = await storesResource.list({ perPage: 100 })
    return { stores: data }
  },
  component: LayoutAuthentifie,
})

function LayoutAuthentifie() {
  const { session, storeId } = Route.useRouteContext()
  const { stores } = Route.useLoaderData()

  // Aucune boutique choisie : la première autorisée fait un défaut utile.
  const boutiqueActive = storeId ?? stores[0]?.id

  return (
    <AuthProvider session={session}>
      <StoreProvider stores={stores} activeStoreId={boutiqueActive}>
        <div className="min-h-svh">
          <header className="flex items-center justify-between border-b px-6 py-3">
            <nav className="flex items-center gap-4 text-sm">
              <Link
                to="/dashboard"
                className="hover:underline"
                activeProps={{ className: 'font-medium underline' }}
              >
                Tableau de bord
              </Link>
              <Link
                to="/stores"
                className="hover:underline"
                activeProps={{ className: 'font-medium underline' }}
              >
                Boutiques
              </Link>
            </nav>
            <StoreSwitcher />
          </header>

          <Outlet />
        </div>
      </StoreProvider>
    </AuthProvider>
  )
}
