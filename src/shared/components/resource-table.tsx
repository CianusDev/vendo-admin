import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { useResourceList } from '#/shared/hooks/use-resource'
import { cn } from '#/shared/lib/utils'
import type { ListParams, Resource } from '#/shared/lib/resource'

/**
 * Description d'une colonne.
 *
 * `sortKey` est le nom du champ côté serveur : le tri est fait par la base,
 * pas dans le navigateur — trier une page revient à trier un échantillon.
 */
export interface ColumnDef<T> {
  key: string
  header: string
  cell: (ligne: T) => ReactNode
  sortKey?: string
  className?: string
}

interface ResourceTableProps<T> {
  resource: Resource<T, never, never>
  columns: ColumnDef<T>[]
  rowKey: (ligne: T) => string
  storeId?: string
  perPage?: number
  filter?: ListParams['filter']
  emptyMessage?: string
  actions?: (ligne: T) => ReactNode
}

/**
 * Tableau générique d'une ressource.
 *
 * Piloté par une description de colonnes : ajouter une entité au produit doit
 * coûter cette description, jamais un écran (§5.9 du cahier des charges).
 * Pagination et tri sont délégués au serveur, conformément à §5.6.
 */
export function ResourceTable<T>({
  resource,
  columns,
  rowKey,
  storeId,
  perPage = 25,
  filter,
  emptyMessage = 'Aucun élément',
  actions,
}: ResourceTableProps<T>) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string | undefined>(undefined)

  const requete = useResourceList(resource, {
    page,
    perPage,
    sort,
    filter,
    storeId,
  })

  const basculerTri = (sortKey: string) => {
    setPage(1)
    setSort((actuel) => {
      if (actuel === sortKey) return `-${sortKey}`
      if (actuel === `-${sortKey}`) return undefined
      return sortKey
    })
  }

  const iconeTri = (sortKey: string) => {
    if (sort === sortKey) return <ChevronUp className="size-3.5" />
    if (sort === `-${sortKey}`) return <ChevronDown className="size-3.5" />
    return <ChevronsUpDown className="size-3.5 opacity-40" />
  }

  if (requete.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {requete.error.message}
      </p>
    )
  }

  const lignes = requete.data?.data ?? []
  const meta = requete.data?.meta
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.perPage)) : 1

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((colonne) => (
                <th
                  key={colonne.key}
                  scope="col"
                  className={cn('px-3 py-2 text-left font-medium', colonne.className)}
                >
                  {colonne.sortKey ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline"
                      onClick={() => basculerTri(colonne.sortKey as string)}
                    >
                      {colonne.header}
                      {iconeTri(colonne.sortKey)}
                    </button>
                  ) : (
                    colonne.header
                  )}
                </th>
              ))}
              {actions && <th className="w-px px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && !requete.isLoading && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {lignes.map((ligne) => (
              <tr key={rowKey(ligne)} className="border-t">
                {columns.map((colonne) => (
                  <td
                    key={colonne.key}
                    className={cn('px-3 py-2', colonne.className)}
                  >
                    {colonne.cell(ligne)}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-2 text-right">{actions(ligne)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground" aria-live="polite">
          {requete.isFetching
            ? 'Chargement…'
            : `${meta?.total ?? 0} élément(s), page ${page} sur ${totalPages}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((actuelle) => actuelle - 1)}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((actuelle) => actuelle + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
