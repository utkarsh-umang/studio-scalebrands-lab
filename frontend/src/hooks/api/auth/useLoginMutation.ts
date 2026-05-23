import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthService, type LoginRequest } from '@/client'

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => AuthService.loginApiV1AuthLoginPost(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
