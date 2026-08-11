import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { StoreForm } from '#/features/stores/components/store-form'
import { storesResource } from '#/features/stores/stores.service'
import type { Store } from '#/features/stores/stores.types'
import { ResourceTable } from '#/shared/components/resource-table'
import type { ColumnDef } from '#/shared/components/resource-table'
import { Button } from '#/shared/components/ui/button'
import { useAuth } from '#/shared/providers/auth-provider'

export const Route = createFileRoute('/_authenticated/stores')({
  component: PageBoutiques,
})

/**
 * Le coût d'un écran de liste, une fois la couche en place : une description
 * de colonnes. Pas de service, pas de hook, pas de pagination à recâbler.
 */
const colonnes: ColumnDef<Store>[] = [
  {
    key: 'nom',
    header: 'Nom',
    sortKey: 'nom',
    cell: (boutique) => <span className="font-medium">{boutique.nom}</span>,
  },
  {
    key: 'code',
    header: 'Code',
    sortKey: 'code',
    cell: (boutique) => (
      <code className="text-muted-foreground text-xs">{boutique.code}</code>
    ),
  },
  {
    key: 'pays',
    header: 'Pays',
    cell: (boutique) => boutique.pays,
  },
  {
    key: 'devise',
    header: 'Devise',
    cell: (boutique) => boutique.devise,
  },
  {
    key: 'status',
    header: 'Statut',
    cell: (boutique) =>
      boutique.status === 'ACTIVE' ? 'Active' : 'Désactivée',
  },
]

function PageBoutiques() {
  const { can } = useAuth()
  const [creation, setCreation] = useState(false)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Boutiques</h1>
        {/* Le masquage est un confort : le back-end refuse de toute façon. */}
        {can('stores.create') && (
          <Button onClick={() => setCreation((ouvert) => !ouvert)}>
            {creation ? 'Annuler' : 'Nouvelle boutique'}
          </Button>
        )}
      </header>

      {creation && (
        <section className="rounded-md border p-4">
          <StoreForm onCreated={() => setCreation(false)} />
        </section>
      )}

      <ResourceTable
        resource={storesResource}
        columns={colonnes}
        rowKey={(boutique) => boutique.id}
        emptyMessage="Aucune boutique pour l'instant"
      />
    </div>
  )
}
