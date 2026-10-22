"use client"
import { Card, Empty } from "./index"
export default function FeaturePlaceholder({
  title,
  icon = "layers",
}: {
  title: string
  icon?: string
}) {
  return (
    <Card className="cm-panel">
      <Empty
        icon={icon}
        title={title}
        text="UI ONLY · Phase 1C migration pending. No entries, documents or files can be created or saved here."
      />
    </Card>
  )
}
