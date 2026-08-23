import { useMutation } from '@tanstack/react-query'
import { MediaAssetKind, MediaService } from '@/client'
import { putPresignedFile } from '@/lib/putPresignedFile'

export type UploadedQaAttachment = {
  assetId: string
  fileName: string
  contentType: string
}

export function useQaAttachmentUploadMutation(videoTicketId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadedQaAttachment> => {
      const initiated =
        await MediaService.initiateMediaUploadApiV1MediaVideosVideoTicketIdUploadsPost(
          videoTicketId,
          {
            kind: MediaAssetKind.QA_ATTACHMENT,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        )
      await putPresignedFile(initiated.uploadUrl, file, initiated.uploadHeaders, () => {})
      const completed =
        await MediaService.completeMediaUploadApiV1MediaUploadsAssetIdCompletePost(
          initiated.asset.id,
          {},
        )
      return {
        assetId: completed.asset.id,
        fileName: completed.asset.originalFilename,
        contentType: completed.asset.contentType,
      }
    },
  })
}
