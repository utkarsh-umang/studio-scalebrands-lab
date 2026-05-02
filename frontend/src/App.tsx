import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard'
import { ClientDashboard } from '@/pages/dashboards/ClientDashboard'
import { EditorDashboard } from '@/pages/dashboards/EditorDashboard'
import { SmmDashboard } from '@/pages/dashboards/SmmDashboard'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/LoginPage'
import { RootRedirect } from '@/pages/RootRedirect'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/client"
          element={
            <ProtectedRoute portal="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute portal="editor">
              <EditorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/smm"
          element={
            <ProtectedRoute portal="smm">
              <SmmDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute portal="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export { App }
