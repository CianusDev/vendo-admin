import { createServerOnlyFn } from '@tanstack/react-start'

/**
 * Relaie le cookie de la requête entrante vers le back-end.
 *
 * Les loaders TanStack Start s'exécutent sur Nitro : `credentials: 'include'`
 * n'y signifie rien, puisqu'il n'y a pas de navigateur pour attacher le
 * cookie. Il faut donc le recopier à la main (§5.9 du cahier).
 *
 * `createServerOnlyFn` est ce qui rend cet import acceptable : le bundler
 * client refuse `@tanstack/react-start/server`, et ce marqueur lui garantit
 * que le corps ne franchira jamais la frontière.
 */
export const relayCookieHeaders = createServerOnlyFn(
  async (): Promise<Record<string, string>> => {
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const cookie = getRequestHeaders().get('cookie')
    return cookie ? { cookie } : {}
  },
)

/** Boutique active pendant un rendu serveur, lue dans la requête entrante. */
export const readActiveStoreOnServer = createServerOnlyFn(
  async (): Promise<string | undefined> => {
    const { getCookie } = await import('@tanstack/react-start/server')
    const { ACTIVE_STORE_COOKIE } = await import('./active-store')
    return getCookie(ACTIVE_STORE_COOKIE) ?? undefined
  },
)
