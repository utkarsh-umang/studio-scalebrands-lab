import { useQuery } from '@tanstack/react-query'
import { MediaService } from '@/client'

export function useMediaPlaybackQuery(assetId: string | undefined) {
  return useQuery({
    queryKey: ['media', 'playback', assetId],
    queryFn: () =>
      MediaService.getMediaPlaybackUrlApiV1MediaAssetsAssetIdPlaybackGet(assetId ?? ''),
    enabled: Boolean(assetId),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  })
}
