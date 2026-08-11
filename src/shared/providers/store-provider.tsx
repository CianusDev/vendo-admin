import { createContext, useCallback, useContext, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ecrireBoutiqueActive } from '#/shared/lib/active-store'
import type { Store } from '#/features/stores/stores.types'

interface StoreContextValue {
  /** Boutiques auxquelles l'utilisateur a accès. */
  stores: Store[]
  activeStore: Store | null
  activeStoreId: string | undefined
  setActiveStore: (storeId: string) => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

/**
 * Boutique active de l'espace d'administration.
 *
 * Le produit est multi-boutiques : publication, prix, stock et commandes sont
 * isolés par boutique (§4.2). Presque tout écran doit donc savoir de laquelle
 * on parle, et c'est cette valeur qui part en `X-Store-Id`.
 */
export function StoreProvider({
  stores,
  activeStoreId,
  children,
}: {
  stores: Store[]
  activeStoreId: string | undefined
  children: React.ReactNode
}) {
  const router = useRouter()

  const activeStore = useMemo(
    () => stores.find((boutique) => boutique.id === activeStoreId) ?? null,
    [stores, activeStoreId],
  )

  const setActiveStore = useCallback(
    async (storeId: string) => {
      ecrireBoutiqueActive(storeId)
      // Changer de boutique change le périmètre de tout ce qui est affiché :
      // les permissions comme les données. Rien de ce qui est en cache ne
      // reste valable.
      await router.invalidate()
    },
    [router],
  )

  const valeur = useMemo<StoreContextValue>(
    () => ({
      stores,
      activeStore,
      activeStoreId: activeStore?.id,
      setActiveStore,
    }),
    [stores, activeStore, setActiveStore],
  )

  return <StoreContext.Provider value={valeur}>{children}</StoreContext.Provider>
}

export function useStoreContext(): StoreContextValue {
  const contexte = useContext(StoreContext)
  if (!contexte) {
    throw new Error('useStoreContext doit être utilisé dans <StoreProvider>')
  }
  return contexte
}
