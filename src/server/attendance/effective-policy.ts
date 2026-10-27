import "server-only"
import { attendancePolicy, type AttendancePolicy } from "./policy"
import { demoAttendancePolicy, type DemoAttendancePolicy } from "./demo-policy"
export type ClockInPolicy = AttendancePolicy | DemoAttendancePolicy
export function effectiveAttendancePolicy(
  organisationId: string,
  env: Record<string, string | undefined> = process.env,
): ClockInPolicy | null {
  return (
    demoAttendancePolicy(organisationId, env) ??
    attendancePolicy(organisationId, env)
  )
}
