import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { BusinessProvider } from '@/contexts/BusinessContext'
import { ToastProvider } from '@/components/ui/Toast'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, AuthRoute } from '@/components/shared/ProtectedRoute'
import { Skeleton } from '@/components/ui/Skeleton'

const LandingPage    = lazy(() => import('@/pages/landing/LandingPage'))
const SignInPage     = lazy(() => import('@/pages/auth/SignInPage'))
const SignUpPage     = lazy(() => import('@/pages/auth/SignUpPage'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'))
const DashboardPage  = lazy(() => import('@/pages/app/DashboardPage'))
const AgendaPage     = lazy(() => import('@/pages/app/AgendaPage'))
const ClientsPage    = lazy(() => import('@/pages/app/ClientsPage'))
const ServicesPage   = lazy(() => import('@/pages/app/ServicesPage'))
const ProductsPage   = lazy(() => import('@/pages/app/ProductsPage'))
const FinancialPage  = lazy(() => import('@/pages/app/FinancialPage'))
const ReportsPage    = lazy(() => import('@/pages/app/ReportsPage'))
const SettingsPage   = lazy(() => import('@/pages/app/SettingsPage'))
const AdminPage      = lazy(() => import('@/pages/admin/AdminPage'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-3 w-48">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BusinessProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route element={<AuthRoute />}>
                      <Route path="/auth/sign-in"         element={<SignInPage />} />
                      <Route path="/auth/sign-up"         element={<SignUpPage />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    </Route>
                    <Route path="/auth/onboarding" element={<OnboardingPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AppLayout />}>
                        <Route path="/app"           element={<DashboardPage />} />
                        <Route path="/app/agenda"    element={<AgendaPage />} />
                        <Route path="/app/clients"   element={<ClientsPage />} />
                        <Route path="/app/services"  element={<ServicesPage />} />
                        <Route path="/app/products"  element={<ProductsPage />} />
                        <Route path="/app/financial" element={<FinancialPage />} />
                        <Route path="/app/reports"   element={<ReportsPage />} />
                        <Route path="/app/settings"  element={<SettingsPage />} />
                        <Route path="/admin"         element={<AdminPage />} />
                      </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </BusinessProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
