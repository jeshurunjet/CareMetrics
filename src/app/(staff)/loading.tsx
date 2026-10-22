import { Skeleton } from "@/modules/staff/ui"
export default function Loading() {
  return (
    <div aria-label="Loading staff page" role="status">
      <Skeleton rows={4} />
    </div>
  )
}
