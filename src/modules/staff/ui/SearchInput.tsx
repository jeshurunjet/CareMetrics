"use client"
import Icon from "@/components/Icon"
export default function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  label = "Search",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  label?: string
}) {
  return (
    <label className="cm-search">
      <Icon name="search" size={17} />
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type="search"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <Icon name="x" size={15} />
        </button>
      )}
    </label>
  )
}
