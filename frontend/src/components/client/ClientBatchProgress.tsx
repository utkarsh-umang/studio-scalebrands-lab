import { Check, Circle } from 'lucide-react'
import type { AdminBatchFolder } from '@/types/pathB'
import { batchNeedsClientIntake } from '@/lib/clientBoard'

const STEPS = ['Kickoff', 'Clip selection', 'Production', 'Your review', 'Published']

function currentStep(batch: AdminBatchFolder): number {
  if (batch.status === 'completed' || batch.pipelineStage === 'completed') return 4
  if (batch.pipelineStage === 'scheduling') return 4
  if (batch.pipelineStage === 'client_qa') return 3
  if (
    [
      'pre_split_production',
      'clips_ready_intake',
      'production',
      'smm_qa',
      'editor_fix',
      'revision_via_smm',
    ].includes(
      batch.pipelineStage ?? '',
    ) ||
    batch.clipReviewPhase === 'approved' ||
    batch.editorDeliverablesDriveUrl?.trim()
  ) {
    return 2
  }
  if (
    ['clips_identifying', 'clip_client_review', 'idea_research', 'idea_review'].includes(
      batch.pipelineStage ?? '',
    ) ||
    batch.clipReviewPhase
  ) {
    return 1
  }
  return batchNeedsClientIntake(batch) ? 0 : 1
}

export function ClientBatchProgress({ batch }: { batch: AdminBatchFolder }) {
  const active = currentStep(batch)

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[620px] items-center">
        {STEPS.map((step, index) => {
          const complete = index < active
          const current = index === active
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                    complete
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : current
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100'
                        : 'border-slate-200 bg-white text-slate-400',
                  ].join(' ')}
                >
                  {complete ? (
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  ) : current ? (
                    index + 1
                  ) : (
                    <Circle className="size-2.5 fill-current" aria-hidden />
                  )}
                </span>
                <span
                  className={[
                    'whitespace-nowrap text-[11px] font-semibold',
                    current
                      ? 'text-slate-950'
                      : complete
                        ? 'text-slate-700'
                        : 'text-slate-400',
                  ].join(' ')}
                >
                  {step}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  className={[
                    'mx-3 h-px min-w-6 flex-1',
                    index < active ? 'bg-blue-500' : 'bg-slate-200',
                  ].join(' ')}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
