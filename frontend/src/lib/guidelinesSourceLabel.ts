import type { BrandGuidelinesSource } from '@/types/pathB'

export function guidelinesSourceLabel(source: BrandGuidelinesSource): string {
  switch (source) {
    case 'google_doc':
      return 'Google Doc'
    case 'client':
      return 'Client-provided'
    case 'internal':
      return 'Scale Brands Lab'
  }
}
