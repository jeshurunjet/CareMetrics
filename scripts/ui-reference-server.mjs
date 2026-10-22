// Test-only original-export renderer. Never imported by the application or included in deployment.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import ts from "typescript"
const root = resolve(".ui-reference")
await mkdir(root, { recursive: true })
await cp("reference/figma-export", root, { recursive: true })
for (const name of ["types", "selectors", "development-mock-adapter"]) {
  const source = await readFile(`src/modules/staff/data/${name}.ts`, "utf8")
  const js = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(/from ['"]\.\/selectors['"]/g, 'from "./selectors.mjs"')
  await writeFile(join(root, `${name}.mjs`), js)
}
const { developmentMockAdapter } = await import(
  pathToFileURL(join(root, "development-mock-adapter.mjs"))
)
const snapshot = developmentMockAdapter.getSnapshot(
  "s1",
  "2026-10-22T01:00:00.000Z",
)
const fixture = {
  ...snapshot,
  staff: snapshot.staff.map((e) => ({
    ...e,
    houses: snapshot.assignments
      .filter((a) => a.employeeId === e.id)
      .map((a) => a.houseId),
  })),
  attendance: [],
  templates: [],
  records: [],
  diary: [],
  categories: [],
  corrections: [],
  concerns: [],
  files: [],
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
  server: {
    host: "127.0.0.1",
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
