"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import { PageHeader, Btn, Banner } from "../ui"
import Tabs from "../ui/Tabs"
import {
  contextName,
  getMyConcerns,
  queryConcerns,
  queryNotifications,
  unreadCount,
  type NotificationFilters as Filters,
} from "./adapter"
import NotificationFilters from "./NotificationFilters"
import NotificationList from "./NotificationList"
import NotificationDetails from "./NotificationDetails"
import ConcernForm from "./ConcernForm"
import ConcernHistory from "./ConcernHistory"
import ConcernDetails from "./ConcernDetails"
export default function Notifications() {
  const s = useStaffData(),
    q = useSearchParams(),
    router = useRouter(),
    tab = q.get("tab") ?? "all",
    context = q.get("context") ?? undefined,
    targetId = q.get("targetId") ?? undefined
  const [filters, setFilters] = useState<Filters>({}),
    [confirmation, setConfirmation] = useState("")
  const baseQ = new URLSearchParams()
  if (tab !== "all") baseQ.set("tab", tab)
  if (context && targetId) {
    baseQ.set("context", context)
    baseQ.set("targetId", targetId)
  }
  const base = `/notifications${baseQ.size ? `?${baseQ}` : ""}`
  const close = () => router.push(base),
    append = (key: string, value: string) =>
      `${base}${baseQ.size ? "&" : "?"}${key}=${encodeURIComponent(value)}`
  const scoped = {
    ...filters,
    ...(context && targetId ? { context, targetId } : {}),
  }
  return (
    <div className="cm-notifications">
      <PageHeader
        back
        title="Notifications"
        subtitle="Official notices from management and your submitted concerns."
        crumbs={[
          { label: "Dashboard", route: { page: "home" } },
          { label: "Notifications" },
        ]}
        actions={
          <Btn icon="flag" onClick={() => router.push(append("action", "new"))}>
            Submit concern
          </Btn>
        }
      />
      <Banner tone="info">
        Development preview · fictional notices and concerns. Session changes
        reset on reload. No messages are delivered.
      </Banner>
      {confirmation && (
        <p role="status" className="cm-hint">
          {confirmation}
        </p>
      )}
      <Tabs
        label="Notification categories"
        value={tab}
        onChange={(t) => {
          setFilters({})
          router.push(`/notifications?tab=${t}`)
        }}
        tabs={[
          { id: "all", label: "All", count: unreadCount(s) || undefined },
          { id: "client", label: "Client" },
          { id: "house", label: "House" },
          { id: "staff", label: "Staff" },
          {
            id: "concerns",
            label: "My concerns",
            count: getMyConcerns(s).length,
          },
        ]}
      />
      <p className="cm-muted" data-unread-count={unreadCount(s)}>
        {unreadCount(s)} unread notification{unreadCount(s) === 1 ? "" : "s"}
        {unreadCount(s) === 0 ? " · No unread notifications" : ""}
      </p>
      {context && targetId && (
        <div className="cm-row-between cm-mb">
          <p className="cm-hint">
            Showing {contextName(s, context, targetId)} only.
          </p>
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({})
              router.push(`/notifications?tab=${tab}`)
            }}
          >
            Clear context filter
          </Btn>
        </div>
      )}
      <section
        role="tabpanel"
        aria-label={
          tab === "concerns"
            ? "My submitted concerns"
            : "Official notifications"
        }
      >
        <NotificationFilters
          value={scoped}
          contextLocked={!!(context && targetId)}
          onChange={setFilters}
          concerns={tab === "concerns"}
        />
        {tab === "concerns" ? (
          <ConcernHistory
            concerns={queryConcerns(s, scoped)}
            base={baseQ.size ? base : "/notifications?tab=concerns"}
          />
        ) : (
          <NotificationList
            notices={queryNotifications(s, tab, scoped)}
            base={base}
            empty={
              filters.unread
                ? "No unread notifications"
                : filters.search || filters.from || filters.to
                  ? "No matching results"
                  : "No notifications"
            }
          />
        )}
      </section>
      {q.get("item") && (
        <NotificationDetails
          key={q.get("item")}
          id={q.get("item")!}
          onClose={close}
        />
      )}
      {q.get("concernId") && (
        <ConcernDetails id={q.get("concernId")!} onClose={close} />
      )}
      {q.get("action") === "new" && (
        <ConcernForm
          context={context}
          targetId={targetId}
          onClose={close}
          onCreated={(id) => {
            setConfirmation(
              "Concern submitted in this development session only; not delivered to real management.",
            )
            router.replace(
              `/notifications?tab=concerns&concernId=${encodeURIComponent(id)}`,
            )
          }}
        />
      )}
    </div>
  )
}
