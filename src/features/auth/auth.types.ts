import type z from 'zod'
import type { LoginSchema } from './auth.schemas'

export type LoginDto = z.infer<typeof LoginSchema>

export interface AuthUser {
  id: string
  email: string
  nom: string
  emailVerifie: boolean
  isOwner: boolean
}

/**
 * Ce que renvoie `GET /v1/auth/me`.
 *
 * `allPermissions` traduit le `*` du propriétaire : plutôt que d'énumérer le
 * catalogue, le back-end signale qu'il a tout. `permissions` est alors vide.
 */
export interface Session {
  user: AuthUser
  permissions: string[]
  allPermissions: boolean
}

/** Mot de passe accepté, second facteur encore à présenter. */
export interface MfaChallenge {
  mfaRequired: true
  ticket: string
}

export type LoginOutcome = { user: AuthUser } | MfaChallenge

export function isMfaChallenge(outcome: LoginOutcome): outcome is MfaChallenge {
  return 'mfaRequired' in outcome
}
