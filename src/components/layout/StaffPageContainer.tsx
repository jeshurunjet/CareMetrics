import type { ReactNode } from "react"
export default function StaffPageContainer({
  children,
  backend = false,
}: {
  children: ReactNode
  backend?: boolean
}) {
  return (
    <div className="cm-page">
      <p className="cm-hint">
        {backend
          ? "CONNECTED DEVELOPMENT DATA · fictional records · attendance and documentation writes unavailable"
          : "DEVELOPMENT PREVIEW · fictional records · no real authentication or attendance recording"}
      </p>
      {children}
    </div>
  )
}
