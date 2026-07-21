import { ApiError } from '@/client'

/**
 * Human-readable message for a failed mutation.
 *
 * The backend raises HTTPException with a dict detail — see
 * app/core/errors/exceptions.py — so the useful text is at body.detail.message,
 * with body.detail.missing listing unmet deliverables on a readiness 422.
 * Without this, a rejected request surfaced as nothing at all in the UI.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : fallback
  }
  const detail = (error.body as { detail?: unknown } | undefined)?.detail

  if (typeof detail === 'string') return detail

  if (detail && typeof detail === 'object') {
    const { message, missing } = detail as { message?: string; missing?: unknown }
    const base = typeof message === 'string' && message.trim() ? message : fallback
    if (Array.isArray(missing) && missing.length > 0) {
      return `${base} Missing: ${missing.join(', ')}.`
    }
    return base
  }

  return error.message || fallback
}
