BEGIN;
-- Non-identifying aggregate only: lets the scheduler avoid waking Free compute
-- until a retained demonstration location is due. No table/coordinate reads
-- are granted to the scheduler login.
CREATE FUNCTION next_demo_location_expiry() RETURNS TIMESTAMPTZ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT min(e."expiresAt") FROM public."AttendanceLocationEvidence" e
 JOIN public."AttendanceRecord" a ON a.id=e."attendanceId" AND a."organisationId"=e."organisationId"
 JOIN public."Organisation" o ON o.id=e."organisationId"
 WHERE e."purgedAt" IS NULL AND a.verification='GPS_LOCATION_RECORDED_DEMO' AND o."isFictionalDemo"=TRUE
$$;
REVOKE ALL ON FUNCTION next_demo_location_expiry() FROM PUBLIC;
COMMIT;
