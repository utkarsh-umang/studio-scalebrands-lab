export const workspaceQueryKeys = {
  all: ['workspace'] as const,
  client: () => [...workspaceQueryKeys.all, 'client'] as const,
  editor: () => [...workspaceQueryKeys.all, 'editor'] as const,
  smm: () => [...workspaceQueryKeys.all, 'smm'] as const,
  admin: () => [...workspaceQueryKeys.all, 'admin'] as const,
  batch: (batchId: string) =>
    [...workspaceQueryKeys.all, 'batch', batchId] as const,
}
