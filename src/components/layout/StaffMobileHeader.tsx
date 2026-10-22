"use client"
import Icon from "@/components/Icon"
export default function StaffMobileHeader({
  unread,
  top,
}: {
  unread: number
  top: (page: string) => void
}) {
  return (
    <header className="cm-mobile-header">
      <button className="cm-mobile-brand" onClick={() => top("home")}>
        <span className="cm-logo">
          <Icon name="logo" size={15} />
        </span>
        CareMetrics
      </button>
      <div>
        <button
          className="cm-icon-btn"
          onClick={() => top("clock")}
          aria-label="Clock-in / My Shifts"
        >
          <Icon name="clock" size={19} />
        </button>
        <button
          className="cm-icon-btn"
          onClick={() => top("notifications")}
          aria-label={`Notifications, ${unread} unread`}
        >
          <Icon name="bell" size={19} />
          {unread > 0 && <b className="cm-dot-badge">{unread}</b>}
        </button>
      </div>
    </header>
  )
}
