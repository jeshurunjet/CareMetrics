import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import { readFileSync } from "node:fs"
import { hasUiReference } from "../reference-availability"
const clientGallery = "/clients/c1?tab=files",
  houseGallery = "/houses/h1?tab=files"
const png = readFileSync("public/demo-assets/garden-demo.png")
const textFile = (name = "fictional-selection.txt") => ({
  name,
  mimeType: "text/plain",
  buffer: Buffer.from("Harmless fictional public demonstration selection."),
})
async function select(
  page: Page,
  files: Parameters<ReturnType<Page["locator"]>["setInputFiles"]>[0],
) {
  await page
    .getByLabel("Select demonstration files", { exact: true })
    .setInputFiles(files)
  await expect(
    page.getByText("Validating selection metadata…", { exact: true }),
  ).toHaveCount(0)
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T01:00:00.000Z"))
  await page.route("https://images.unsplash.com/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#dde8e4"/></svg>',
    }),
  )
  await page.route(/https:\/\/.*basemaps\.cartocdn\.com\/.*/, (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0ed"/></svg>',
    }),
  )
})
test("client and house galleries remain scoped with metadata search filtering order and pagination", async ({
  page,
}) => {
  await page.goto("/clients/c1")
  await page.getByRole("tab", { name: "Gallery", exact: true }).click()
  await expect(page).toHaveURL(/clients\/c1\?tab=files$/)
  await expect(page.locator("[data-file-id]")).toHaveCount(6)
  await expect(page.locator("[data-file-id]").first()).toHaveAttribute(
    "data-file-id",
    "client-garden",
  )
  await expect(page.locator(".cm-file").first()).toContainText("Jamie Taufa")
  await expect(page.locator(".cm-file").first()).toContainText("KB")
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(page.locator("[data-file-id]")).toHaveCount(1)
  await expect(page.locator(".cm-file")).toContainText(".docx")
  await page.getByLabel("Search filenames", { exact: true }).fill("GARDEN")
  await expect(page.locator("[data-file-id]")).toHaveCount(1)
  await page.getByLabel("File type", { exact: true }).selectOption("pdf")
  await expect(
    page.getByText("No matching files", { exact: true }),
  ).toBeVisible()
  await page.getByLabel("Search filenames", { exact: true }).fill("")
  await expect(page.locator("[data-file-id]")).toHaveCount(1)
  await page.goto("/houses/h1")
  await page.getByRole("tab", { name: "Documents", exact: true }).click()
  await expect(page.locator("[data-file-id]")).toHaveCount(5)
  await expect(page.locator(".cm-gallery")).not.toContainText(
    "Demo activity-space",
  )
  await page
    .getByLabel("Search filenames", { exact: true })
    .fill("Different client")
  await expect(page.locator("[data-file-id]")).toHaveCount(0)
  await noOverflow(page)
})
test("details and image preview use real assets, preserve direct links and close with Escape/back", async ({
  page,
}) => {
  await page.goto(clientGallery)
  await page
    .getByRole("link", {
      name: "File information for Demo garden illustration.png",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toContainText("File information")
  await expect(page.getByRole("dialog")).toContainText("Taylor Reed")
  await expect(page.getByRole("dialog")).toContainText("Pacific/Auckland")
  await page.reload()
  await expect(page.getByRole("dialog")).toContainText("image/png")
  await page.getByRole("button", { name: "Preview file", exact: true }).click()
  const image = page
    .getByRole("dialog")
    .getByRole("img", { name: "Demo garden illustration.png", exact: true })
  await expect(image).toBeVisible()
  await expect
    .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page).toHaveURL(/tab=files$/)
  await page.goBack()
  await expect(page.getByRole("dialog")).toBeVisible()
  await noOverflow(page)
})
test("download works only for bundled assets; PDF and other unsupported previews explain availability", async ({
  page,
  request,
}) => {
  await page.goto(clientGallery)
  const downloaded = page.waitForEvent("download")
  await page
    .getByRole("link", {
      name: "Download demonstration file Public demonstration notes.txt",
      exact: true,
    })
    .click()
  const file = await downloaded
  expect(file.suggestedFilename()).toBe("Public demonstration notes.txt")
  expect(await file.failure()).toBeNull()
  const response = await request.get("/demo-assets/public-demo-readme.txt")
  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain("PUBLIC DEMONSTRATION ASSET")
  await page
    .getByRole("link", {
      name: "Preview Fictional document example.pdf",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "No bundled PDF is available",
  )
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Download unavailable/ }),
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await page.getByLabel("File type", { exact: true }).selectOption("document")
  await page
    .getByRole("link", {
      name: "Preview Fictional document example.docx",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toContainText("Preview not available")
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Download unavailable/ }),
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: /Delete|Remove existing|Remove file/ }),
  ).toHaveCount(0)
})
test("empty galleries and invalid or unrelated file IDs reveal no protected metadata", async ({
  page,
}) => {
  await page.goto("/clients/c3?tab=files")
  await expect(
    page.getByText(
      "No documents or photos have been uploaded for this client yet.",
      { exact: true },
    ),
  ).toBeVisible()
  await page.goto("/houses/h2?tab=files")
  await expect(
    page.getByText(
      "No documents or photos have been uploaded for this house yet.",
      { exact: true },
    ),
  ).toBeVisible()
  for (const url of [
    "/clients/c4?tab=files",
    "/houses/h3?tab=files",
    "/clients/c1?tab=files&fileId=a&fileId=b",
  ])
    expect((await page.goto(url))?.status()).toBe(404)
  for (const url of [
    `${clientGallery}&fileId=house-garden`,
    `${houseGallery}&fileId=client-garden`,
    `${clientGallery}&fileId=private-client-file`,
    `${houseGallery}&fileId=private-house-file`,
    `${clientGallery}&fileId=missing`,
    `${clientGallery}&fileId=client-garden&action=bad`,
  ]) {
    await page.goto(url)
    await expect(
      page.getByText("File unavailable", { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText(/Restricted (client|house) file example/),
    ).toHaveCount(0)
    await expect(page.getByRole("dialog")).toHaveCount(0)
  }
})
test("selection validates central types and provisional size, supports duplicate names and removes only unsent items", async ({
  page,
}) => {
  await page.goto(clientGallery)
  await select(page, [
    {
      name: "unsupported.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("demo"),
    },
    {
      name: "large.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(15 * 1024 * 1024 + 1),
    },
    textFile(),
    textFile(),
  ])
  await expect(page.getByText(/Unsupported file type/)).toBeVisible()
  await expect(
    page.getByText(/File exceeds the provisional development limit/),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Simulate upload", exact: true }),
  ).toBeDisabled()
  await page
    .getByRole("button", {
      name: "Remove unsupported.exe from selection",
      exact: true,
    })
    .click()
  await page
    .getByRole("button", {
      name: "Remove large.pdf from selection",
      exact: true,
    })
    .click()
  await page
    .getByRole("button", {
      name: "Remove fictional-selection.txt from selection",
      exact: true,
    })
    .first()
    .click()
  await expect(page.locator(".cm-selection-row")).toHaveCount(1)
  await expect(page.locator("[data-file-id]")).toHaveCount(6)
  await page
    .getByRole("button", { name: "Cancel selection", exact: true })
    .click()
  await expect(
    page.getByText("Selection cancelled. Nothing was uploaded.", {
      exact: true,
    }),
  ).toBeVisible()
  await noOverflow(page)
})
test("simulated upload shows progress and session-only metadata then resets on reload", async ({
  page,
}) => {
  const writes: string[] = []
  page.on("request", (r) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
      writes.push(r.url())
  })
  await page.goto(houseGallery)
  await select(page, textFile("house-session-demo.txt"))
  await page
    .getByLabel("Description (optional)", { exact: true })
    .fill("Harmless temporary example")
  await page
    .getByRole("button", { name: "Simulate upload", exact: true })
    .click()
  await expect(
    page.getByRole("progressbar", {
      name: "Simulated upload progress",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText(
      /Development preview completed: temporary file metadata added/,
    ),
  ).toBeVisible()
  await expect(page.locator("[data-file-id]").first()).toContainText(
    "house-session-demo.txt",
  )
  await expect(page.locator("[data-file-id]").first()).toContainText(
    "Temporary metadata",
  )
  await page
    .getByRole("link", {
      name: "File information for house-session-demo.txt",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toContainText(
    "contents were not retained",
  )
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Download unavailable/ }),
  ).toBeDisabled()
  await page.reload()
  await expect(
    page.getByText("File unavailable", { exact: true }),
  ).toBeVisible()
  expect(writes.filter((url) => !url.includes("__nextjs"))).toEqual([])
})
test("simulated failure retry and mid-upload cancellation never create false completed files", async ({
  page,
}) => {
  await page.goto(clientGallery)
  await select(page, textFile())
  await page
    .getByLabel("Demo upload outcome", { exact: true })
    .selectOption("failure")
  await page
    .getByRole("button", { name: "Simulate upload", exact: true })
    .click()
  await expect(
    page.getByText(/Simulated upload failed. No file contents were sent/),
  ).toBeVisible()
  await expect(page.locator("[data-file-id]")).toHaveCount(6)
  await page
    .getByLabel("Demo upload outcome", { exact: true })
    .selectOption("success")
  await page
    .getByRole("button", { name: "Retry simulated upload", exact: true })
    .click()
  await expect(page.getByText(/Development preview completed/)).toBeVisible()
  await select(page, textFile("cancelled-demo.txt"))
  await page
    .getByRole("button", { name: "Simulate upload", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Cancel selection", exact: true })
    .click()
  await expect(
    page.getByText("Selection cancelled. Nothing was uploaded.", {
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByLabel("Search filenames", { exact: true })
    .fill("cancelled-demo")
  await expect(page.locator("[data-file-id]")).toHaveCount(0)
})
test("client and house profile photo selection previews validates cancels and resets", async ({
  page,
}) => {
  for (const scope of ["client", "house"]) {
    await page.goto(scope === "client" ? "/clients/c1" : "/houses/h1")
    await page
      .getByRole("button", {
        name:
          scope === "client"
            ? "Preview photo update for Taylor"
            : "Update house photo",
        exact: true,
      })
      .click()
    await page
      .getByLabel("Select profile demonstration photo", { exact: true })
      .setInputFiles({
        name: "invalid.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("demo"),
      })
    await expect(page.getByRole("dialog")).toContainText(
      "Unsupported file type",
    )
    await page
      .getByLabel("Select profile demonstration photo", { exact: true })
      .setInputFiles({
        name: "fictional-photo.png",
        mimeType: "image/png",
        buffer: png,
      })
    await expect(page.getByRole("dialog").getByRole("img")).toBeVisible()
    await page
      .getByRole("button", { name: "Cancel photo selection", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await page
      .getByRole("button", {
        name:
          scope === "client"
            ? "Preview photo update for Taylor"
            : "Update house photo",
        exact: true,
      })
      .click()
    await page
      .getByLabel("Select profile demonstration photo", { exact: true })
      .setInputFiles({
        name: "fictional-photo.png",
        mimeType: "image/png",
        buffer: png,
      })
    await page
      .getByRole("button", { name: "Use temporary photo", exact: true })
      .click()
    await expect(page.getByText(/Temporary photo preview only/)).toBeVisible()
    const image =
      scope === "client"
        ? page.locator(".cm-profile-head .cm-avatar img")
        : page.locator(".cm-house-banner img")
    await expect(image).toHaveAttribute("src", /^blob:/)
    await page.reload()
    await expect(page.getByText(/Temporary photo preview only/)).toHaveCount(0)
    await noOverflow(page)
  }
})
test("image loading failure and retry remain usable without unknown remote file URLs", async ({
  page,
}) => {
  await page.route("**/demo-assets/garden-demo.png", (r) => r.abort())
  await page.goto(`${clientGallery}&fileId=client-garden&action=preview`)
  await expect(
    page
      .getByRole("dialog")
      .getByText("Image preview unavailable.", { exact: true }),
  ).toBeVisible()
  await page.unroute("**/demo-assets/garden-demo.png")
  await page
    .getByRole("button", { name: "Retry image preview", exact: true })
    .click()
  await expect(
    page
      .getByRole("dialog")
      .getByRole("img", { name: "Demo garden illustration.png", exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})
test("capture gallery source comparisons and responsive file states", async ({
  page,
}, info) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await mkdir("test-results/phase-1c4", { recursive: true })
  const capture = async (name: string, focus?: string) => {
    await page.evaluate(() => document.fonts.ready)
    if (focus)
      await page
        .locator(focus)
        .first()
        .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, 0)
      document.querySelector(".cm-app")?.scrollTo(0, 0)
    })
    if (name.startsWith("migrated")) await noOverflow(page)
    await page.screenshot({
      animations: "disabled",
      style: "nextjs-portal{display:none!important}",
      path: `test-results/phase-1c4/${info.project.name}-${name}.png`,
    })
  }
  await page.goto(clientGallery)
  await expect(page.locator("[data-file-id]")).toHaveCount(6)
  const thumbnail = page.locator(".cm-file-thumb").first()
  const thumbnailBounds = await thumbnail.boundingBox()
  const imageBounds = await thumbnail.getByRole("img").boundingBox()
  const metadataBounds = await page
    .locator(".cm-file-meta")
    .first()
    .boundingBox()
  expect(imageBounds!.y + imageBounds!.height).toBeLessThanOrEqual(
    thumbnailBounds!.y + thumbnailBounds!.height + 1,
  )
  expect(metadataBounds!.y).toBeGreaterThanOrEqual(
    thumbnailBounds!.y + thumbnailBounds!.height - 1,
  )
  await capture("migrated-client", ".cm-file-grid")
  await page.getByLabel("File type", { exact: true }).selectOption("document")
  await capture("migrated-documents", ".cm-file-grid")
  await page
    .getByRole("link", {
      name: "File information for Public demonstration notes.txt",
      exact: true,
    })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await capture("migrated-details")
  await page.keyboard.press("Escape")
  await page.goto(`${clientGallery}&fileId=client-garden&action=preview`)
  await expect(page.getByRole("dialog").getByRole("img")).toBeVisible()
  await capture("migrated-preview")
  await page.keyboard.press("Escape")
  await select(page, [
    { name: "fictional-photo.png", mimeType: "image/png", buffer: png },
    textFile(),
  ])
  await capture("migrated-selection", ".cm-gallery-upload")
  await select(page, {
    name: "unsupported.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("demo"),
  })
  await capture("migrated-upload-error", ".cm-selection-row.cm-upload--error")
  await page
    .getByRole("button", { name: "Cancel selection", exact: true })
    .click()
  await page.goto(houseGallery)
  await capture("migrated-house", ".cm-file-grid")
  await page.goto("/houses/h2?tab=files")
  await expect(page.locator(".cm-gallery .cm-empty")).toBeVisible()
  await capture("migrated-empty", ".cm-gallery .cm-empty")
  await page.goto("/clients/c1")
  await page
    .getByRole("button", {
      name: "Preview photo update for Taylor",
      exact: true,
    })
    .click()
  await page
    .getByLabel("Select profile demonstration photo", { exact: true })
    .setInputFiles({
      name: "fictional-photo.png",
      mimeType: "image/png",
      buffer: png,
    })
  await capture("migrated-photo")
  await page.keyboard.press("Escape")
  if (hasUiReference) {
    const originalClient = async (name = "Taylor Reed") => {
      await page.goto("http://localhost:8557")
      await page
        .locator(".cm-sidebar-nav,.cm-bottom-nav")
        .getByRole("button", { name: "Houses", exact: true })
        .filter({ visible: true })
        .click()
      await page.locator(".cm-house-card").first().click()
      await page.locator(".cm-client-card").filter({ hasText: name }).click()
      await page.getByRole("tab", { name: "Gallery", exact: true }).click()
    }
    await originalClient()
    await expect(page.locator(".cm-file")).toHaveCount(7)
    await capture("original-client", ".cm-file-grid")
    await page
      .locator(".cm-file")
      .filter({ hasText: "Public demonstration notes.txt" })
      .getByRole("button", { name: "File information", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await capture("original-details")
    await page.getByRole("button", { name: "Close", exact: true }).click()
    // The exported gallery has no document-only filter or alternate list switch.
    // Focus its original document cards; do not alter source markup/CSS.
    await page
      .locator(".cm-file")
      .filter({ hasText: "Public demonstration notes.txt" })
      .evaluate((el) => el.scrollIntoView({ block: "start" }))
    await capture("original-documents")
    await page
      .getByRole("button", {
        name: "Preview Demo garden illustration.png",
        exact: true,
      })
      .click()
    await capture("original-preview")
    await page.getByRole("button", { name: "Close", exact: true }).click()
    await page.locator('input[type="file"][multiple]').setInputFiles({
      name: "source-error.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(15 * 1024 * 1024 + 1),
    })
    await expect(
      page.getByText("File exceeds 15 MB limit", { exact: true }),
    ).toBeVisible()
    await capture("original-upload-error", ".cm-dropzone")
    await page.getByRole("button", { name: "Dismiss", exact: true }).click()
    await expect(page.locator(".cm-toast")).toHaveCount(0)
    // The source immediately starts a simulation; capture its initial progress state.
    await page.locator('input[type="file"][multiple]').setInputFiles(textFile())
    await capture("original-selection", ".cm-dropzone")
    await page.goto("http://localhost:8557")
    await page
      .locator(".cm-sidebar-nav,.cm-bottom-nav")
      .getByRole("button", { name: "Houses", exact: true })
      .filter({ visible: true })
      .click()
    await page.locator(".cm-house-card").first().click()
    await page.getByRole("tab", { name: "Documents", exact: true }).click()
    await capture("original-house", ".cm-file-grid")
    await page
      .locator(".cm-sidebar-nav,.cm-bottom-nav")
      .getByRole("button", { name: "Houses", exact: true })
      .filter({ visible: true })
      .click()
    await page
      .locator(".cm-house-card")
      .filter({ hasText: "Sunrise House" })
      .click()
    await page.getByRole("tab", { name: "Documents", exact: true }).click()
    await capture("original-empty", ".cm-stack")
    await originalClient()
    await page.locator('.cm-photo-edit input[type="file"]').setInputFiles({
      name: "fictional-photo.png",
      mimeType: "image/png",
      buffer: png,
    })
    await capture("original-photo", ".cm-profile-head")
  }
  expect(errors).toEqual([])
})
