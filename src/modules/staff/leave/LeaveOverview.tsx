"use client"
import Link from "next/link"
import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import {
  getLeaveRequest,
  getLeaveSummary,
  getMyLeaveBalances,
  leaveTypeName,
} from "./adapter"
import { PageHeader, Btn, Card, Banner, Empty, SectionTitle } from "../ui"
import LeaveRequestList from "./LeaveRequestList"
import LeaveRequestForm from "./LeaveRequestForm"
import LeaveRequestDetails from "./LeaveRequestDetails"
import LeaveRequestCard from "./LeaveRequestCard"
export default function LeaveOverview() {
  const s = useStaffData(),
    router = useRouter(),
    params = useSearchParams(),
    summary = getLeaveSummary(s),
    balances = getMyLeaveBalances(s),
    id = params.get("requestId"),
    request = id ? getLeaveRequest(s, id) : undefined
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const close = useCallback(() => router.push("/leave"), [router])
  const created = useCallback(
    (id: string) => {
      setSubmittedId(id)
      router.replace(`/leave?requestId=${encodeURIComponent(id)}`)
    },
    [router],
  )
  return (
    <div className="cm-stack cm-leave">
      <PageHeader
        title="Leave"
        subtitle="Balances, requests and history."
        actions={
          <Btn icon="plus" onClick={() => router.push("/leave?action=new")}>
            Request leave
          </Btn>
        }
      />
      <nav aria-label="Leave breadcrumbs">
        <Link href="/dashboard">Dashboard</Link> /{" "}
        <Link href="/leave">My Leave</Link>
        {id && " / Request details"}
      </nav>
      <Banner tone="info">
        Development preview · your own fictional requests and illustrative
        balances only. Not payroll verified. No real approvals, notifications or
        permanent storage are connected.
      </Banner>
      <div className="cm-stat-row">
        {balances.length ? (
          balances.map((b) => (
            <Card key={b.typeId} className="cm-stat">
              <span>{leaveTypeName(s, b.typeId)}</span>
              <strong>
                {b.value.toFixed(1)}
                <small> {b.unit}</small>
              </strong>
            </Card>
          ))
        ) : (
          <Card className="cm-stat">
            <span>Leave balances</span>
            <strong>Unavailable</strong>
          </Card>
        )}
        <Card className="cm-stat">
          <span>Pending requests</span>
          <strong>{summary.pending}</strong>
        </Card>
        <Card className="cm-stat">
          <span>Approved requests</span>
          <strong>{summary.approved}</strong>
        </Card>
      </div>
      <p className="cm-muted">
        Fictional balance snapshots, not calculated entitlements. Submitting a
        request does not deduct a balance.
      </p>
      <SectionTitle
        title="Upcoming approved leave"
        count={summary.upcoming.length}
      />
      {summary.upcoming.length ? (
        <div className="cm-list">
          {summary.upcoming.map((r) => (
            <LeaveRequestCard key={r.id} request={r} />
          ))}
        </div>
      ) : (
        <p className="cm-muted">No upcoming approved leave.</p>
      )}
      <LeaveRequestList />
      {id && !request && (
        <Empty
          icon="shield"
          title="Leave request unavailable"
          text="This request is not available in your leave history. Session-only requests reset on reload."
          action={<Link href="/leave">Return to Leave</Link>}
        />
      )}
      {request && (
        <>
          <LeaveRequestDetails
            request={request}
            onClose={close}
            created={submittedId === request.id}
          />
        </>
      )}
      {params.get("action") === "new" && (
        <LeaveRequestForm onClose={close} onCreated={created} />
      )}
    </div>
  )
}
