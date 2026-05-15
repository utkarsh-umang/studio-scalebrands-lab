import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ScrollToTop } from '@/components/ScrollToTop'
import { AdminBatchRedirect } from '@/pages/admin/AdminBatchRedirect'
import { AdminClientDetail } from '@/pages/admin/AdminClientDetail'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminWorkspace } from '@/pages/admin/AdminWorkspace'
import { EditorLayout } from '@/pages/editor/EditorLayout'
import { EditorOverview } from '@/pages/editor/EditorOverview'
import { EditorTaskDetail } from '@/pages/editor/EditorTaskDetail'
import { EditorTasksList } from '@/pages/editor/EditorTasksList'
import { ClientAllWork } from '@/pages/client/ClientAllWork'
import { ClientBoard } from '@/pages/client/ClientBoard'
import { ClientLayout } from '@/pages/client/ClientLayout'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/LoginPage'
import { RootRedirect } from '@/pages/RootRedirect'
import { SmmClipBatchDetail } from '@/pages/smm/SmmClipBatchDetail'
import { SmmClipsList } from '@/pages/smm/SmmClipsList'
import { SmmIdeaDetail } from '@/pages/smm/SmmIdeaDetail'
import { SmmIdeasList } from '@/pages/smm/SmmIdeasList'
import { SmmLayout } from '@/pages/smm/SmmLayout'
import { SmmOverview } from '@/pages/smm/SmmOverview'
import { SmmQaDetail } from '@/pages/smm/SmmQaDetail'
import { SmmQaList } from '@/pages/smm/SmmQaList'
import { SmmScheduleDetail } from '@/pages/smm/SmmScheduleDetail'
import { SmmSchedulingList } from '@/pages/smm/SmmSchedulingList'
import { SmmTitleDetail } from '@/pages/smm/SmmTitleDetail'
import { SmmTitlesList } from '@/pages/smm/SmmTitlesList'
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
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<EditorOverview />} />
          <Route path="tasks" element={<EditorTasksList />} />
          <Route path="qa" element={<EditorTasksList />} />
          <Route path="tasks/:taskId" element={<EditorTaskDetail />} />
        </Route>
        <Route
          path="/smm"
          element={
            <ProtectedRoute portal="smm">
              <SmmLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SmmOverview />} />
          <Route path="clips" element={<SmmClipsList />} />
          <Route path="clips/:batchId" element={<SmmClipBatchDetail />} />
          <Route path="ideas" element={<SmmIdeasList />} />
          <Route path="ideas/:batchId" element={<SmmIdeaDetail />} />
          <Route path="titles" element={<SmmTitlesList />} />
          <Route path="titles/:batchId" element={<SmmTitleDetail />} />
          <Route path="qa" element={<SmmQaList />} />
          <Route path="qa/:taskId" element={<SmmQaDetail />} />
          <Route path="scheduling" element={<SmmSchedulingList />} />
          <Route
            path="scheduling/:batchId"
            element={<SmmScheduleDetail />}
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
          <Route path="deadlines" element={<Navigate to="/admin" replace />} />
          <Route path="overview" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export { App }
