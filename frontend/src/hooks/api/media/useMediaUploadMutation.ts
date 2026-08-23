import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MediaAssetKind, MediaService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'
import { putPresignedFile } from '@/lib/putPresignedFile'

type UploadInput = {
  file: File
  kind: 'video' | 'thumbnail'
}

export function useMediaUploadMutation(videoTicketId: string) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const mutation = useMutation({
    mutationFn: async ({ file, kind }: UploadInput) => {
      setProgress(0)
      const initiated =
        await MediaService.initiateMediaUploadApiV1MediaVideosVideoTicketIdUploadsPost(
          videoTicketId,
          {
            kind: kind === 'video' ? MediaAssetKind.VIDEO : MediaAssetKind.THUMBNAIL,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
        )
      await putPresignedFile(
        initiated.uploadUrl,
        file,
        initiated.uploadHeaders,
        setProgress,
      )
      const completed =
        await MediaService.completeMediaUploadApiV1MediaUploadsAssetIdCompletePost(
          initiated.asset.id,
          {},
        )
      setProgress(100)
      return completed.asset
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })
  return { ...mutation, progress }
}
