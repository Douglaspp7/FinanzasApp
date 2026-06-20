import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth()
  const { loading: bizLoading, onboardingComplete } = useBusiness()

  if (authLoading || bizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col gap-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth/sign-in" replace />
  if (!onboardingComplete) return <Navigate to="/auth/onboarding" replace />
  return <Outlet />
}

export function AuthRoute() {
  const { user, loading } = useAuth()
  const { onboardingComplete, loading: bizLoading } = useBusiness()
  if (loading || bizLoading) return null
  if (user && onboardingComplete) return <Navigate to="/app" replace />
  if (user && !onboardingComplete) return <Navigate to="/auth/onboarding" replace />
  return <Outlet />
}
