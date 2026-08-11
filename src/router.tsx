import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ApiError } from '#/shared/lib/problem'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (tentative, error) => {
          // Réessayer un 401, un 403 ou une validation ne changera rien : seuls
          // les incidents réseau méritent une seconde chance.
          if (error instanceof ApiError && error.status < 500) return false
          return tentative < 2
        },
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  // Déshydrate le cache serveur vers le client : ce que le loader a chargé
  // pendant le rendu n'est pas rechargé à l'hydratation.
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
