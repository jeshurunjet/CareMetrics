BEGIN;
ALTER TABLE "Organisation" ADD COLUMN "isFictionalDemo" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "House" ADD COLUMN "imageKey" TEXT;
ALTER TABLE "House" ADD CONSTRAINT "House_local_image_key" CHECK ("imageKey" IS NULL OR "imageKey" IN ('house-1','house-2','house-3'));
CREATE UNIQUE INDEX "AttendanceRecord_organisationId_id_key" ON "AttendanceRecord"("organisationId","id");
CREATE TABLE "AttendanceLocationEvidence" (
 "attendanceId" UUID PRIMARY KEY,
 "organisationId" UUID NOT NULL,
 "latitude" DOUBLE PRECISION,
 "longitude" DOUBLE PRECISION,
 "expiresAt" TIMESTAMPTZ(3) NOT NULL,
 "purgedAt" TIMESTAMPTZ(3),
 CONSTRAINT "AttendanceLocationEvidence_organisationId_attendanceId_fkey" FOREIGN KEY ("organisationId","attendanceId") REFERENCES "AttendanceRecord"("organisationId","id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "AttendanceLocationEvidence_coordinates" CHECK (
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND "purgedAt" IS NULL)
  OR ("latitude" IS NULL AND "longitude" IS NULL AND "purgedAt" IS NOT NULL AND "purgedAt">="expiresAt")
 )
);
CREATE UNIQUE INDEX "AttendanceLocationEvidence_organisationId_attendanceId_key" ON "AttendanceLocationEvidence"("organisationId","attendanceId");
CREATE INDEX "AttendanceLocationEvidence_expiresAt_idx" ON "AttendanceLocationEvidence"("expiresAt");
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_gps_evidence";
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_gps_evidence" CHECK (
 ("verification" IS NULL AND "houseId" IS NULL AND "measuredAt" IS NULL AND "accuracyMetres" IS NULL AND "policyVersion" IS NULL AND "policySnapshot" IS NULL AND "requestId" IS NULL AND "requestDigest" IS NULL)
 OR ("verification" IS NOT NULL AND "verification" IN ('SERVER_VALIDATED_LOCATION_TEST','GPS_LOCATION_RECORDED_DEMO') AND "clockIn" IS NOT NULL AND "houseId" IS NOT NULL AND "measuredAt" IS NOT NULL AND "accuracyMetres" IS NOT NULL AND "accuracyMetres">=0 AND "accuracyMetres"<'Infinity'::float8 AND "policyVersion" IS NOT NULL AND length("policyVersion") BETWEEN 1 AND 80 AND "policySnapshot" IS NOT NULL AND jsonb_typeof("policySnapshot")='object' AND "requestId" IS NOT NULL AND "requestDigest" IS NOT NULL AND "requestDigest"~'^[a-f0-9]{64}$')
);
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_clock_out_evidence";
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_clock_out_evidence" CHECK (COALESCE((
 ("clockOutRequestId" IS NULL AND "clockOutRequestDigest" IS NULL AND "clockOutPolicyVersion" IS NULL AND "clockOutPolicySnapshot" IS NULL AND "clockOutVerification" IS NULL)
 OR ("clockOutVerification" IS NOT NULL AND (("clockOutVerification"='NO_LOCATION_REQUIRED_TEST' AND "verification" IS DISTINCT FROM 'GPS_LOCATION_RECORDED_DEMO') OR ("clockOutVerification"='NO_LOCATION_REQUIRED_DEMO' AND "verification"='GPS_LOCATION_RECORDED_DEMO')) AND "clockOut" IS NOT NULL AND "clockIn" IS NOT NULL AND "clockOut">"clockIn" AND "clockOutRequestId" IS NOT NULL AND "clockOutRequestDigest" IS NOT NULL AND "clockOutRequestDigest"~'^[a-f0-9]{64}$' AND "clockOutPolicyVersion" IS NOT NULL AND length("clockOutPolicyVersion") BETWEEN 1 AND 80 AND "clockOutPolicySnapshot" IS NOT NULL AND jsonb_typeof("clockOutPolicySnapshot")='object')
),FALSE));
CREATE FUNCTION protect_demo_location_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a RECORD;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Location retention metadata is retained'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT ar."measuredAt",ar.verification,o."isFictionalDemo" INTO a FROM "AttendanceRecord" ar JOIN "Organisation" o ON o.id=ar."organisationId" WHERE ar.id=NEW."attendanceId" AND ar."organisationId"=NEW."organisationId";
  IF NOT FOUND OR a.verification IS DISTINCT FROM 'GPS_LOCATION_RECORDED_DEMO' OR a."isFictionalDemo" IS DISTINCT FROM TRUE OR NEW."expiresAt" IS DISTINCT FROM a."measuredAt"+INTERVAL '168 hours' OR NEW."purgedAt" IS NOT NULL OR NEW.latitude IS NULL OR NEW.longitude IS NULL THEN RAISE EXCEPTION 'Invalid recording-only location evidence'; END IF;
  RETURN NEW;
 END IF;
 IF ROW(NEW."attendanceId",NEW."organisationId",NEW."expiresAt") IS DISTINCT FROM ROW(OLD."attendanceId",OLD."organisationId",OLD."expiresAt") THEN RAISE EXCEPTION 'Location metadata is immutable'; END IF;
 IF ROW(NEW.latitude,NEW.longitude,NEW."purgedAt") IS DISTINCT FROM ROW(OLD.latitude,OLD.longitude,OLD."purgedAt") AND NOT (OLD."purgedAt" IS NULL AND OLD."expiresAt"<=CURRENT_TIMESTAMP AND NEW.latitude IS NULL AND NEW.longitude IS NULL AND NEW."purgedAt"=date_trunc('milliseconds',CURRENT_TIMESTAMP)) THEN RAISE EXCEPTION 'Coordinates may only be erased after expiry'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_location_retention BEFORE INSERT OR UPDATE OR DELETE ON "AttendanceLocationEvidence" FOR EACH ROW EXECUTE FUNCTION protect_demo_location_evidence();
