import { ResourceForm } from '#/shared/components/resource-form'
import type { FieldDef } from '#/shared/components/resource-form'
import { CreateStoreSchema } from '../stores.schemas'
import type { CreateStoreInput } from '../stores.schemas'
import { useStoreMutations } from '../use-stores'

/**
 * Le coût d'un formulaire, une fois la couche en place : une liste de champs.
 * La validation vient du schéma, et les refus du serveur reviennent d'eux-mêmes
 * sous les bons libellés.
 */
const champs: FieldDef<CreateStoreInput>[] = [
  { name: 'nom', label: 'Nom', placeholder: 'Boutique d’Abidjan' },
  {
    name: 'code',
    label: 'Code',
    description: 'Figé après création : il apparaît sur les documents émis.',
    placeholder: 'ABJ',
  },
  { name: 'pays', label: 'Pays', placeholder: 'CI' },
  { name: 'devise', label: 'Devise', placeholder: 'XOF' },
  {
    name: 'currencyExponent',
    label: 'Décimales de la devise',
    type: 'number',
    description: '0 pour le franc CFA, 2 pour l’euro.',
  },
  { name: 'langue', label: 'Langue', placeholder: 'fr' },
  { name: 'fuseau', label: 'Fuseau horaire', placeholder: 'Africa/Abidjan' },
]

export function StoreForm({ onCreated }: { onCreated?: () => void }) {
  const { create } = useStoreMutations()

  return (
    <ResourceForm
      schema={CreateStoreSchema}
      fields={champs}
      submitLabel="Créer la boutique"
      successMessage="Boutique créée"
      onSubmit={(valeurs) => create.mutateAsync(valeurs)}
      onSuccess={onCreated}
    />
  )
}
