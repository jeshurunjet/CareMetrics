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
  const paths = [
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
  console.log(
    `Production HTTP checks passed: login inert, ${paths.length} preview routes refused with flag enabled.`,
  )
} finally {
  server.kill("SIGTERM")
}
