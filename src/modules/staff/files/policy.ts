import type { FileSelectionMetadata } from "./types"
/** Provisional development configuration, NOT an organisation-approved policy or security check. */
export const developmentFilePolicy = {
  maxBytes: 15 * 1024 * 1024,
  formats: [
    { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
    { mime: "image/png", extensions: ["png"] },
    { mime: "image/webp", extensions: ["webp"] },
    { mime: "application/pdf", extensions: ["pdf"] },
    { mime: "text/plain", extensions: ["txt"] },
    { mime: "text/csv", extensions: ["csv"] },
    {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extensions: ["docx"],
    },
    {
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extensions: ["xlsx"],
    },
  ],
}
export function validateFileSelection(
  file: Pick<FileSelectionMetadata, "name" | "type" | "size">,
  imagesOnly = false,
  policy = developmentFilePolicy,
): string | undefined {
  const format = policy.formats.find(
    (f) =>
      f.mime === file.type &&
      f.extensions.includes(file.name.split(".").at(-1)?.toLowerCase() ?? ""),
  )
  if (!format || (imagesOnly && !format.mime.startsWith("image/")))
    return "Unsupported file type. Choose an accepted file with a matching extension."
  if (!Number.isFinite(file.size) || file.size <= 0)
    return "Choose a non-empty file."
  if (file.size > policy.maxBytes)
    return `File exceeds the provisional development limit of ${formatBytes(policy.maxBytes)}.`
  return undefined
}
export const acceptedFiles = (imagesOnly = false) =>
  developmentFilePolicy.formats
    .filter((f) => !imagesOnly || f.mime.startsWith("image/"))
    .flatMap((f) => f.extensions.map((e) => `.${e}`))
    .join(",")
export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : bytes >= 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${bytes} bytes`
}
