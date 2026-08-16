import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MediaAssetKind, MediaService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'

type UploadInput = {
  file: File
  kind: 'video' | 'thumbnail'
}

function putFile(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    Object.entries(headers).forEach(([key, value]) => request.setRequestHeader(key, value))
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error('The upload connection was interrupted.'))
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error(`Storage rejected the upload (${request.status}).`))
    }
    request.send(file)
  })
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
      await putFile(
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
