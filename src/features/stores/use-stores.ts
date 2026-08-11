import {
  useResourceItem,
  useResourceList,
  useResourceMutations,
} from '#/shared/hooks/use-resource'
import { storesResource } from './stores.service'
import type { ListParams } from '#/shared/lib/resource'

export function useStores(params: ListParams = {}) {
  return useResourceList(storesResource, params)
}

export function useStore(id: string | undefined) {
  return useResourceItem(storesResource, id)
}

export function useStoreMutations() {
  return useResourceMutations(storesResource)
}
