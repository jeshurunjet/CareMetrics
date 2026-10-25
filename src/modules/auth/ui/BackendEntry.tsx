import Link from "next/link"
import { redirect } from "next/navigation"
import { requireEmployee, requireManagement } from "@/server/auth/access"
import { AccessError } from "@/server/errors"
import SignOut from "./SignOut"
export async function entryIdentity(management = false) {
  try {
    return await (management ? requireManagement() : requireEmployee())
  } catch (error) {
    if (error instanceof AccessError && error.status === 401) redirect("/login")
    return null
  }
}
export function BackendUnavailable() {
  return (
    <section className="cm-card cm-panel" role="alert">
      <h1>Access unavailable</h1>
      <p>
        This service is unavailable. Please try again or contact management.
      </p>
      <Link href="/login">Back to sign in</Link>
    </section>
  )
}
export default async function BackendEntry({
  page,
}: {
  page: "shifts" | "dashboard" | "admin"
}) {
  const employee = await entryIdentity(page === "admin")
  if (!employee) return <BackendUnavailable />
  return (
    <section className="cm-card cm-panel">
      <h1>
        {page === "shifts"
          ? "Clock-in / My Shifts"
          : page === "admin"
            ? "Administration"
            : "Dashboard"}
      </h1>
      <p>Signed in as {employee.name}</p>
      <p>
        {page === "shifts"
          ? "Attendance requires an explicitly approved policy. Continue to dashboard without clocking in."
          : page === "admin"
            ? "Core management, scheduling, attendance history and Client Diary reads are connected. Other care workflows remain unavailable."
            : "Backend foundation connected."}
      </p>
      {page === "shifts" ? (
        <Link className="cm-btn cm-btn--primary cm-btn--md" href="/dashboard">
          Continue to dashboard
        </Link>
      ) : (
        <Link
          className="cm-btn cm-btn--secondary cm-btn--md"
          href="/shift-check"
        >
          My Shifts
        </Link>
      )}
      {page !== "admin" &&
        (employee.role === "MANAGER" || employee.role === "ADMINISTRATOR") && (
          <Link
            className="cm-btn cm-btn--secondary cm-btn--md"
            href="/admin/dashboard"
          >
            Administration
          </Link>
        )}
      <SignOut />
    </section>
  )
}
