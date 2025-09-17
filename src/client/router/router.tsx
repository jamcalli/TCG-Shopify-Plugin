import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const DashboardPage = lazy(() => import('@/features/dashboard'))

const LoadingFallback = () => <div>Loading...</div>

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DashboardPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DashboardPage />
      </Suspense>
    ),
  },
])
