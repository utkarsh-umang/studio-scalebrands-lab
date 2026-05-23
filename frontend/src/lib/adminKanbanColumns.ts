import type { VideoPipelineOwner } from '@/types/pathB'

export const ADMIN_KANBAN_COLUMNS: {
  owner: VideoPipelineOwner
  label: string
}[] = [
  { owner: 'client', label: 'With client' },
  { owner: 'smm', label: 'With SMM' },
  { owner: 'editor', label: 'With editor' },
  { owner: 'scheduling', label: 'Scheduling' },
  { owner: 'done', label: 'Done' },
]
