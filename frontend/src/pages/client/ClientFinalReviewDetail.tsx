import { Link, useParams } from 'react-router-dom'
import { useTheme } from '@/theme'
import { ClientFinalReviewPanel } from '@/components/client/ClientFinalReviewPanel'
import { MOCK_FINAL_REVIEWS } from '@mockData/index'
import { ClientPageHeader } from './clientPageUtils'

export function ClientFinalReviewDetail() {
  const { batchId } = useParams<{ batchId: string }>()
  const { theme } = useTheme()
  const mock = batchId ? MOCK_FINAL_REVIEWS[batchId] : undefined

  if (!mock) {
    return (
      <>
        <ClientPageHeader title="Review not found" />
        <p className="text-muted-foreground text-sm">
          <Link
            to="/client/final-review"
            className="text-primary font-medium hover:underline"
          >
            ← Back to final review
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ClientPageHeader
          title={mock.batchTitle}
          subtitle="Pause the player, add timestamped notes or general feedback, then approve or request changes."
        />
        <Link
          to="/client/final-review"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← All final reviews
        </Link>
      </div>

      <ClientFinalReviewPanel mock={mock} theme={theme} />
    </>
  )
}
