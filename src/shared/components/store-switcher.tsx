import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { useStoreContext } from '#/shared/providers/store-provider'

/**
 * Sélecteur de boutique active.
 *
 * Une seule boutique : rien à choisir, on affiche son nom. Le propriétaire
 * d'une installation à boutique unique n'a pas à manipuler un menu qui n'offre
 * qu'une option.
 */
export function StoreSwitcher() {
  const { stores, activeStoreId, setActiveStore } = useStoreContext()

  if (stores.length === 0) return null

  if (stores.length === 1) {
    return (
      <span className="text-muted-foreground text-sm">{stores[0].nom}</span>
    )
  }

  return (
    <Select
      value={activeStoreId ?? ''}
      onValueChange={(valeur) => void setActiveStore(valeur)}
    >
      <SelectTrigger className="w-56" aria-label="Boutique active">
        <SelectValue placeholder="Choisir une boutique" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((boutique) => (
          <SelectItem key={boutique.id} value={boutique.id}>
            {boutique.nom}
            {boutique.status === 'DISABLED' && ' (désactivée)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
