import "server-only"
import { clientDiaryCategories } from "../../modules/diary/categories"
import { fromNZDateTimeInput } from "../../lib/time"
import { entityId } from "../errors"
import { object, text, invalid } from "../admin/validation"
export function diaryInput(value: unknown) {
  const p = object(value, [
    "requestId",
    "title",
    "categoryKey",
    "content",
    "coveredAt",
    "offShiftReason",
  ])
  const title = text(p, "title", 160, true),
    content = text(p, "content", 10000, true),
    reason = text(p, "offShiftReason", 1000),
    categoryKey = text(p, "categoryKey", 80, true),
    coveredLocal = text(p, "coveredAt", 16, true),
    coveredAt = fromNZDateTimeInput(coveredLocal),
    category = clientDiaryCategories.find((c) => c.id === categoryKey)
  if (content.length < 10)
    invalid("content", "Write at least a short note (10+ characters).")
  if (!category) invalid("categoryKey", "Choose a supported category.")
  if (!coveredAt)
    invalid(
      "coveredAt",
      "Choose a valid, unambiguous New Zealand date and time.",
    )
  return {
    requestId: entityId(p.requestId),
    title,
    content,
    offShiftReason: reason,
    categoryKey: category.id,
    category: category.name,
    coveredAt,
  }
}