CREATE FUNCTION require_demo_location_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.verification='GPS_LOCATION_RECORDED_DEMO' AND NOT EXISTS (SELECT 1 FROM "AttendanceLocationEvidence" e WHERE e."attendanceId"=NEW.id AND e."organisationId"=NEW."organisationId") THEN RAISE EXCEPTION 'Recording-only attendance requires location evidence'; END IF;
 RETURN NEW;
END;
$$;
CREATE CONSTRAINT TRIGGER complete_demo_location AFTER INSERT ON "AttendanceRecord" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION require_demo_location_evidence();
-- No table access is granted to a job role. A reviewed operator provisions a
-- separate login and grants EXECUTE only on this fixed, expiry-only function.
CREATE FUNCTION purge_expired_demo_locations() RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE affected INTEGER;
BEGIN
 WITH expired AS (
  SELECT e."attendanceId" FROM public."AttendanceLocationEvidence" e JOIN public."AttendanceRecord" a ON a.id=e."attendanceId" AND a."organisationId"=e."organisationId" JOIN public."Organisation" o ON o.id=e."organisationId"
  WHERE e."expiresAt"<=CURRENT_TIMESTAMP AND e."purgedAt" IS NULL AND a.verification='GPS_LOCATION_RECORDED_DEMO' AND o."isFictionalDemo"=TRUE
  ORDER BY e."expiresAt" LIMIT 500 FOR UPDATE OF e SKIP LOCKED
 ) UPDATE public."AttendanceLocationEvidence" e SET latitude=NULL,longitude=NULL,"purgedAt"=date_trunc('milliseconds',CURRENT_TIMESTAMP) FROM expired x WHERE e."attendanceId"=x."attendanceId";
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected;
END;
$$;
REVOKE ALL ON FUNCTION purge_expired_demo_locations() FROM PUBLIC;
-- Keep the fictional scope guard effective until every precise coordinate is purged.
CREATE FUNCTION protect_demo_classification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."isFictionalDemo"=TRUE AND NEW."isFictionalDemo"=FALSE AND EXISTS (SELECT 1 FROM "AttendanceLocationEvidence" WHERE "organisationId"=OLD.id AND (latitude IS NOT NULL OR longitude IS NOT NULL)) THEN RAISE EXCEPTION 'Purge retained demonstration locations before changing classification'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_demo_classification BEFORE UPDATE OF "isFictionalDemo" ON "Organisation" FOR EACH ROW EXECUTE FUNCTION protect_demo_classification();
COMMIT;
