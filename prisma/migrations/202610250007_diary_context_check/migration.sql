BEGIN;
-- Explicit FALSE on missing JSON keys: PostgreSQL CHECK otherwise accepts UNKNOWN.
ALTER TABLE "ClientDiaryEntry" ADD CONSTRAINT "Diary_documentation_context" CHECK (
 "documentationContext" IS NULL OR COALESCE(
  "documentationContext"->>'ruleVersion'='recorded-current-house-v1'
  AND jsonb_typeof("documentationContext"->'offShift')='boolean'
  AND (
   ("documentationContext"->>'offShift'='true' AND "offShiftReason" IS NOT NULL AND length(btrim("offShiftReason"))>0)
   OR ("documentationContext"->>'offShift'='false' AND "documentationContext"->>'attendanceId' IS NOT NULL AND "documentationContext"->>'attendanceId' ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')
  ), FALSE
 )
);
COMMIT;
