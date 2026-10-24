import { expect, type Page } from "@playwright/test"
import { backToAdmin, staffClient, tab } from "./documentation-helpers"
export async function staffRecord(
  page: Page,
  kind: "diary" | "care" | "chart",
  id: string,
  template = "t1",
) {
  await staffClient(page, kind)
  if (kind === "diary")
    await expect(page.locator(".cm-history").first()).toBeVisible()
  if (kind !== "diary")
    await page
      .locator(
        `a[href="/clients/c1?tab=${
          kind === "chart" ? "charting" : "care"
        }&sub=${template}"]`,
      )
      .click()
  const href =
    kind === "diary"
      ? `/clients/c1?tab=diary&item=${id}`
      : `/clients/c1?tab=${
          kind === "chart" ? "charting" : "care"
        }&sub=${template}&item=${id}`
  await expect(
    page
      .locator(kind === "chart" ? ".cm-chart-history" : ".cm-history")
      .first(),
  ).toBeVisible()
  const expand = async () => {
    const closed = page.locator('.cm-history-head[aria-expanded="false"]')
    while (await closed.count()) await closed.first().click()
  }
  if (kind !== "chart") await expand()
  if ((await page.locator(`a[href="${href}"]`).count()) === 0) {
    await page.getByRole("button", { name: "Next page", exact: true }).click()
    if (kind !== "chart") await expand()
  }
  await page.locator(`a[href="${href}"]`).click()
  await expect(
    page.getByRole("link", { name: "Request correction", exact: true }),
  ).toBeVisible()
}
export async function request(
  page: Page,
  reason: string,
  proposed: string,
  targetLabel?: string,
  value?: string,
) {
  await page
    .getByRole("link", { name: "Request correction", exact: true })
    .click()
  if (targetLabel) {
    await page
      .getByLabel("Affected field or table cell (optional)", { exact: true })
      .selectOption({ label: targetLabel })
    await page
      .getByRole("checkbox", { name: "Apply a structured value", exact: true })
      .check()
    await page.getByLabel("Proposed answer value", { exact: true }).fill(value!)
  }
  await page.getByLabel("Reason for correction", { exact: true }).fill(reason)
  await page.getByLabel("Proposed correction", { exact: true }).fill(proposed)
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click()
  await expect(
    page.getByRole("heading", {
      name: "Correction pending review",
      exact: true,
    }),
  ).toBeVisible()
  return new URL(page.url()).searchParams.get("item")!
}
export async function review(page: Page, reason: string) {
  await backToAdmin(page)
  await page
    .locator(".ad-nav")
    .getByRole("link", { name: /^Care Documentation/ })
    .click()
  await tab(page, "Correction requests")
  const row = page.getByRole("row").filter({ hasText: reason })
  await expect(row).toHaveCount(1)
  await row.getByRole("link", { name: /View request/ }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Correction request",
  )
}
export async function decide(
  page: Page,
  outcome: "Approve" | "Reject",
  notes = "Reviewed fictional proposal",
) {
  if (notes) await page.getByLabel("Review notes", { exact: true }).fill(notes)
  await page.getByRole("button", { name: outcome, exact: true }).click()
  const d = page.getByRole("dialog", {
    name: `${outcome} correction?`,
    exact: true,
  })
  await expect(d).toBeVisible()
  await d
    .getByRole("button", { name: `${outcome} correction`, exact: true })
    .click()
  await expect(d).toHaveCount(0)
  await expect(page.locator(".ad-content")).toContainText(
    outcome === "Approve" ? "Approved" : "Rejected",
  )
}
