import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * L'admin n'a pas de page d'accueil publique : la racine mène au tableau de
 * bord, et la garde du layout authentifié renvoie vers la connexion si la
 * session n'est pas valide.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
