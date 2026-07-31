import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import type { AuthUser } from '@/auth/types'
import type { NotificationItemDto } from '@/client'
import { DeadlineChip } from '@/components/path-b/DeadlineChip'
import {
  useMarkNotificationsSeenMutation,
  useNotificationsQuery,
} from '@/hooks/api/notifications/useNotificationsQuery'

function boardBase(user: AuthUser): string {
  if (user.role === 'client') return '/client/board'
  if (user.role === 'employee' && user.employeeKind === 'smm') return '/smm/board'
  if (user.role === 'employee' && user.employeeKind === 'editor') return '/editor/board'
  return '/admin'
}

function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

type Props = {
  variant?: 'default' | 'sidebar'
}

export function NotificationBell({ variant = 'default' }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data } = useNotificationsQuery(!!user)
  const markSeen = useMarkNotificationsSeenMutation()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)

  const items = data?.items ?? []
  const unread = data?.unreadCount ?? 0
  const open = anchor !== null

  // Admin has the pipeline overview instead of a personal inbox.
  if (!user || user.role === 'admin') return null

  const toggle = () => {
    if (open) {
      setAnchor(null)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    setAnchor(rect ? { top: rect.bottom + 6, left: rect.left } : { top: 60, left: 12 })
    if (unread > 0) markSeen.mutate()
  }

  const openItem = (item: NotificationItemDto) => {
    setAnchor(null)
    const base = boardBase(user)
    navigate(user.role === 'client' ? `${base}?openVideo=${item.id}` : base)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className={[
          'relative flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors md:w-full',
          variant === 'sidebar'
            ? 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent',
        ].join(' ')}
      >
        <span className="relative flex">
          <Bell className="size-3.5 shrink-0" aria-hidden />
          {unread > 0 ? (
            <span className="bg-destructive absolute -right-1.5 -top-1.5 flex min-w-[15px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-[14px] text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </span>
        Notifications
      </button>

      {open
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                onMouseDown={() => {
                  setAnchor(null)
                }}
                aria-hidden
              />
              <div
                className="border-border bg-background fixed z-50 max-h-[70vh] w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border shadow-lg"
                style={{ top: anchor.top, left: anchor.left }}
              >
                <div className="border-border flex items-center justify-between border-b px-3.5 py-2.5">
                  <p className="text-foreground text-sm font-semibold">Waiting on you</p>
                  <span className="text-muted-foreground text-xs">{items.length}</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-muted-foreground px-3.5 py-6 text-center text-sm">
                      You're all caught up — nothing needs you right now.
                    </p>
                  ) : (
                    items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          openItem(item)
                        }}
                        className="hover:bg-muted/50 border-border/60 flex w-full flex-col items-start gap-0.5 border-b px-3.5 py-2.5 text-left last:border-b-0"
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-foreground text-sm font-medium">{item.message}</span>
                          {item.deadlineAt ? <DeadlineChip deadlineAt={item.deadlineAt} /> : null}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {item.batchTitle} · {relativeTime(item.since)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}
