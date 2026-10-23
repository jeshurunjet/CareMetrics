"use client"
import { useAdmin, PageHead, SubTabs } from "../ui/core"
import { Banner, Btn } from "../../staff/ui"
import { useWorkforceURL } from "./shared"
import RosterCalendar from "./RosterCalendar"
import ShiftTable from "./ShiftTable"
import ShiftPanel from "./ShiftPanel"
import AttendanceTable from "./AttendanceTable"
import AttendancePanel from "./AttendancePanel"
import CorrectionQueue from "./CorrectionQueue"
import CorrectionReview from "./CorrectionReview"
export default function RosterPage() {
  const { data: s } = useAdmin(),
    { q, change } = useWorkforceURL(),
    tab = q.get("tab") || "calendar"
  const close = () =>
    change({
      shiftId: "",
      attendanceId: "",
      correctionId: "",
      action: "",
      house: "",
      day: "",
    })
  return (
    <>
      <PageHead
        title="Rosters & Attendance"
        sub="Shared fictional shifts, attendance and review requests."
        actions={
          <Btn
            icon="plus"
            onClick={() =>
              change({
                action: "new",
                shiftId: "",
                attendanceId: "",
                correctionId: "",
              })
            }
          >
            Create shift
          </Btn>
        }
      />
      <SubTabs
        value={tab}
        onChange={(t) =>
          change({
            tab: t,
            shiftId: "",
            attendanceId: "",
            correctionId: "",
            action: "",
          })
        }
        tabs={[
          { id: "calendar", label: "Roster calendar" },
          { id: "shifts", label: "Shift list" },
          { id: "attendance", label: "Attendance monitor" },
          { id: "timesheets", label: "Timesheets" },
          {
            id: "corrections",
            label: "Attendance corrections",
            count: s.attendanceCorrections.filter((c) => c.status === "pending")
              .length,
          },
        ]}
      />
      <Banner tone="info">
        Development session only · Pacific/Auckland. No real GPS, database
        writes or payroll approval. Reload resets changes.
      </Banner>
      {tab === "calendar" ? (
        <RosterCalendar />
      ) : tab === "shifts" ? (
        <ShiftTable />
      ) : tab === "corrections" ? (
        <CorrectionQueue />
      ) : (
        <AttendanceTable key={tab} timesheets={tab === "timesheets"} />
      )}
      {(q.get("shiftId") || q.get("action") === "new") && (
        <ShiftPanel
          key={`${q.get("shiftId")}:${q.get("action")}`}
          onClose={close}
        />
      )}{" "}
      {q.get("attendanceId") && (
        <AttendancePanel id={q.get("attendanceId")!} onClose={close} />
      )}{" "}
      {q.get("correctionId") && (
        <CorrectionReview id={q.get("correctionId")!} onClose={close} />
      )}
    </>
  )
}
