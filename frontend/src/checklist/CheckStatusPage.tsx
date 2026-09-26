import { ChecklistStatus } from './ChecklistStatus'
import { ClipboardCheck } from 'lucide-react'
import { PageHeader } from '../shell/PageHeader'

// The manager's view of the same thing operators see about themselves: who
// has done their startup checklist and their photo audits, for any day.
export function CheckStatusPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        icon={ClipboardCheck}
        title="Checklist & Audit Status"
        subtitle="Every operator and pump worked on a day, and which checks are on record for each - the startup checklist, the start-of-shift photo, a transfer check where somebody moved pumps, and the end-of-shift photo. Pick any past date to see how a previous shift went."
      />
      <ChecklistStatus />
    </div>
  )
}
