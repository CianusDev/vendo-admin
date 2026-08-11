import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import type { ZodType } from 'zod'
import type {
  DefaultValues,
  FieldValues,
  Path,
  Resolver,
} from 'react-hook-form'
import { toast } from 'sonner'
import { FormInput } from '#/shared/components/form-inputs'
import { Button } from '#/shared/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
} from '#/shared/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { Textarea } from '#/shared/components/ui/textarea'
import { ApiError } from '#/shared/lib/problem'
import logger from '#/shared/lib/logger'

export interface SelectOption {
  value: string
  label: string
}

/**
 * Description d'un champ.
 *
 * La validation ne vit pas ici mais dans le schéma zod : deux sources de
 * vérité finiraient par diverger, et c'est le schéma qui type le formulaire.
 */
export interface FieldDef<T extends FieldValues> {
  name: Path<T>
  label: string
  type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea'
  description?: string
  placeholder?: string
  options?: SelectOption[]
  /** Un champ figé après création — le code d'une boutique, par exemple. */
  disabled?: boolean
}

interface ResourceFormProps<T extends FieldValues> {
  schema: ZodType<T>
  fields: FieldDef<T>[]
  defaultValues?: DefaultValues<T>
  submitLabel?: string
  successMessage?: string
  onSubmit: (valeurs: T) => Promise<unknown>
  onSuccess?: () => void
}

/**
 * Formulaire générique d'une ressource (§5.9 du cahier des charges).
 *
 * Piloté par un schéma zod et une liste de champs : ajouter une entité coûte
 * ces deux déclarations, jamais un formulaire écrit à la main.
 *
 * Le point qui compte est le traitement des erreurs : le back-end renvoie ses
 * refus en 422 avec le détail par champ (§5.6), qui sont réinjectés sous les
 * bons libellés. Sans cela, l'utilisateur reçoit « requête invalide » sans
 * savoir quel champ corriger, alors que le serveur le lui a dit.
 */
export function ResourceForm<T extends FieldValues>({
  schema,
  fields,
  defaultValues,
  submitLabel = 'Enregistrer',
  successMessage = 'Enregistré',
  onSubmit,
  onSuccess,
}: ResourceFormProps<T>) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<T>({
    // Le resolver est typé pour un schéma concret ; ici le schéma est
    // générique, et seul l'appelant connaît sa forme exacte. Le typage réel
    // est assuré à l'appel, par `ZodType<T>`.
    resolver: standardSchemaResolver(
      schema as never,
    ) as unknown as Resolver<T>,
    defaultValues,
  })

  /**
   * `setValue` est typé par champ, ce qu'on ne peut pas exprimer ici : le nom
   * du champ n'est connu qu'à l'exécution. Un seul assouplissement, à cet
   * endroit, plutôt qu'une assertion à chaque appel.
   */
  const definirValeur = setValue as (
    name: Path<T>,
    value: unknown,
    options?: { shouldValidate?: boolean },
  ) => void

  const soumettre = async (valeurs: T) => {
    try {
      await onSubmit(valeurs)
      toast.success(successMessage)
      onSuccess?.()
    } catch (error) {
      if (error instanceof ApiError && error.isValidation) {
        for (const [champ, message] of Object.entries(error.fieldErrors)) {
          setError(champ as Path<T>, { message })
        }
        return
      }
      if (error instanceof ApiError) {
        toast.error(error.message)
        return
      }
      logger.error('Enregistrement impossible', error)
      toast.error('Une erreur inattendue est survenue')
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(soumettre)(event)}
    >
      {fields.map((champ) => {
        const message = errors[champ.name]?.message as string | undefined

        if (champ.type === 'select') {
          return (
            <Field key={String(champ.name)} data-invalid={message ? true : undefined}>
              <FieldLabel>{champ.label}</FieldLabel>
              <Select
                disabled={champ.disabled}
                value={(watch(champ.name) as string | undefined) ?? ''}
                onValueChange={(valeur) =>
                  definirValeur(champ.name, valeur, { shouldValidate: true })
                }
              >
                <SelectTrigger aria-invalid={!!message}>
                  <SelectValue placeholder={champ.placeholder ?? 'Choisir…'} />
                </SelectTrigger>
                <SelectContent>
                  {champ.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {message && <FieldError>{message}</FieldError>}
            </Field>
          )
        }

        if (champ.type === 'textarea') {
          return (
            <Field key={String(champ.name)} data-invalid={message ? true : undefined}>
              <FieldLabel>{champ.label}</FieldLabel>
              <Textarea
                aria-invalid={!!message}
                disabled={champ.disabled}
                placeholder={champ.placeholder}
                {...register(champ.name)}
              />
              {message && <FieldError>{message}</FieldError>}
            </Field>
          )
        }

        return (
          <FormInput
            key={String(champ.name)}
            label={champ.label}
            type={champ.type ?? 'text'}
            description={champ.description}
            placeholder={champ.placeholder}
            disabled={champ.disabled}
            error={message}
            {...register(champ.name, {
              valueAsNumber: champ.type === 'number',
            })}
          />
        )
      })}

      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
