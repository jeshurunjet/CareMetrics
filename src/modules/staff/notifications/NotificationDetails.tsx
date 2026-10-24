"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStaffData, useUpdateStaffData } from "../data/context"
import { Modal, Btn } from "../ui"
import { formatDateTime } from "@/lib/time"
import { getNotice, isNoticeRead, markNoticeRead, contextName } from "./adapter"
import NotificationStatus from "./NotificationStatus"
import ParentAttachments from "./ParentAttachments"
export default function NotificationDetails({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const s = useStaffData(),
    update = useUpdateStaffData(),
    router = useRouter(),
    n = getNotice(s, id)
  useEffect(() => {
    update((current) =>
      getNotice(current, id)
        ? markNoticeRead(current, id, new Date().toISOString())
        : current,
    )
  }, [id, update])
  if (!n)
    return (
      <Modal title="Notification unavailable" onClose={onClose}>
        <p>This notification could not be found or is not available to you.</p>
      </Modal>
    )
  const context = contextName(s, n.category, n.relatedId)
  return (
    <Modal
      title={n.title}
      subtitle={`${formatDateTime(n.date)} · Published by ${n.publisher}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Close notice
          </Btn>
          {context && (
            <Btn
              variant="secondary"
              onClick={() =>
                router.push(
                  `/${
                    n.category === "client" ? "clients" : "houses"
                  }/${encodeURIComponent(n.relatedId!)}`,
                )
              }
            >
              Open {n.category === "client" ? "Client" : "House"} Profile
            </Btn>
          )}
        </>
      }
    >
      <dl className="cm-dl">
        <div>
          <dt>Category</dt>
          <dd>{n.category}</dd>
        </div>
        {context && (
          <div>
            <dt>Related {n.category}</dt>
            <dd>{context}</dd>
          </div>
        )}
        <div>
          <dt>Priority</dt>
          <dd>
            <NotificationStatus value={n.priority} />
          </dd>
        </div>
        <div>
          <dt>Publication status</dt>
          <dd>{n.status}</dd>
        </div>
        <div>
          <dt>Read state</dt>
          <dd>
            {isNoticeRead(s, n.id) ? "Read" : "Unread"} · your development
            session
          </dd>
        </div>
        {n.category === "staff" && (
          <div>
            <dt>Audience</dt>
            <dd>
              {n.targetAudience.kind === "organisation"
                ? "All staff"
                : n.targetAudience.kind === "employee"
                  ? "You"
                  : n.targetAudience.kind === "role"
                    ? n.targetAudience.role
                    : n.targetAudience.kind === "house"
                      ? contextName(s, "house", n.targetAudience.houseId)
                      : contextName(s, "client", n.targetAudience.clientId)}
            </dd>
          </div>
        )}
      </dl>
      <p className="cm-body cm-notice-message">
        {n.body || "No additional message."}
      </p>
      <ParentAttachments parent={n} scope="notification" />
      <p className="cm-hint">
        Official management notice · staff cannot publish, edit or delete
        notices. Read state resets on reload.
      </p>
    </Modal>
  )
}
