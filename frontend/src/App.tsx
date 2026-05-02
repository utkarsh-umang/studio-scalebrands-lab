import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AdminClients } from '@/pages/admin/AdminClients'
import { AdminDeadlines } from '@/pages/admin/AdminDeadlines'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { EditorDashboard } from '@/pages/dashboards/EditorDashboard'
import { SmmDashboard } from '@/pages/dashboards/SmmDashboard'
import { ClientBatchDetail } from '@/pages/client/ClientBatchDetail'
import { ClientBatchesList } from '@/pages/client/ClientBatchesList'
import { ClientFinalReviewDetail } from '@/pages/client/ClientFinalReviewDetail'
import { ClientFinalReviewList } from '@/pages/client/ClientFinalReviewList'
import { ClientIdeaDetail } from '@/pages/client/ClientIdeaDetail'
import { ClientIdeasList } from '@/pages/client/ClientIdeasList'
import { ClientLayout } from '@/pages/client/ClientLayout'
import { ClientOurWork } from '@/pages/client/ClientOurWork'
import { ClientOverview } from '@/pages/client/ClientOverview'
import { ClientThumbnailDetail } from '@/pages/client/ClientThumbnailDetail'
import { ClientThumbnailsList } from '@/pages/client/ClientThumbnailsList'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/LoginPage'
import { RootRedirect } from '@/pages/RootRedirect'
import { Navigate, Route, Routes } from 'react-router-dom'

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
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="overview" replace />}
          />
          <Route path="overview" element={<ClientOverview />} />
          <Route path="batches" element={<ClientBatchesList />} />
          <Route path="batches/:batchId" element={<ClientBatchDetail />} />
          <Route path="ideas" element={<ClientIdeasList />} />
          <Route path="ideas/:batchId" element={<ClientIdeaDetail />} />
          <Route path="thumbnails" element={<ClientThumbnailsList />} />
          <Route
            path="thumbnails/:batchId"
            element={<ClientThumbnailDetail />}
          />
          <Route path="final-review" element={<ClientFinalReviewList />} />
          <Route
            path="final-review/:batchId"
            element={<ClientFinalReviewDetail />}
          />
          <Route path="our-work" element={<ClientOurWork />} />
        </Route>
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
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="deadlines" element={<AdminDeadlines />} />
        </Route>
      </Routes>
    </>
  )
}

export { App }
