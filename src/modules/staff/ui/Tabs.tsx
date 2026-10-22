"use client"
import { useId } from "react"
import Icon from "@/components/Icon"
export interface StaffTab {
  id: string
  label: string
  icon?: string
  count?: number
}
export default function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: StaffTab[]
  value: string
  onChange: (tab: string) => void
  label: string
}) {
  const id = useId()
  return (
    <div className="cm-tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          id={`${id}-${t.id}`}
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          className={value === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            let n = i
            if (e.key === "ArrowRight") n = (i + 1) % tabs.length
            else if (e.key === "ArrowLeft")
              n = (i - 1 + tabs.length) % tabs.length
            else if (e.key === "Home") n = 0
            else if (e.key === "End") n = tabs.length - 1
            else return
            e.preventDefault()
            const next = tabs[n]
            document.getElementById(`${id}-${next.id}`)?.focus()
            onChange(next.id)
          }}
        >
          {t.icon && <Icon name={t.icon} size={16} />} {t.label}
          {t.count !== undefined && <span>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
