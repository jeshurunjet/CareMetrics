"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useStaffData } from "../data/context"
import {
  getReadableCareTemplate,
  getAssignedCareTemplate,
  getCareRecord,
  canRequestCareCorrection,
  requestCareCorrection,
} from "./adapter"
import { effectiveCare, latestRevision } from "../documentation/revisions"
import RecordRevisionHistory from "../documentation/RecordRevisionHistory"
import { proposalField } from "../documentation/proposals"
import { Card, Banner } from "../ui"
import { RecordStatus, RecordMetadata } from "../diary/shared"
import RecordCorrectionForm from "../documentation/RecordCorrectionForm"
import { allFields, isTableRows } from "../../forms/engine"
import ReadOnlyFormValues from "../../forms/ReadOnlyFormValues"
import { careDetailHref, careFormHref, careHistoryHref } from "./navigation"
import { AssessmentPreviewNotice, UnavailableAssessment } from "./shared"
export default function AssessmentDetails({
  clientId,
  templateId,
  id,
  kind = "care",
}: {
  clientId: string
  templateId: string
  id: string
  kind?: "care" | "chart"
}) {
  const s = useStaffData(),
    params = useSearchParams(),
    original = getCareRecord(s, clientId, templateId, id),
    record = original && effectiveCare(s, original),
    assigned = getReadableCareTemplate(s, clientId, templateId, kind)
  if (!record || !assigned)
    return <UnavailableAssessment clientId={clientId} kind={kind} />
  const version = assigned.template.versions.find(
    (v) => v.version === record.templateVersion,
  )!
  const answers = (
    <ReadOnlyFormValues version={version} values={record.values} />
  )
  if (params.get("action") === "correction")
    return (
      <RecordCorrectionForm
        key={id}
        baselineLabel={
          latestRevision(s, "care", id)
            ? "Current effective record"
            : "Original submitted entry"
        }
        title={
          version.name ??
          assigned.template.legacyMetadata?.name ??
          assigned.template.name
        }
        original={answers}
        allowed={canRequestCareCorrection(s, record)}
        unavailable={<UnavailableAssessment clientId={clientId} kind={kind} />}
        returnHref={careDetailHref(clientId, templateId, id, false, kind)}
        proposalField={(target) => proposalField(s, record, target)}
        proposalValue={(target) => {
          const value = record.values[target.fieldId]
          return target.rowId && isTableRows(value)
            ? value.find((row) => row.id === target.rowId)?.values[
                target.columnId!
              ]
            : value
        }}
        targets={allFields(version)
          .filter((f) => !["photo", "file", "table"].includes(f.type))
          .flatMap((f) => {
            const value = record.values[f.id]
            return f.type === "repeatingTable" && isTableRows(value)
              ? [
                  ...(f.columns.every(
                    (c) => !["photo", "file"].includes(c.type),
                  )
                    ? [
                        {
                          label: `${f.label} · Whole table (stable rows)`,
                          target: { fieldId: f.id },
                        },
                      ]
                    : []),
                  ...value.flatMap((row, i) =>
                    f.columns
                      .filter((c) => !["photo", "file"].includes(c.type))
                      .map((c) => ({
                        label: `${f.label} · Row ${i + 1} · ${c.label}`,
                        target: {
                          fieldId: f.id,
                          rowId: row.id,
                          columnId: c.id,
                        },
                      })),
                  ),
                ]
              : [{ label: f.label, target: { fieldId: f.id } }]
          })}
        proposalHelp="Identify each affected field and its intended value. The original version and answers remain unchanged."
        onRequest={(
          snapshot,
          reason,
          proposed,
          requestId,
          now,
          target,
          value,
        ) =>
          requestCareCorrection(
            snapshot,
            clientId,
            templateId,
            id,
            reason,
            proposed,
            requestId,
            now,
            target,
            value,
          )
        }
      />
    )
  return (
    <div className="cm-stack">
      <Link href={careHistoryHref(clientId, templateId, kind)}>
        Back to {kind === "chart" ? "chart" : "assessment"} history
      </Link>
      <AssessmentPreviewNotice kind={kind} />
      {params.get("result") === "submitted" && (
        <Banner
          tone="success"
          title={
            kind === "chart"
              ? "Chart entry submitted in development preview"
              : "Assessment submitted in development preview"
          }
        >
          This session-only record is read-only and resets on reload.
        </Banner>
      )}
      <Card className="cm-panel">
        <h2 className="cm-h2">
          {version.name ??
            assigned.template.legacyMetadata?.name ??
            assigned.template.name}
        </h2>
        <p className="cm-muted">
          Template v{record.templateVersion} ·{" "}
          {s.clients.find((c) => c.id === clientId)?.name}
        </p>
        {latestRevision(s, "care", id) && (
          <p className="cm-hint">
            Corrected effective record · original submission retained below.
          </p>
        )}
        <div className="cm-chip-row">
          <RecordStatus entry={record} recordType="care" />
        </div>
        {answers}
        <RecordMetadata entry={record} />
        <div className="cm-row-actions">
          {record.status === "draft" &&
          getAssignedCareTemplate(s, clientId, templateId, kind) ? (
            <Link
              className="cm-btn cm-btn--primary cm-btn--md"
              href={careFormHref(clientId, templateId, id)}
            >
              Continue draft
            </Link>
          ) : canRequestCareCorrection(s, record) ? (
            <Link
              className="cm-btn cm-btn--secondary cm-btn--md"
              href={careDetailHref(clientId, templateId, id, true, kind)}
            >
              Request correction
            </Link>
          ) : (
            <p className="cm-hint">
              Submitted content is read-only. Corrections require management
              review.
            </p>
          )}
        </div>
      </Card>
      <RecordRevisionHistory s={s} kind="care" record={original!} />
    </div>
  )
}
