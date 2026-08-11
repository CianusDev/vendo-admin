import { Outlet, createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '#/features/auth/auth.guard'
import { AuthProvider } from '#/shared/providers/auth-provider'

/**
 * Layout des écrans authentifiés.
 *
 * `beforeLoad` s'exécute avant tout rendu, côté serveur au premier chargement :
 * la session est donc vérifiée auprès du back-end, pas devinée d'après un
 * jeton local. Son résultat descend dans le contexte du routeur, ce qui évite
 * à chaque écran de la redemander.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => ({ session: await requireAuth() }),
  component: LayoutAuthentifie,
})

function LayoutAuthentifie() {
  const { session } = Route.useRouteContext()

  return (
    <AuthProvider session={session}>
      <Outlet />
    </AuthProvider>
  )
}
