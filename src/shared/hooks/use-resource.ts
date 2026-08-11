import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { ApiError } from '#/shared/lib/problem'
import type { ListParams, Page, Resource } from '#/shared/lib/resource'

/**
 * Hooks génériques sur une ressource.
 *
 * Aucun composant n'appelle `fetch` ni `api` directement : ce qui rend le
 * cache, les invalidations et le traitement d'erreur uniformes. Ajouter une
 * entité au produit ne coûte qu'un `createResource`, pas un jeu de hooks.
 */
export function useResourceList<T>(
  resource: Resource<T, never, never>,
  params: ListParams = {},
): UseQueryResult<Page<T>, ApiError> {
  return useQuery<Page<T>, ApiError>({
    queryKey: resource.keys.list(params),
    queryFn: () => resource.list(params),
    // La page précédente reste affichée pendant le chargement de la suivante,
    // au lieu de faire clignoter le tableau.
    placeholderData: (precedent) => precedent,
  })
}

export function useResourceItem<T>(
  resource: Resource<T, never, never>,
  id: string | undefined,
  storeId?: string,
): UseQueryResult<T, ApiError> {
  return useQuery<T, ApiError>({
    queryKey: resource.keys.detail(id ?? ''),
    queryFn: () => resource.get(id as string, storeId),
    enabled: Boolean(id),
  })
}

interface MutationsOptions {
  storeId?: string
}

export interface ResourceMutations<T, TCreate, TUpdate> {
  create: UseMutationResult<T, ApiError, TCreate>
  update: UseMutationResult<T, ApiError, { id: string; payload: TUpdate }>
  remove: UseMutationResult<void, ApiError, string>
}

export function useResourceMutations<T, TCreate, TUpdate>(
  resource: Resource<T, TCreate, TUpdate>,
  options: MutationsOptions = {},
): ResourceMutations<T, TCreate, TUpdate> {
  const queryClient = useQueryClient()

  /**
   * Invalide les listes après toute écriture. On ne tente pas de recoller le
   * cache à la main : le tri, la pagination et les filtres du serveur peuvent
   * déplacer la ligne, et une liste reconstruite localement finirait par
   * mentir.
   */
  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: resource.keys.lists() })
  }

  const create = useMutation<T, ApiError, TCreate>({
    mutationFn: (payload) => resource.create(payload, options.storeId),
    onSuccess: invalider,
  })

  const update = useMutation<T, ApiError, { id: string; payload: TUpdate }>({
    mutationFn: ({ id, payload }) =>
      resource.update(id, payload, options.storeId),
    onSuccess: async (_donnees, variables) => {
      await queryClient.invalidateQueries({
        queryKey: resource.keys.detail(variables.id),
      })
      await invalider()
    },
  })

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (id) => resource.remove(id, options.storeId),
    onSuccess: invalider,
  })

  return { create, update, remove }
}
