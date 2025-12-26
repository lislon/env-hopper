import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '~/api/infra/trpc'
import { Button } from '~/ui/button'
import { authClient } from '../authClient'
import { useAuthModal } from '../AuthModalContext'

interface LoginPageProps {
  onSuccess?: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const { redirectUrl } = useAuthModal()

  const trpc = useTRPC()
  const { data: providersData } = useQuery(
    trpc.auth.getProviders.queryOptions(),
  )
  const socialProviders = providersData?.providers || []

  const handleSocialSignIn = async (provider: string) => {
    try {
      // Close modal before redirect to OAuth
      onSuccess?.()
      
      await authClient.signIn.social({
        provider,
        callbackURL: redirectUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social sign-in failed')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      {socialProviders.length > 0 && (
        <div className="flex flex-col gap-2">
          {socialProviders.map((provider: string) => (
            <Button
              key={provider}
              variant="outline"
              onClick={() => handleSocialSignIn(provider)}
              className="w-full capitalize"
            >
              {provider === 'github' && '🔗 '}
              {provider === 'google' && '🔐 '}
              {provider === 'okta' && '🏢 '}
              Sign in with {provider}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
