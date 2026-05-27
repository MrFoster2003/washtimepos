'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const roleRedirect: Record<Role, string> = {
  [Role.ADMIN]: '/admin/dashboard',
  [Role.SUPERVISOR]: '/supervisor/dashboard',
  [Role.CASHIER]: '/cashier/pos',
  [Role.WASHER]: '/employee/dashboard',
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get('redirectTo') || roleRedirect[user.role]
      router.replace(redirectTo)
    }
  }, [user, router, searchParams])

  async function onSubmit(data: LoginForm) {
    setError(null)

    const supabase = createBrowserClient()

    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Invalid email or password'
        : authError.message)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('An unexpected error occurred. Please try again.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, company_id, roles!inner(name)')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      setError('Account not found. Contact your administrator.')
      return
    }

    const roleName = (profile.roles as { name: string }).name as Role

    if (!roleRedirect[roleName]) {
      setError('Invalid role assigned. Contact your administrator.')
      return
    }

    setUser({
      id: profile.id,
      name: profile.name,
      role: roleName,
      company_id: profile.company_id,
    })

    const redirectTo = searchParams.get('redirectTo') || roleRedirect[roleName]
    router.replace(redirectTo)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">WashTime</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
