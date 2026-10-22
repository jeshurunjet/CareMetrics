import Icon from "@/components/Icon"
export default function Pagination({
  page,
  total,
  per,
  onChange,
}: {
  page: number
  total: number
  per: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / per))
  if (total <= per) return null
  return (
    <nav aria-label="History pages" className="cm-pagination">
      <span>
        {(page - 1) * per + 1}–{Math.min(page * per, total)} of {total}
      </span>
      <div>
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="back" size={15} />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            aria-label={`Page ${i + 1}`}
            aria-current={page === i + 1 ? "page" : undefined}
            className={page === i + 1 ? "active" : ""}
            onClick={() => onChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevron" size={15} />
        </button>
      </div>
    </nav>
  )
}
