import { useState, useTransition } from 'react'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormInput } from '#/shared/components/form-inputs'
import { Button } from '#/shared/components/ui/button'
import { ApiError } from '#/shared/lib/problem'
import logger from '#/shared/lib/logger'
import { LoginSchema } from '../auth.schemas'
import { completeMfa, signIn } from '../auth.service'
import { isMfaChallenge } from '../auth.types'
import type { LoginDto } from '../auth.types'

/**
 * Connexion en une ou deux étapes.
 *
 * Le back-end ne pose aucun cookie tant que le second facteur n'est pas
 * présenté : tant qu'un ticket est en main, l'utilisateur n'est pas connecté.
 */
export function LoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ticket, setTicket] = useState<string | null>(null)
  const [code, setCode] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: standardSchemaResolver(LoginSchema),
  })

  const entrer = () => {
    void router.invalidate().then(() => router.navigate({ to: '/dashboard' }))
  }

  const traiterErreur = (error: unknown, defaut: string) => {
    if (error instanceof ApiError) {
      if (error.isValidation) {
        for (const [champ, message] of Object.entries(error.fieldErrors)) {
          setError(champ as keyof LoginDto, { message })
        }
        return
      }
      toast.error(error.message || defaut)
      return
    }
    logger.error('Connexion impossible', error)
    toast.error(defaut)
  }

  const onSubmit = (payload: LoginDto) => {
    startTransition(async () => {
      try {
        const resultat = await signIn(payload)

        if (isMfaChallenge(resultat)) {
          setTicket(resultat.ticket)
          return
        }

        entrer()
      } catch (error) {
        traiterErreur(error, 'Identifiants incorrects')
      }
    })
  }

  const onValiderCode = () => {
    if (!ticket) return
    startTransition(async () => {
      try {
        await completeMfa(ticket, code)
        entrer()
      } catch (error) {
        traiterErreur(error, 'Code invalide')
      }
    })
  }

  if (ticket) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Saisissez le code de votre application d'authentification, ou l'un de
          vos codes de secours.
        </p>
        <FormInput
          label="Code"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <Button
          className="w-full"
          disabled={isPending || code.length === 0}
          onClick={onValiderCode}
        >
          Valider
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormInput
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button className="w-full" type="submit" disabled={isPending}>
        Se connecter
      </Button>
    </form>
  )
}
