import { createContext, useCallback, useContext, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { signOut } from '#/features/auth/auth.service'
import type { Session } from '#/features/auth/auth.types'

interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  /** Vrai si la permission est détenue sur la boutique active. */
  can: (permission: string) => boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Expose la session chargée par la route, sans la stocker.
 *
 * Rien n'est conservé côté client : la session vit dans un cookie httpOnly, et
 * son état fait autorité côté serveur. Le fournisseur ne fait que distribuer
 * ce que le `beforeLoad` de la route a déjà obtenu — la version précédente
 * gardait un jeton en `localStorage`, ce que §8 du cahier interdit.
 */
export function AuthProvider({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  const router = useRouter()

  const can = useCallback(
    (permission: string) => {
      if (!session) return false
      return session.allPermissions || session.permissions.includes(permission)
    },
    [session],
  )

  const logout = useCallback(async () => {
    await signOut()
    // Invalide les données chargées : sans cela, les écrans gardent en mémoire
    // ce que l'utilisateur venait de voir.
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }, [router])

  const valeur = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      can,
      logout,
    }),
    [session, can, logout],
  )

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const contexte = useContext(AuthContext)
  if (!contexte) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  }
  return contexte
}
