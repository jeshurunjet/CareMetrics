"use client"
import type { ButtonHTMLAttributes } from "react"
import Icon from "@/components/Icon"
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success"
  icon?: string
  block?: boolean
  size?: "sm" | "md" | "lg"
}
export default function Btn({
  variant = "primary",
  icon,
  block,
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button
      type={type}
      className={`cm-btn cm-btn--${variant} cm-btn--${size} ${
        block ? "cm-btn--block" : ""
      } ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  )
}
