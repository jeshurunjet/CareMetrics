import { Icon } from "../ui"
import type { FileRecord } from "./types"
export default function FileTypeIcon({ file }: { file: FileRecord }) {
  return (
    <span className={`cm-file-icon cm-file-icon--${file.category}`}>
      <Icon name={file.category === "image" ? "image" : "file"} size={26} />
      <b>
        {file.category === "image"
          ? "IMG"
          : file.category === "pdf"
            ? "PDF"
            : "DOC"}
      </b>
    </span>
  )
}
