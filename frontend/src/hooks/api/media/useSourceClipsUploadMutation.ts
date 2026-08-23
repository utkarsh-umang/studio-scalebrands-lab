import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientService, MediaService } from '@/client'
import { workspaceQueryKeys } from '@/hooks/api/workspace/workspaceQueryKeys'
import { putPresignedFile } from '@/lib/putPresignedFile'

const MAX_CONCURRENT_UPLOADS = 3

export type SourceClipUploadProgress = {
  percent: number
  status: 'waiting' | 'uploading' | 'complete'
}

export function useSourceClipsUploadMutation(batchId: string) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<SourceClipUploadProgress[]>([])

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      setProgress(
        files.map(() => ({ percent: 0, status: 'waiting' as const })),
      )
      const prepared =
        await ClientService.prepareSourceClipUploadsApiV1ClientBatchesBatchIdSourceClipsPreparePost(
          batchId,
          {
            files: files.map((file) => ({
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
              sizeBytes: file.size,
            })),
          },
        )

      let nextUpload = 0
      async function worker() {
        while (nextUpload < prepared.uploads.length) {
          const index = nextUpload
          nextUpload += 1
          const item = prepared.uploads[index]
          const file = files[index]
          setProgress((current) =>
            current.map((value, itemIndex) =>
              itemIndex === index
                ? { ...value, status: 'uploading' }
                : value,
            ),
          )
          await putPresignedFile(
            item.upload.uploadUrl,
            file,
            item.upload.uploadHeaders,
            (percent) => {
              setProgress((current) =>
                current.map((value, itemIndex) =>
                  itemIndex === index
                    ? { percent, status: 'uploading' }
                    : value,
                ),
              )
            },
          )
          await MediaService.completeMediaUploadApiV1MediaUploadsAssetIdCompletePost(
            item.upload.asset.id,
            {},
          )
          setProgress((current) =>
            current.map((value, itemIndex) =>
              itemIndex === index
                ? { percent: 100, status: 'complete' }
                : value,
            ),
          )
        }
      }

      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_UPLOADS, prepared.uploads.length) },
          () => worker(),
        ),
      )
      return ClientService.finalizeSourceClipUploadsApiV1ClientBatchesBatchIdSourceClipsFinalizePost(
        batchId,
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
    },
  })

  function resetUpload() {
    setProgress([])
    mutation.reset()
  }

  return { ...mutation, progress, reset: resetUpload }
}
