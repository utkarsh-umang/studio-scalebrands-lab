import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AdminBatchRedirect } from '@/pages/admin/AdminBatchRedirect'
import { AdminClientDetail } from '@/pages/admin/AdminClientDetail'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminAddEmployees } from '@/pages/admin/AdminAddEmployees'
import { AdminDeadlines } from '@/pages/admin/AdminDeadlines'
import { AdminWorkspace } from '@/pages/admin/AdminWorkspace'
import { EditorBoard } from '@/pages/editor/EditorBoard'
import { EditorCompleted } from '@/pages/editor/EditorCompleted'
import { EditorLayout } from '@/pages/editor/EditorLayout'
import { ClientAllWork } from '@/pages/client/ClientAllWork'
import { ClientBoard } from '@/pages/client/ClientBoard'
import { ClientLayout } from '@/pages/client/ClientLayout'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/LoginPage'
import { RootRedirect } from '@/pages/RootRedirect'
import { SmmBoard } from '@/pages/smm/SmmBoard'
import { SmmCompleted } from '@/pages/smm/SmmCompleted'
import { SmmLayout } from '@/pages/smm/SmmLayout'
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
          <Route index element={<Navigate to="board" replace />} />
          <Route path="board" element={<ClientBoard />} />
          <Route path="all" element={<ClientAllWork />} />
          <Route path="overview" element={<Navigate to="/client/board" replace />} />
          <Route path="batches" element={<Navigate to="/client/board" replace />} />
          <Route path="batches/:batchId" element={<Navigate to="/client/board" replace />} />
          <Route path="ideas" element={<Navigate to="/client/board" replace />} />
          <Route path="ideas/:batchId" element={<Navigate to="/client/board" replace />} />
          <Route path="thumbnails" element={<Navigate to="/client/board" replace />} />
          <Route path="thumbnails/:batchId" element={<Navigate to="/client/board" replace />} />
          <Route path="final-review" element={<Navigate to="/client/board" replace />} />
          <Route path="final-review/:batchId" element={<Navigate to="/client/board" replace />} />
          <Route path="our-work" element={<Navigate to="/client/all" replace />} />
        </Route>
        <Route
          path="/editor"
          element={
            <ProtectedRoute portal="editor">
              <EditorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="board" replace />} />
          <Route path="board" element={<EditorBoard />} />
          <Route path="completed" element={<EditorCompleted />} />
          <Route path="overview" element={<Navigate to="/editor/board" replace />} />
          <Route path="tasks" element={<Navigate to="/editor/board" replace />} />
          <Route path="qa" element={<Navigate to="/editor/board" replace />} />
          <Route path="tasks/:taskId" element={<Navigate to="/editor/board" replace />} />
        </Route>
        <Route
          path="/smm"
          element={
            <ProtectedRoute portal="smm">
              <SmmLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="board" replace />} />
          <Route path="board" element={<SmmBoard />} />
          <Route path="completed" element={<SmmCompleted />} />
          <Route path="overview" element={<Navigate to="/smm/board" replace />} />
          <Route path="clips" element={<Navigate to="/smm/board" replace />} />
          <Route path="clips/:batchId" element={<Navigate to="/smm/board" replace />} />
          <Route path="ideas" element={<Navigate to="/smm/board" replace />} />
          <Route path="ideas/:batchId" element={<Navigate to="/smm/board" replace />} />
          <Route path="titles" element={<Navigate to="/smm/board" replace />} />
          <Route path="titles/:batchId" element={<Navigate to="/smm/board" replace />} />
          <Route path="qa" element={<Navigate to="/smm/board" replace />} />
          <Route path="qa/:taskId" element={<Navigate to="/smm/board" replace />} />
          <Route path="scheduling" element={<Navigate to="/smm/board" replace />} />
          <Route
            path="scheduling/:batchId"
            element={<Navigate to="/smm/board" replace />}
          />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute portal="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminWorkspace />} />
          <Route path="clients/:clientId" element={<AdminClientDetail />} />
          <Route
            path="clients/:clientId/batches/:batchId"
            element={<AdminBatchRedirect />}
          />
          <Route path="clients" element={<Navigate to="/admin" replace />} />
          <Route path="employees" element={<AdminAddEmployees />} />
          <Route path="deadlines" element={<AdminDeadlines />} />
          <Route path="overview" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export { App }
