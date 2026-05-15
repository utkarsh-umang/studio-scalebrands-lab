import {
  DriveVideoPreview,
  type DriveVideoLayout,
} from '@/components/drive/DriveVideoPreview'
import { qaPortraitChromeClass } from '@/lib/qaVideoPortrait'

type Props = {
  driveFileId: string
  fileName?: string
  layout?: DriveVideoLayout
}

/**
 * Thin wrapper around `DriveVideoPreview` that adds the standard QA chrome.
 *
 * Historically this component tried to hit a proxied `<video>` stream first
 * and fell back to the Drive `/preview` iframe on error. That backend path is
 * gone — we always render the iframe now. The wrapper is kept (rather than
 * inlining everywhere) so callers like `EditorQaFixModal`, `SmmVideoQaModal`,
 * and `ClientFinalVideoReviewModal` keep their existing import shape.
 */
export function DriveOrStreamVideo({ driveFileId, fileName, layout = 'portrait' }: Props) {
  return (
    <div className={qaPortraitChromeClass}>
      <DriveVideoPreview driveFileId={driveFileId} fileName={fileName} layout={layout} />
    </div>
  )
}
