import type { FileRecord } from "./types"
import { getDemoAsset } from "./adapter"
import { Icon } from "../ui"
export default function DownloadAction({ file }: { file: FileRecord }) {
  const asset = getDemoAsset(file)
  return asset ? (
    <a
      className="cm-btn cm-btn--secondary cm-btn--sm"
      href={asset.path}
      download={file.name}
      aria-label={`Download demonstration file ${file.name}`}
    >
      <Icon name="download" size={16} />
      Download demo
    </a>
  ) : (
    <button
      type="button"
      disabled
      title="No bundled asset is available. Secure download is not connected."
      aria-label={`Download unavailable for ${file.name}`}
    >
      <Icon name="download" size={16} />
      Unavailable
    </button>
  )
}
