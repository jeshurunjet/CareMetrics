"use client"
import { Modal, Btn } from "./index"
export default function PreviewActionDialog({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <Btn variant="secondary" onClick={onClose}>
          Close preview
        </Btn>
      }
    >
      <p className="cm-body">
        Development preview only. This action is not implemented. No file or
        record has been selected, uploaded, updated or saved.
      </p>
      <p className="cm-muted">
        Secure file handling and administrative editing will be implemented in a
        later phase.
      </p>
    </Modal>
  )
}
