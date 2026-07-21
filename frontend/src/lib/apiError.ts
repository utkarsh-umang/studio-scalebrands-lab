import { ApiError } from '@/client'

type ErrorBody = {
  // The shape http_exception_handler emits (app/core/errors/exceptions.py):
  // flat error_code / message / details — NOT FastAPI's default {detail}.
  message?: string
  details?: { missing?: unknown } | null
  // FastAPI's own validation errors bypass that handler and keep `detail`.
  detail?: unknown
}

/**
 * Human-readable message for a failed request.
 *
 * Without this, a rejected mutation surfaced as nothing at all: React Query
 * recorded the error and no call site ever read it.
 */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : fallback
  }
  const body = error.body as ErrorBody | undefined

  const message =
    typeof body?.message === 'string' && body.message.trim()
      ? body.message
      : typeof body?.detail === 'string' && body.detail.trim()
        ? body.detail
        : fallback

  const missing = body?.details?.missing
  if (Array.isArray(missing) && missing.length > 0) {
    return `${message} Missing: ${missing.join(', ')}.`
  }
  return message
}
