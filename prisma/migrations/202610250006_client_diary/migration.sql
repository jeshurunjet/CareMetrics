BEGIN;
ALTER TABLE "ClientDiaryEntry"
 ADD COLUMN "categoryKey" TEXT,
 ADD COLUMN "requestId" UUID,
 ADD COLUMN "requestDigest" TEXT,
 ADD COLUMN "documentationContext" JSONB;
CREATE UNIQUE INDEX "ClientDiaryEntry_requestId_key" ON "ClientDiaryEntry"("requestId");
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "Diary_submission_metadata" CHECK (
 ("categoryKey" IS NULL AND "requestId" IS NULL AND "requestDigest" IS NULL AND "documentationContext" IS NULL)
 OR ("requestId" IS NOT NULL AND "categoryKey" IS NOT NULL AND "categoryKey" IN ('progress-notes','health-appointments','incident-reports','general-update') AND "requestDigest" IS NOT NULL AND "requestDigest" ~ '^[a-f0-9]{64}$' AND "documentationContext" IS NOT NULL AND jsonb_typeof("documentationContext")='object' AND "documentationContext"->>'ruleVersion'='recorded-current-house-v1' AND jsonb_typeof("documentationContext"->'offShift')='boolean' AND (("documentationContext"->>'offShift'='true' AND "offShiftReason" IS NOT NULL AND length(btrim("offShiftReason"))>0) OR ("documentationContext"->>'offShift'='false' AND "documentationContext"->>'attendanceId' IS NOT NULL AND "documentationContext"->>'attendanceId' ~ '^[a-f0-9-]{36}$')) AND status='SUBMITTED'  AND length(btrim(title)) BETWEEN 1 AND 160 AND length(btrim(content)) BETWEEN 10 AND 10000 AND "coveredAt" <= "submittedAt" AND ("offShiftReason" IS NULL OR length("offShiftReason") BETWEEN 1 AND 1000))
);
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_action";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_action" CHECK ("action" IN ('employee.created','employee.updated','employee.status','employee.role','assignments.updated','house.created','house.updated','house.status','client.created','client.updated','client.status','client.transferred','contacts.updated','shift.created','shift.updated','shift.cancelled','attendance.clocked_in','attendance.clocked_out','diary.submitted'));
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_target_type";
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_target_type" CHECK ("targetType" IN ('employee','house','client','contacts','assignments','shift','attendance','clientDiary'));
COMMIT;
