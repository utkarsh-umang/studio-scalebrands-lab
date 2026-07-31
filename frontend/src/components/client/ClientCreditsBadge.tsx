import { Coins } from 'lucide-react'

type Props = {
  credits: number
  /** Sum of creditCost on active, not-yet-debited batches */
  reserved?: number
}

/** Compact credits pill for the page title row. */
export function ClientCreditsBadge({ credits, reserved = 0 }: Props) {
  return (
    <div className="flex min-w-[210px] shrink-0 items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3.5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Coins className="size-4.5" aria-hidden />
      </span>
      <div className="text-left">
        <div className="flex items-baseline gap-1.5">
          <p className="font-[family-name:var(--heading)] text-2xl font-bold leading-none tabular-nums text-slate-950">
            {credits}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            credits
          </p>
        </div>
        {reserved > 0 ? (
          <p className="mt-1 text-[10px] leading-snug text-slate-500">
            {reserved} reserved for active work
          </p>
        ) : null}
      </div>
    </div>
  )
}
