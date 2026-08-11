import api from './api'
import type { ItemResponse, ListMeta, ListResponse } from './api'

export interface ListParams {
  page?: number
  perPage?: number
  /** `-created_at` pour décroissant, plusieurs champs séparés par des virgules. */
  sort?: string
  filter?: Record<string, string | number | boolean | undefined>
  storeId?: string
}

export interface Page<T> {
  data: T[]
  meta: ListMeta
}

/**
 * Accès générique à une ressource REST.
 *
 * Toutes les collections du produit suivent les mêmes conventions (§5.6), ce
 * qui permet à une seule implémentation de les servir : ajouter une entité ne
 * doit coûter qu'une déclaration, jamais un service de plus.
 *
 * Les filtres partent en `filter[champ]=valeur`, la forme attendue par le
 * back-end.
 */
export function createResource<T, TCreate = Partial<T>, TUpdate = TCreate>(
  name: string,
  basePath: string,
) {
  const aPlat = (params: ListParams = {}) => {
    const { filter, ...reste } = params
    const sortie: Record<string, string | number | boolean | undefined> = {
      ...reste,
    }
    for (const [champ, valeur] of Object.entries(filter ?? {})) {
      if (valeur !== undefined && valeur !== '') {
        sortie[`filter[${champ}]`] = valeur
      }
    }
    delete sortie.storeId
    return sortie
  }

  return {
    name,
    basePath,

    /** Clés de cache : hiérarchiques, pour invalider une liste sans les détails. */
    keys: {
      all: [name] as const,
      lists: () => [name, 'list'] as const,
      list: (params: ListParams) => [name, 'list', params] as const,
      details: () => [name, 'detail'] as const,
      detail: (id: string) => [name, 'detail', id] as const,
    },

    async list(params: ListParams = {}): Promise<Page<T>> {
      const reponse = await api.get<ListResponse<T>>(basePath, {
        params: aPlat(params),
        storeId: params.storeId,
      })
      return { data: reponse.data, meta: reponse.meta }
    },

    async get(id: string, storeId?: string): Promise<T> {
      const reponse = await api.get<ItemResponse<T>>(`${basePath}/${id}`, {
        storeId,
      })
      return reponse.data
    },

    async create(payload: TCreate, storeId?: string): Promise<T> {
      const reponse = await api.post<ItemResponse<T>>(basePath, payload, {
        storeId,
      })
      return reponse.data
    },

    async update(id: string, payload: TUpdate, storeId?: string): Promise<T> {
      const reponse = await api.patch<ItemResponse<T>>(
        `${basePath}/${id}`,
        payload,
        { storeId },
      )
      return reponse.data
    },

    async remove(id: string, storeId?: string): Promise<void> {
      await api.delete<void>(`${basePath}/${id}`, { storeId })
    },
  }
}

export type Resource<T, TCreate = Partial<T>, TUpdate = TCreate> = ReturnType<
  typeof createResource<T, TCreate, TUpdate>
>
