import { createResource } from '#/shared/lib/resource'
import type {
  CreateStorePayload,
  Store,
  UpdateStorePayload,
} from './stores.types'

/**
 * Toute la couche d'accès aux boutiques tient dans cette déclaration : c'est
 * ce que §5.9 attend d'une ressource conforme aux conventions §5.6.
 */
export const storesResource = createResource<
  Store,
  CreateStorePayload,
  UpdateStorePayload
>('stores', '/stores')
