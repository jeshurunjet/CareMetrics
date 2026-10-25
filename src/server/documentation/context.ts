import "server-only"
import type { Tx } from "../admin/transaction"
export async function eligibleDocumentationAttendance(
  tx: Tx,
  organisationId: string,
  employeeId: string,
  houseId: string,
  at: Date,
) {
  // Fictional verification is never approval for a production on-shift exemption.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  )
    return null
  return tx.attendanceRecord.findFirst({
    where: {
      organisationId,
      employeeId,
      houseId,
      verification: "SERVER_VALIDATED_LOCATION_TEST",
      clockIn: { lte: at },
      OR: [{ clockOut: null }, { clockOut: { gt: at } }],
      shift: {
        organisationId,
        employeeId,
        houseId,
        status: "SCHEDULED",
        startsAt: { lte: at },
        endsAt: { gt: at },
      },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  })
}
