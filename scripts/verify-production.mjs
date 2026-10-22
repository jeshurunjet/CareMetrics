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
  for (const path of [
    "/shift-check",
    "/dashboard",
    "/houses",
    "/houses/h1",
    "/clients/c1",
    "/admin/dashboard",
    "/admin/employees",
  ]) {
    const res = await fetch(`http://localhost:8556${path}`)
    assert.equal(
      res.status,
      404,
      `${path} fails closed even with preview opt-in`,
    )
    const body = await res.text()
    for (const marker of ["Jamie Taufa", "Taylor Reed", "Riverside Lodge"])
      assert.ok(!body.includes(marker), "no fictional data exposed")
  }
  console.log(
    "Production HTTP checks passed: login inert, seven preview routes refused with flag enabled.",
  )
} finally {
  server.kill("SIGTERM")
}
