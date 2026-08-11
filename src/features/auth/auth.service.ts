import api from '#/shared/lib/api'
import type { ItemResponse } from '#/shared/lib/api'
import type {
  AuthUser,
  LoginDto,
  LoginOutcome,
  Session,
} from './auth.types'

/**
 * Aucun jeton ne transite ici : le back-end les pose en cookies httpOnly, que
 * le navigateur envoie seul. Ces fonctions ne manipulent donc que des données
 * d'identité.
 */
export async function signIn(payload: LoginDto): Promise<LoginOutcome> {
  const reponse = await api.post<ItemResponse<LoginOutcome>>(
    '/auth/login',
    payload,
  )
  return reponse.data
}

export async function completeMfa(
  ticket: string,
  code: string,
): Promise<AuthUser> {
  const reponse = await api.post<ItemResponse<AuthUser>>('/auth/mfa', {
    ticket,
    code,
  })
  return reponse.data
}

/** Identité et permissions effectives pour la boutique active. */
export async function getSession(storeId?: string): Promise<Session> {
  const reponse = await api.get<ItemResponse<Session>>('/auth/me', { storeId })
  return reponse.data
}

export async function signOut(): Promise<void> {
  await api.post<void>('/auth/logout')
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post<void>('/auth/forgot-password', { email })
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<AuthUser> {
  const reponse = await api.post<ItemResponse<AuthUser>>(
    '/auth/reset-password',
    { token, newPassword },
  )
  return reponse.data
}
