import { z } from 'zod'

/**
 * Reprend les contraintes du back-end (§4.2 du cahier). Les valider ici évite
 * un aller-retour, mais l'autorité reste le serveur : ce schéma est un
 * confort, pas une garantie.
 */
export const CreateStoreSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(120),
  code: z
    .string()
    .regex(
      /^[A-Z0-9-]{2,20}$/,
      'Majuscules, chiffres ou tirets, de 2 à 20 caractères',
    ),
  pays: z.string().length(2, 'Code ISO à 2 lettres'),
  devise: z.string().length(3, 'Code ISO à 3 lettres'),
  currencyExponent: z
    .number({ message: 'Un nombre est attendu' })
    .int()
    .min(0)
    .max(4),
  langue: z.string().min(1).max(10),
  fuseau: z.string().min(1, 'Le fuseau horaire est requis'),
})

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>
