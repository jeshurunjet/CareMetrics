import type { ReactNode } from "react"
export default function StaffPageContainer({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="cm-page">
      <p className="cm-hint">
        DEVELOPMENT PREVIEW · fictional records · no real authentication or
        attendance recording
      </p>
      {children}
    </div>
  )
}
