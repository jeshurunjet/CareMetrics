import type { ReactNode } from "react"
export default function StaffPageContainer({
  children,
  backend = false,
  fictionalDemo = false,
}: {
  children: ReactNode
  backend?: boolean
  fictionalDemo?: boolean
}) {
  return (
    <div className="cm-page">
      <p className="cm-hint">
        {fictionalDemo
          ? "Demonstration environment — fictional records."
          : backend
            ? "CONNECTED DEVELOPMENT DATA · fictional records · production attendance not enabled"
            : "DEVELOPMENT PREVIEW · fictional records · no real authentication or attendance recording"}
      </p>
      {children}
    </div>
  )
}
