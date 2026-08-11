/**
 * Erreur d'API au format RFC 9457, produit par le back-end (§5.6 du cahier).
 *
 * `ApiError` est levée, pas renvoyée : TanStack Query distingue succès et
 * échec par le rejet de la promesse, et un code d'erreur caché dans un champ
 * obligerait chaque appelant à s'en souvenir.
 */
export interface FieldError {
  field: string
  code: string
  message?: string
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.status = problem.status
    this.problem = problem
  }

  /** Erreurs de validation indexées par champ, pour react-hook-form. */
  get fieldErrors(): Record<string, string> {
    const entrees = (this.problem.errors ?? []).map((erreur) => [
      erreur.field,
      erreur.message ?? erreur.code,
    ])
    return Object.fromEntries(entrees) as Record<string, string>
  }

  get isValidation(): boolean {
    return this.status === 422
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }
}

/** Réponse non conforme — panne réseau, proxy, back-end injoignable. */
export function problemInattendu(
  status: number,
  detail?: string,
): ProblemDetails {
  return {
    type: 'about:blank',
    title: 'Erreur inattendue',
    status,
    detail,
  }
}
