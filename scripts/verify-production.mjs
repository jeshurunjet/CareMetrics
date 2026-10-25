import { spawn } from "node:child_process"
import assert from "node:assert/strict"
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "8556"],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      CAREMETRICS_UI_PREVIEW: "true",
      CAREMETRICS_BACKEND_MODE: "disabled",
      NEXT_BUILD_DIR: ".next-build",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
)
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Server exited: ${server.exitCode}`)
    try {
      const res = await fetch("http://localhost:8556/login")
      ready = res.ok
    } catch {}
    if (ready) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(ready, "production server starts")
  const login = await (await fetch("http://localhost:8556/login")).text()
  assert.ok(
    !login.includes("Preview staff application"),
    "no production preview button",
  )
  assert.ok(!login.includes("staff2fa"), "no prototype credentials")
  assert.ok(
    !login.includes("Preview administration"),
    "no production Administration preview entry",
  )
  const paths = [
    "/admin/files?fileId=client-garden",
    "/admin/files?fileId=private-client-file",
    "/admin/files?fileId=missing",
    "/admin/notifications?tab=concerns",
    "/admin/notifications?tab=notices",
    "/admin/notifications/new",
    "/admin/notifications/n1/edit",
    "/admin/notifications/missing/edit",
    "/admin/concerns/concern-submitted",
    "/admin/concerns/concern-other",
    "/admin/concerns/missing",
    "/admin/reports?tab=audit",
    "/admin/reports?tab=reports",
    "/admin/documentation/records/client-c1-1?kind=diary",
    "/admin/documentation/records/house-h1-1?kind=diary",
    "/admin/documentation/records/care-c1-skin-7?kind=care",
    "/admin/documentation/records/chart-equipment-1?kind=care",
    "/admin/documentation/records/unknown?kind=care",
    "/admin/documentation/records/client-c1-1?kind=diary&action=delete",
    "/admin/documentation/corrections/chart-correction",
    "/admin/documentation/corrections/unknown",
    "/admin/documentation/corrections/chart-correction?action=approve",

    "/admin",
    "/admin/documentation?tab=overview",
    "/admin/documentation?tab=categories",
    "/admin/documentation?tab=care",
    "/admin/documentation?tab=chart",
    "/admin/documentation?tab=assignments",
    "/admin/documentation?tab=records",
    "/admin/documentation?tab=corrections",
    "/admin/documentation/templates/t1",
    "/admin/documentation/templates/t1?tab=preview",
    "/admin/documentation/templates/t1?tab=versions",
    "/admin/documentation/templates/t1?tab=assign",
    "/admin/documentation/templates/missing",
    "/admin/documentation/templates/00000000-0000-4000-8000-000000000000?tab=builder",
    "/admin/employees/new",
    "/admin/employees/s1",
    "/admin/employees/s1/edit",
    "/admin/employees/a1?tab=account",
    "/admin/employees/s1?tab=houses",
    "/admin/houses/new",
    "/admin/houses/h1",
    "/admin/houses/h1/edit",
    "/admin/houses/h3?tab=employees",
    "/admin/houses/h1?tab=clients",
    "/admin/clients/new",
    "/admin/clients/c1",
    "/admin/clients/c1/edit",
    "/admin/clients/c1?tab=contacts",
    "/admin/clients/c1?tab=house",
    "/admin/clients/c4",
    "/admin/roster?tab=calendar",
    "/admin/roster?tab=shifts",
    "/admin/roster?action=new",
    "/admin/roster?shiftId=sh1",
    "/admin/roster?shiftId=sh1&action=edit",
    "/admin/roster?shiftId=sh1&action=cancel",
    "/admin/roster?tab=attendance",
    "/admin/roster?tab=timesheets&attendanceId=at-history-1",
    "/admin/roster?tab=corrections&correctionId=attendance-correction-1",
    "/admin/leave?tab=pending",
    "/admin/leave?tab=all&requestId=leave-pending",
    "/admin/leave?tab=calendar",
    "/admin/roster?shiftId=missing",
    "/admin/leave?requestId=missing",
    "/admin/dashboard?previewRole=Administrator",
    "/profile",
    "/profile?action=edit",
    "/profile?action=photo",
    "/profile?employeeId=s2",
    "/profile/s2",
    "/settings",
    "/notifications",
    "/notifications?tab=client",
    "/notifications?tab=house",
    "/notifications?tab=staff",
    "/notifications?item=n2",
    "/notifications?item=n-private-employee",
    "/notifications?action=new",
    "/notifications?tab=concerns",
    "/notifications?tab=concerns&concernId=concern-review",
    "/notifications?tab=concerns&concernId=concern-other",
    "/notifications?context=client&targetId=c4&action=new",
    "/houses/h1?tab=concerns",
    "/leave",
    "/leave?action=new",
    "/leave?requestId=leave-pending",
    "/leave?requestId=leave-approved",
    "/leave?requestId=leave-rejected",
    "/leave?requestId=leave-other-employee",
    "/leave?requestId=leave-restricted",
    "/roster",
    "/roster?tab=team&house=h1",
    "/roster?tab=timesheets",
    "/roster?shiftId=sh1",
    "/roster?tab=timesheets&attendanceId=at-overnight",
    "/roster?tab=timesheets&attendanceId=at-overnight&action=correction",
    "/roster?shiftId=restricted-shift",
    "/roster?tab=timesheets&attendanceId=coworker-attendance",
    "/shift-check",
    "/dashboard",
    "/houses",
    "/houses/h1",
    "/clients/c1",
    "/admin/dashboard",
    "/admin/employees",
    "/search?q=Riverside",
    "/houses/h1?tab=files",
    "/clients/c1?tab=care",
    "/houses/h3",
    "/clients/c4",
    "/clients/c1?tab=diary",
    "/houses/h1?tab=diary",
    "/clients/c1?tab=diary&item=client-c1-1&action=correction",
    "/houses/h1?tab=diary&item=house-h1-1",
    "/clients/c1/diary/new",
    "/houses/h1/diary/new?draft=house-h1-8",
    "/clients/c4/diary/new",
    "/houses/h3/diary/new",
    "/clients/c1?tab=care&sub=t1",
    "/clients/c1?tab=care&sub=t1&item=care-c1-skin-1",
    "/clients/c1?tab=care&sub=t1&item=care-c1-skin-1&action=correction",
    "/clients/c1/records/new?templateId=t1",
    "/clients/c1/records/new?templateId=t1&draft=care-c1-skin-8",
    "/clients/c2/records/new?templateId=t2",
    "/clients/c4/records/new?templateId=t-private",
    "/clients/c1?tab=charting",
    "/clients/c1?tab=charting&sub=t4",
    "/clients/c1?tab=charting&sub=t6&item=chart-equipment-1",
    "/clients/c1?tab=charting&sub=t6&item=chart-equipment-1&action=correction",
    "/clients/c1/records/new?templateId=t6",
    "/clients/c1/records/new?templateId=t6&draft=chart-equipment-draft",
    "/clients/c2/records/new?templateId=t6",
    "/clients/c4?tab=charting&sub=chart-private",
    "/clients/c1?tab=files",
    "/clients/c1?tab=files&fileId=client-garden&action=preview",
    "/clients/c1?tab=files&fileId=client-readme&action=info",
    "/houses/h1?tab=files&fileId=house-garden&action=preview",
    "/houses/h3?tab=files&fileId=private-house-file",
    "/clients/c4?tab=files&fileId=private-client-file",
  ]
  for (const path of paths) {
    const res = await fetch(`http://localhost:8556${path}`)
    assert.equal(
      res.status,
      404,
      `${path} fails closed even with preview opt-in`,
    )
    const body = await res.text()
    for (const marker of [
      "Private coworker attendance example",
      "Fictional recorded attendance",
      "Private coworker leave example",
      "Restricted leave history example",
      "Fictional request awaiting review",
      "PRIVATE_CLIENT_NOTICE",
      "PRIVATE_EMPLOYEE_NOTICE",
      "PRIVATE_COWORKER_CONCERN",
      "INTERNAL_MANAGEMENT_CONCERN_NOTE",
      "PRIVATE_COWORKER_PROFILE_ADDRESS",
      "PRIVATE_COWORKER_EMERGENCY_CONTACT",
      "Fictional home address",
      "Jamie Taufa",
      "Taylor Reed",
      "Riverside Lodge",
      "Morgan Reed",
      "Restricted Contact",
      "Fictional diary note",
      "House handover",
      "Legacy fictional observation",
      "Unassigned assessment content",
      "Unassigned chart content",
      "Fictional exercise session",
      "Demo walking frame",
      "Restricted client file example",
      "Restricted house file example",
    ])
      assert.ok(!body.includes(marker), "no fictional data exposed")
  }
  for (const path of [
    "/api/me",
    "/api/search?q=fictional",
    "/api/houses",
    "/api/clients/20000000-0000-4000-8000-000000000031",
    "/api/admin/foundation",
    "/api/auth/session",
  ]) {
    const response = await fetch(`http://localhost:8556${path}`, {
      headers: {
        Cookie: "authjs.session-token=forged",
        "x-role": "ADMINISTRATOR",
      },
    })
    assert.equal(response.status, 503, "disabled backend API fails closed")
    assert.ok(response.headers.get("cache-control")?.includes("no-store"))
    const text = await response.text()
    assert.ok(
      !text.includes("passwordHash") && !text.includes("postgresql://"),
      "no internal credentials or records",
    )
  }
  const mutationPaths = [
    ["/api/admin/employees", "POST"],
    ["/api/admin/employees/20000000-0000-4000-8000-000000000013", "PATCH"],
    [
      "/api/admin/employees/20000000-0000-4000-8000-000000000013/status",
      "POST",
    ],
    [
      "/api/admin/employees/20000000-0000-4000-8000-000000000013/assignments",
      "PUT",
    ],
    ["/api/admin/houses", "POST"],
    ["/api/admin/houses/20000000-0000-4000-8000-000000000021", "PATCH"],
    ["/api/admin/clients", "POST"],
    ["/api/admin/clients/20000000-0000-4000-8000-000000000031", "PATCH"],
    ["/api/admin/clients/20000000-0000-4000-8000-000000000031/contacts", "PUT"],
    [
      "/api/admin/clients/20000000-0000-4000-8000-000000000031/transfer",
      "POST",
    ],
  ]
  for (const [path, method] of mutationPaths) {
    const response = await fetch(`http://localhost:8556${path}`, {
      method,
      headers: {
        Origin: "http://localhost:8556",
        "Content-Type": "application/json",
        Cookie: "authjs.session-token=forged",
        "x-role": "ADMINISTRATOR",
      },
      body: JSON.stringify({ role: "ADMINISTRATOR", actorId: "forged" }),
    })
    assert.equal(
      response.status,
      503,
      "disabled management mutation fails closed",
    )
    assert.ok(response.headers.get("cache-control")?.includes("no-store"))
    assert.deepEqual(await response.json(), { error: "Service unavailable" })
  }
  console.log(
    `Production HTTP checks passed: login inert, ${paths.length} preview routes refused with flag enabled; six read/auth and ten mutation API probes failed closed.`,
  )
} finally {
  server.kill("SIGTERM")
}
