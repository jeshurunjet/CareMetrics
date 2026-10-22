"use client"
import Icon from "@/components/Icon"
export default function SectionTitle({
  title,
  action,
  onAction,
  count,
}: {
  title: string
  action?: string
  onAction?: () => void
  count?: number
}) {
  return (
    <div className="cm-section-title">
      <h2>
        {title}
        {count !== undefined && <span>{count}</span>}
      </h2>
      {action && (
        <button onClick={onAction}>
          {action}
          <Icon name="chevron" size={14} />
        </button>
      )}
    </div>
  )
}
