import { Navigate, useParams } from 'react-router-dom'

export function AdminBatchRedirect() {
  const { clientId, batchId } = useParams<{
    clientId: string
    batchId: string
  }>()
  if (!clientId || !batchId) {
    return <Navigate to="/admin" replace />
  }
  return (
    <Navigate
      to={`/admin/clients/${clientId}?batch=${encodeURIComponent(batchId)}`}
      replace
    />
  )
}
