// Test-only original-export renderer. Never imported by the application or included in deployment.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve, join, dirname } from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import ts from "typescript"
const root = resolve(".ui-reference")
await mkdir(root, { recursive: true })
await cp("reference/figma-export", root, { recursive: true })
// Compile the pure mock graph into isolated ESM files, preserving no application import.
const sources = [
  "src/modules/staff/data/types.ts",
  "src/modules/staff/data/selectors.ts",
  "src/modules/staff/data/queries.ts",
  "src/modules/staff/data/diary-adapter.ts",
  "src/modules/staff/data/diary-seed.ts",
  "src/modules/staff/data/correction-service.ts",
  "src/modules/staff/data/development-mock-adapter.ts",
  "src/modules/staff/care/adapter.ts",
  "src/modules/staff/care/seed.ts",
  "src/modules/staff/charting/seed.ts",
  "src/modules/staff/roster/seed.ts",
  "src/modules/staff/roster/adapter.ts",
  "src/modules/staff/roster/dates.ts",
  "src/modules/staff/files/seed.ts",
  "src/modules/staff/files/adapter.ts",
  "src/modules/staff/files/policy.ts",
  "src/modules/staff/files/demo-assets.ts",
  "src/modules/forms/engine.ts",
  "src/lib/time.ts",
]
const compiled = new Map(
  sources.map((path, i) => [resolve(path), join(root, `mock-${i}.mjs`)]),
)
for (const sourcePath of sources) {
  const source = await readFile(sourcePath, "utf8")
  const js = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(/from ["']([^"']+)["']/g, (full, spec) => {
      const input = spec.startsWith("@/")
        ? resolve("src", spec.slice(2) + ".ts")
        : resolve(dirname(sourcePath), spec + ".ts")
      const output = compiled.get(input)
      return output
        ? `from ${JSON.stringify(pathToFileURL(output).href)}`
        : full
    })
  await writeFile(compiled.get(resolve(sourcePath)), js)
}
const { developmentMockAdapter } = await import(
  pathToFileURL(
    compiled.get(resolve("src/modules/staff/data/development-mock-adapter.ts")),
  )
)
const snapshot = developmentMockAdapter.getSnapshot(
  "s1",
  "2026-10-22T01:00:00.000Z",
)
const { demoAssets } = await import(
  pathToFileURL(compiled.get(resolve("src/modules/staff/files/demo-assets.ts")))
)
const fixtureAssetPath = (id) => demoAssets[id]?.path
const fixture = {
  ...snapshot,
  staff: snapshot.staff.map((e) => ({
    ...e,
    houses: snapshot.assignments
      .filter((a) => a.employeeId === e.id)
      .map((a) => a.houseId),
  })),
  attendance: snapshot.attendance,
  templates: snapshot.careTemplates.map((t) => {
    const assigned = snapshot.careAssignments.filter(
      (a) => a.templateId === t.id && a.status === "active",
    )
    const current =
      t.versions.find((v) => v.version === assigned[0]?.version) ??
      t.versions.at(-1)
    const fields = (v) =>
      v.sections.flatMap((section) =>
        section.fields.map((f) => ({
          ...f,
          type: f.type === "repeatingTable" ? "table" : f.type,
          columns: f.columns?.map((c) => ({
            ...c,
            options: c.options?.map((o) => o.label),
          })),
          section: section.id,
          options: f.options?.map((o) => o.label),
          showIf:
            (f.showIf ?? section.showIf)
              ? {
                  field: (f.showIf ?? section.showIf).fieldId,
                  equals: String((f.showIf ?? section.showIf).value),
                  op: (f.showIf ?? section.showIf).op,
                }
              : undefined,
        })),
      )
    return {
      ...t,
      tableColumns: t.history?.columns,
      chartField: t.history?.chart?.fieldId,
      version: current.version,
      published: true,
      status: "Published",
      assigned: assigned.map((a) => a.clientId),
      assignments: Object.fromEntries(
        assigned.map((a) => [
          a.clientId,
          { version: a.version, status: "Active" },
        ]),
      ),
      sections: current.sections.map((s) => ({ id: s.id, title: s.title })),
      fields: fields(current),
      versions: t.versions.map((v) => ({
        version: v.version,
        sections: v.sections.map((s) => ({ id: s.id, title: s.title })),
        fields: fields(v),
      })),
    }
  }),
  records: snapshot.careRecords.map((r) => ({
    ...r,
    values: Object.fromEntries(
      Object.entries(r.values).map(([key, value]) => [
        key,
        Array.isArray(value) && value.length && typeof value[0] === "object"
          ? value.map((row) => row.values)
          : value,
      ]),
    ),
    author: snapshot.staff.find((e) => e.id === r.authorId)?.name,
    submittedAt: r.submittedAt ?? r.createdAt,
  })),
  diary: snapshot.diary.map((d) => ({
    ...d,
    author: snapshot.staff.find((e) => e.id === d.authorId)?.name,
    category: snapshot.diaryCategories.find((c) => c.id === d.categoryId)?.name,
    submittedAt: d.submittedAt ?? d.createdAt,
  })),
  categories: snapshot.diaryCategories.map((c) => ({
    ...c,
    status: c.active ? "Active" : "Inactive",
  })),
  corrections: [
    ...snapshot.attendanceCorrections.map((c) => ({
      ...c,
      recordType: "Timesheet",
      recordId: c.shiftId,
      status:
        c.status === "pending"
          ? "Pending"
          : c.status === "approved"
            ? "Approved"
            : "Rejected",
      submittedAt: c.requestedAt,
      by: snapshot.staff.find((e) => e.id === c.requestingEmployeeId)?.name,
      proposed: `${c.proposedClockIn ?? ""} / ${c.proposedClockOut ?? ""}`,
    })),
    ...snapshot.corrections.map((c) => ({
      ...c,
      status:
        c.status === "pending"
          ? "Pending"
          : c.status === "approved"
            ? "Approved"
            : "Rejected",
      submittedAt: c.requestedAt,
      by: snapshot.staff.find((e) => e.id === c.requestingEmployeeId)?.name,
    })),
  ],
  concerns: [],
  files: snapshot.attachments.map((f) => ({
    id: f.id,
    scope: f.association.scope,
    targetId: f.association.targetId,
    name: f.name,
    description: f.description,
    type:
      f.category === "image"
        ? "Image"
        : f.category === "pdf"
          ? "PDF"
          : "Document",
    size: `${f.bytes} bytes`,
    date: f.uploadedAt,
    by: snapshot.staff.find((e) => e.id === f.uploadedById)?.name,
    url:
      f.category === "image" && f.assetId
        ? fixtureAssetPath(f.assetId)
        : undefined,
  })),
  leave: [],
  audit: [],
  profileFields: [],
  org: {},
  perms: {},
  admin: { role: "Administrator", userId: "s1" },
}
await writeFile(join(root, "fixture.json"), JSON.stringify(fixture))
const store = await readFile(join(root, "staff/store.ts"), "utf8")
await writeFile(
  join(root, "staff/store.ts"),
  'import fixture from "../fixture.json";\n' +
    store.replace(
      "let state = initial",
      "let state = fixture as unknown as State",
    ),
)
await writeFile(
  join(root, "index.html"),
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body><div id="root"></div><script type="module" src="/comparison.tsx"></script></body></html>',
)
await writeFile(
  join(root, "comparison.tsx"),
  `import React from 'react';import {createRoot} from 'react-dom/client';import StaffApp from './staff/StaffApp';import LoginView from './views/LoginView';import './index.css';const login=new URLSearchParams(location.search).get('screen')==='login';createRoot(document.getElementById('root')!).render(login?<LoginView onLogin={()=>{}}/>:<StaffApp onLogout={()=>{}}/>);`,
)
const require = createRequire(import.meta.url)
const fromVitest = createRequire(require.resolve("vitest/package.json"))
const { createServer } = await import(pathToFileURL(fromVitest.resolve("vite")))
const { default: tailwind } = await import("@tailwindcss/postcss")
const server = await createServer({
  root,
  configFile: false,
  publicDir: resolve("public"),
  cacheDir: join(root, ".vite-cache"),
  optimizeDeps: {
    include: ["react", "react-dom/client", "leaflet", "react-leaflet"],
  },
  server: {
    host: "127.0.0.1",
    watch: null,
    hmr: false,
    port: 8557,
    strictPort: true,
    fs: { allow: [resolve(".")] },
  },
  css: { postcss: { plugins: [tailwind()] } },
  resolve: { dedupe: ["react", "react-dom"] },
})
await server.listen()
console.log("Original UI reference: http://localhost:8557")
const close = async () => {
  await server.close()
  process.exit()
}
process.on("SIGTERM", close)
process.on("SIGINT", close)
