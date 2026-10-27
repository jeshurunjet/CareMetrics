// Explicit reuse of the existing fictional development fixture limits.
export const demoPolicy = (organisationId: string) => ({
  mode: "GPS_LOCATION_RECORDED_DEMO",
  organisationId,
  version: "demo-academic-v1",
  approval: "fictional-demo",
  enabled: true,
  maxAccuracyMetres: 30,
  maxAgeMs: 60000,
  maxFutureSkewMs: 0,
  earlyWindowMs: 600000,
  lateWindowMs: 3600000,
  retentionDays: 7,
  clockOutMode: "NO_LOCATION_REQUIRED",
})
export const demoEnvironment = (organisationId: string) => ({
  CAREMETRICS_DEPLOYMENT_KIND: "fictional-demo",
  CAREMETRICS_DEMO_DATA_ACK: "fictional-records-only",
  CAREMETRICS_DEMO_ORGANISATION_ID: organisationId,
  CAREMETRICS_DEMO_GPS_POLICY: JSON.stringify(demoPolicy(organisationId)),
})
