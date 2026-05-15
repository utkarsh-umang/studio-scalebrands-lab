import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { OpenAPI } from '@/client'
import { apiBaseUrl } from '@/config/api'
import { App } from './App'
import { MockAuthProvider } from '@/auth'
import { AdminWorkspaceProvider } from '@/pages/admin/adminWorkspaceStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from '@/theme'
import './index.css'

OpenAPI.BASE = apiBaseUrl

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeProvider>
            <MockAuthProvider>
              <AdminWorkspaceProvider>
                <App />
              </AdminWorkspaceProvider>
            </MockAuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
