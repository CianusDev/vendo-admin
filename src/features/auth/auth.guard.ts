import { redirect } from '@tanstack/react-router'
import { ApiError } from '#/shared/lib/problem'
import { getSession } from './auth.service'
import type { Session } from './auth.types'

/**
 * Garde de route, à utiliser dans `beforeLoad`.
 *
 * La session vit dans un cookie httpOnly que le navigateur ne peut pas lire :
 * la seule façon de savoir si elle est valide est de le demander au back-end.
 * Le contrôle s'exécute donc côté serveur au premier rendu, où le cookie est
 * relayé par le client API, puis côté navigateur lors des navigations.
 *
 * L'ancienne version lisait un jeton dans `localStorage` — ce qui la rendait
 * doublement fausse : le jeton n'y est plus, et sa seule présence n'aurait
 * jamais prouvé qu'il est encore valide.
 */
export async function requireAuth(storeId?: string): Promise<Session> {
  try {
    return await getSession(storeId)
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw redirect({ to: '/login' })
    }
    throw error
  }
}

/** Empêche un utilisateur déjà connecté de revenir sur l'écran de connexion. */
export async function requireGuest(): Promise<void> {
  try {
    await getSession()
  } catch {
    // Pas de session valide : c'est le cas normal ici.
    return
  }
  throw redirect({ to: '/dashboard' })
}

/**
 * Exige une permission nommée. Ce contrôle masque une route ; l'autorité reste
 * le guard du back-end, qui refuse l'action même si l'écran s'affiche.
 */
export function requirePermission(
  session: Session,
  permission: string,
): Session {
  if (session.allPermissions || session.permissions.includes(permission)) {
    return session
  }
  throw redirect({ to: '/dashboard' })
}
