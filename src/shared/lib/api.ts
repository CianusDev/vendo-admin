import { environment } from '#/environments'
import { lireBoutiqueActiveClient } from './active-store'
import { ApiError, problemInattendu } from './problem'
import type { ProblemDetails } from './problem'
import { readActiveStoreOnServer, relayCookieHeaders } from './relay-cookie'

type Params = Record<string, string | number | boolean | null | undefined>

export interface ApiOptions extends Omit<RequestInit, 'body' | 'method'> {
  params?: Params
  /**
   * Boutique visée. À défaut, la boutique active est employée : les écrans
   * courants n'ont pas à la répéter à chaque appel.
   */
  storeId?: string
  /** Interdit la tentative de renouvellement, pour éviter toute boucle. */
  skipRefresh?: boolean
}

/** Enveloppes de §5.6 : un objet, ou une collection avec son total. */
export interface ItemResponse<T> {
  data: T
}

export interface ListMeta {
  total: number
  page: number
  perPage: number
}

export interface ListResponse<T> {
  data: T[]
  meta: ListMeta
}

const REFRESH_PATH = '/auth/refresh'

/**
 * Client HTTP unique de l'admin.
 *
 * Trois partis pris, tous imposés par le back-end :
 *
 * - **La session voyage en cookies httpOnly.** Le navigateur ne peut pas les
 *   lire, donc rien n'est stocké côté client et chaque appel porte
 *   `credentials: 'include'` — l'option de fetch, pas un en-tête, contrairement
 *   à ce que faisait la version précédente.
 * - **Les erreurs sont levées**, avec leur `problem+json` intact.
 * - **Un 401 déclenche un renouvellement**, puis un seul réessai. L'accès dure
 *   quinze minutes : sans cela, l'utilisateur serait déconnecté quatre fois
 *   par heure.
 */
export class Api {
  private readonly baseUrl: string
  private renouvellementEnCours: Promise<boolean> | null = null
  private onSessionPerdue: (() => void) | null = null

  constructor(baseUrl: string = environment.apiUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  /** Appelé quand le renouvellement échoue : à l'appelant de rediriger. */
  setSessionExpiredHandler(handler: () => void): void {
    this.onSessionPerdue = handler
  }

  get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options)
  }

  post<T>(
    endpoint: string,
    data?: unknown,
    options: ApiOptions = {},
  ): Promise<T> {
    return this.request<T>('POST', endpoint, data, options)
  }

  put<T>(endpoint: string, data?: unknown, options: ApiOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options)
  }

  patch<T>(
    endpoint: string,
    data?: unknown,
    options: ApiOptions = {},
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options)
  }

  delete<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options)
  }

  private buildUrl(endpoint: string, params?: Params): string {
    const chemin = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${chemin}`
    if (!params) return url

    const recherche = new URLSearchParams()
    for (const [cle, valeur] of Object.entries(params)) {
      if (valeur !== null && valeur !== undefined && valeur !== '') {
        recherche.set(cle, String(valeur))
      }
    }
    const chaine = recherche.toString()
    return chaine ? `${url}?${chaine}` : url
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data: unknown,
    options: ApiOptions,
  ): Promise<T> {
    const { params, storeId, skipRefresh, headers, ...reste } = options

    const enTetes: Record<string, string> = {
      Accept: 'application/json',
      ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(await this.enTeteBoutique(storeId)),
      ...(await this.enTetesDeRelai()),
      ...((headers as Record<string, string> | undefined) ?? {}),
    }

    const reponse = await fetch(this.buildUrl(endpoint, params), {
      ...reste,
      method,
      headers: enTetes,
      // L'option, pas l'en-tête : sans elle le cookie de session ne part pas.
      credentials: 'include',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })

    if (reponse.status === 401 && !skipRefresh && endpoint !== REFRESH_PATH) {
      const renouvele = await this.renouveler()
      if (renouvele) {
        return await this.request<T>(method, endpoint, data, {
          ...options,
          skipRefresh: true,
        })
      }
      this.onSessionPerdue?.()
    }

    if (!reponse.ok) {
      throw new ApiError(await this.lireProbleme(reponse))
    }

    if (reponse.status === 204) {
      return undefined as T
    }

    return (await reponse.json()) as T
  }

  /**
   * Un seul renouvellement à la fois : trois requêtes qui échouent ensemble ne
   * doivent pas produire trois rotations, dont deux seraient vues comme des
   * rejeux et révoqueraient toute la famille de jetons.
   */
  private renouveler(): Promise<boolean> {
    this.renouvellementEnCours ??= this.demanderRenouvellement().finally(() => {
      this.renouvellementEnCours = null
    })
    return this.renouvellementEnCours
  }

  private async demanderRenouvellement(): Promise<boolean> {
    try {
      const reponse = await fetch(this.buildUrl(REFRESH_PATH), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(await this.enTetesDeRelai()),
        },
        credentials: 'include',
      })
      return reponse.ok
    } catch {
      return false
    }
  }

  private async lireProbleme(reponse: Response): Promise<ProblemDetails> {
    try {
      const corps = (await reponse.json()) as Partial<ProblemDetails> | null
      return typeof corps?.status === 'number'
        ? (corps as ProblemDetails)
        : problemInattendu(reponse.status, reponse.statusText)
    } catch {
      return problemInattendu(reponse.status, reponse.statusText)
    }
  }

  /**
   * `X-Store-Id` de la requête. La valeur explicite l'emporte ; sinon on prend
   * la boutique active, lue dans le cookie côté navigateur comme côté serveur.
   */
  private async enTeteBoutique(
    explicite?: string,
  ): Promise<Record<string, string>> {
    if (explicite) return { 'X-Store-Id': explicite }

    const active =
      typeof window === 'undefined'
        ? await readActiveStoreOnServer()
        : lireBoutiqueActiveClient()

    return active ? { 'X-Store-Id': active } : {}
  }

  private async enTetesDeRelai(): Promise<Record<string, string>> {
    if (typeof window !== 'undefined') return {}
    return await relayCookieHeaders()
  }
}

const api = new Api()
export default api
export { ApiError }
