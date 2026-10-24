"use client"
import { useStaffData } from "../data/context"
import { Modal, Btn } from "../ui"
import { formatDateTime } from "@/lib/time"
import { getConcern, contextName } from "./adapter"
import NotificationStatus from "./NotificationStatus"
import ParentAttachments from "./ParentAttachments"
export default function ConcernDetails({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const s = useStaffData(),
    c = getConcern(s, id)
  if (!c)
    return (
      <Modal title="Concern unavailable" onClose={onClose}>
        <p>This concern could not be found or is not available to you.</p>
      </Modal>
    )
  return (
    <Modal
      title={c.title}
      subtitle="My submitted concern · development preview"
      onClose={onClose}
      footer={
        <Btn variant="secondary" onClick={onClose}>
          Close concern
        </Btn>
      }
    >
      <dl className="cm-dl">
        <div>
          <dt>Author</dt>
          <dd>{s.staff.find((e) => e.id === c.submittedById)?.name}</dd>
        </div>
        <div>
          <dt>Related {c.context}</dt>
          <dd>{contextName(s, c.context, c.targetId)}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(c.submittedAt)}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <NotificationStatus value={c.priority} />
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <NotificationStatus value={c.status} />
          </dd>
        </div>
        {c.resolvedAt && (
          <div>
            <dt>Resolved</dt>
            <dd>{formatDateTime(c.resolvedAt)}</dd>
          </div>
        )}
      </dl>
      <p className="cm-body cm-notice-message">{c.description}</p>
      {c.response && (
        <section className="cm-notice-card">
          <h3 className="cm-h3">Management response (fictional)</h3>
          <p>{c.response.text}</p>
          <span>
            {c.response.reviewerName} · {formatDateTime(c.response.at)}
          </span>
        </section>
      )}
      <ParentAttachments parent={c} scope="concern" />
      <p className="cm-hint">
        Staff can view their own submissions. Review, resolution and publication
        are management-only development previews; no production service is
        connected.
      </p>
    </Modal>
  )
}
