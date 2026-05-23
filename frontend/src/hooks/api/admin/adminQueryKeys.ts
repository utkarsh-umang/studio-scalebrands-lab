export const adminQueryKeys = {
  all: ['admin'] as const,
  clients: () => [...adminQueryKeys.all, 'clients'] as const,
  client: (clientId: string) => [...adminQueryKeys.all, 'client', clientId] as const,
  batches: (clientId: string) =>
    [...adminQueryKeys.all, 'batches', clientId] as const,
  videos: (clientId: string, batchId: string) =>
    [...adminQueryKeys.all, 'videos', clientId, batchId] as const,
  staff: () => [...adminQueryKeys.all, 'staff'] as const,
  pipeline: () => [...adminQueryKeys.all, 'pipeline'] as const,
}
