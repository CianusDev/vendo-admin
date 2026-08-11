export type StoreStatus = 'ACTIVE' | 'DISABLED'

export interface Store {
  id: string
  nom: string
  code: string
  pays: string
  devise: string
  currencyExponent: number
  langue: string
  fuseau: string
  status: StoreStatus
  createdAt: string
}

export interface CreateStorePayload {
  nom: string
  code: string
  pays: string
  devise: string
  currencyExponent: number
  langue: string
  fuseau: string
}

/** Le code, la devise et son exposant sont figés après création (§4.2). */
export type UpdateStorePayload = Partial<
  Pick<Store, 'nom' | 'langue' | 'fuseau'>
>
