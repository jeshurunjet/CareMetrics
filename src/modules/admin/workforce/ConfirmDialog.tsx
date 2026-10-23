"use client"
import type { ReactNode } from "react"
import { Modal, Btn } from "../../staff/ui"
interface ConfirmationProps {
  title: string
  text: ReactNode
  confirm: string
  tone?: "danger" | "primary"
  onClose: () => void
  onConfirm: () => void
}
export default function ConfirmDialog({
  title,
  text,
  confirm,
  tone = "primary",
  onClose,
  onConfirm,
}: ConfirmationProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Keep reviewing
          </Btn>
          <Btn variant={tone} onClick={onConfirm}>
            {confirm}
          </Btn>
        </>
      }
    >
      {text}
    </Modal>
  )
}
