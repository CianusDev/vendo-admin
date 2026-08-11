export const ACTIVE_STORE_COOKIE = 'vendo_store'

/**
 * Boutique active, conservée dans un cookie lisible.
 *
 * Ce n'est pas un secret mais une préférence d'affichage : le serveur doit la
 * lire pour calculer les permissions du bon périmètre pendant le rendu, et le
 * navigateur pour la changer. Un cookie httpOnly interdirait le second usage,
 * `localStorage` le premier.
 *
 * Rien ne repose sur sa véracité : le back-end vérifie que l'utilisateur a
 * bien accès à cette boutique, et la RLS masque tout le reste.
 */
export function lireBoutiqueActiveClient(): string | undefined {
  if (typeof document === 'undefined') return undefined

  const trouve = document.cookie
    .split('; ')
    .find((entree) => entree.startsWith(`${ACTIVE_STORE_COOKIE}=`))

  return trouve ? decodeURIComponent(trouve.split('=')[1]) : undefined
}

export function ecrireBoutiqueActive(storeId: string): void {
  if (typeof document === 'undefined') return

  const unAn = 60 * 60 * 24 * 365
  document.cookie = `${ACTIVE_STORE_COOKIE}=${encodeURIComponent(storeId)}; path=/; max-age=${unAn}; samesite=lax`
}
