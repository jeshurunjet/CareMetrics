import { useState } from 'react'

type FieldType = 'text' | 'longtext' | 'number' | 'date' | 'time' | 'yesno' | 'single' | 'multiple' | 'dropdown' | 'rating'

interface TemplateField {
  id: string
  type: FieldType
  label: string
  required: boolean
  options?: string[]
}

interface Template {
  id: string
  name: string
  description: string
  fields: TemplateField[]
  assignedTo: string[]
  version: number
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
}

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't1', name: 'Personal Care', description: "Documents support provided for the client's daily personal hygiene and grooming routines.",
    status: 'active', version: 3, lastUpdated: '2026-08-10', assignedTo: ['Peter Tumai', 'George Henare'],
    fields: [
      { id: 'f1', type: 'yesno', label: 'Shower / bath assisted', required: true },
      { id: 'f2', type: 'yesno', label: 'Oral hygiene completed', required: true },
      { id: 'f3', type: 'single', label: 'Mood / affect', required: false, options: ['Happy', 'Calm', 'Anxious', 'Distressed', 'Fatigued'] },
      { id: 'f4', type: 'longtext', label: 'Additional notes', required: false },
    ]
  },
  {
    id: 't2', name: 'Fluid Intake', description: 'Records fluid intake across the shift to support client hydration monitoring.',
    status: 'active', version: 1, lastUpdated: '2026-08-01', assignedTo: ['Peter Tumai'],
    fields: [
      { id: 'f1', type: 'number', label: 'Total fluids (ml)', required: true },
      { id: 'f2', type: 'multiple', label: 'Fluid types offered', required: false, options: ['Water', 'Juice', 'Tea/Coffee', 'Milk', 'Supplement'] },
      { id: 'f3', type: 'yesno', label: 'Client cooperative with fluid intake', required: false },
      { id: 'f4', type: 'longtext', label: 'Notes', required: false },
    ]
  },
  {
    id: 't3', name: 'Behaviour Observation', description: 'Captures behaviour events and support strategies used during the shift.',
    status: 'active', version: 2, lastUpdated: '2026-07-28', assignedTo: ['George Henare', 'Sandra Parata'],
    fields: [
      { id: 'f1', type: 'yesno', label: 'Behaviour event occurred', required: true },
      { id: 'f2', type: 'single', label: 'Behaviour intensity', required: false, options: ['Low', 'Moderate', 'High'] },
      { id: 'f3', type: 'longtext', label: 'Describe the behaviour and context', required: false },
      { id: 'f4', type: 'longtext', label: 'Support strategies used', required: false },
      { id: 'f5', type: 'yesno', label: 'Supervisor notified', required: false },
    ]
  },
  {
    id: 't4', name: 'Sleep Record', description: 'Tracks overnight sleep quality and any disturbances.',
    status: 'draft', version: 1, lastUpdated: '2026-08-15', assignedTo: [],
    fields: [
      { id: 'f1', type: 'time', label: 'Time settled to sleep', required: true },
      { id: 'f2', type: 'time', label: 'Time woke', required: true },
      { id: 'f3', type: 'rating', label: 'Sleep quality (1–5)', required: false },
      { id: 'f4', type: 'longtext', label: 'Disturbances / notes', required: false },
    ]
  },
]

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Short Text', icon: 'T' },
  { type: 'longtext', label: 'Long Text', icon: '¶' },
  { type: 'number', label: 'Number', icon: '#' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'time', label: 'Time', icon: '⏰' },
  { type: 'yesno', label: 'Yes / No', icon: '✓' },
  { type: 'single', label: 'Single Choice', icon: '◉' },
  { type: 'multiple', label: 'Multiple Choice', icon: '☑' },
  { type: 'dropdown', label: 'Dropdown', icon: '▼' },
  { type: 'rating', label: 'Rating / Scale', icon: '★' },
]

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: '#e6f7f1', color: '#2a9d6f' },
  draft: { label: 'Draft', bg: '#fff7e0', color: '#d97706' },
  archived: { label: 'Archived', bg: 'var(--color-surface)', color: 'var(--color-ink-faint)' },
}

type Mode = 'list' | 'builder' | 'preview' | 'assign'

export default function CareManagementView() {
  const [mode, setMode] = useState<Mode>('list')
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [selected, setSelected] = useState<Template | null>(null)
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)

  function openBuilder(t?: Template) {
    const tpl = t ?? {
      id: `t${Date.now()}`, name: '', description: '', status: 'draft' as const,
      version: 1, lastUpdated: new Date().toISOString().slice(0, 10), assignedTo: [], fields: []
    }
    setEditTemplate(JSON.parse(JSON.stringify(tpl)))
    setMode('builder')
  }

  function saveTemplate(t: Template) {
    setTemplates(prev => prev.some(p => p.id === t.id) ? prev.map(p => p.id === t.id ? t : p) : [...prev, t])
    setMode('list')
  }

  if (mode === 'builder' && editTemplate) {
    return <TemplateBuilder template={editTemplate} onSave={saveTemplate} onCancel={() => setMode('list')} onPreview={() => setMode('preview')} />
  }

  if (mode === 'preview' && editTemplate) {
    return <TemplatePreview template={editTemplate} onBack={() => setMode('builder')} onSave={() => { saveTemplate(editTemplate); setMode('list') }} />
  }

  if (mode === 'assign' && selected) {
    return <AssignTemplate template={selected} onBack={() => setMode('list')} />
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--color-ink)' }}>Care Management</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-faint)' }}>Define and manage configurable care templates for your clients.</p>
        </div>
        <button onClick={() => openBuilder()} style={btnPrimary}>+ New Template</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Templates', value: templates.filter(t => t.status === 'active').length, color: '#2a9d6f' },
          { label: 'Draft', value: templates.filter(t => t.status === 'draft').length, color: '#d97706' },
          { label: 'Total Templates', value: templates.length, color: 'var(--color-brand)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Version awareness notice */}
      <div style={{ background: '#e6f3f5', border: '1px solid rgba(26,107,122,0.15)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ color: 'var(--color-brand)', flexShrink: 0, fontSize: 16 }}>ℹ</span>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
          Editing a template creates a new version. Historical care records recorded with previous versions remain unchanged and continue to display correctly.
        </p>
      </div>

      {/* Template list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {templates.map(t => {
          const st = STATUS_STYLE[t.status]
          return (
            <div key={t.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)' }}>{t.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>v{t.version}</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--color-ink-muted)' }}>{t.description}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-ink-faint)' }}>
                  <span>{t.fields.length} field{t.fields.length !== 1 ? 's' : ''}</span>
                  <span>Updated {t.lastUpdated}</span>
                  {t.assignedTo.length > 0 && <span>Assigned to {t.assignedTo.length} client{t.assignedTo.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setSelected(t); setMode('assign') }} style={btnOutline}>Assign</button>
                <button onClick={() => openBuilder(t)} style={btnOutline}>Edit</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TemplateBuilder({ template, onSave, onCancel, onPreview }: { template: Template; onSave: (t: Template) => void; onCancel: () => void; onPreview: () => void }) {
  const [tpl, setTpl] = useState<Template>(template)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function addField(type: FieldType) {
    const field: TemplateField = { id: `f${Date.now()}`, type, label: '', required: false }
    if (['single', 'multiple', 'dropdown'].includes(type)) field.options = ['Option 1', 'Option 2']
    setTpl(t => ({ ...t, fields: [...t.fields, field] }))
  }

  function updateField(id: string, patch: Partial<TemplateField>) {
    setTpl(t => ({ ...t, fields: t.fields.map(f => f.id === id ? { ...f, ...patch } : f) }))
  }

  function removeField(id: string) {
    setTpl(t => ({ ...t, fields: t.fields.filter(f => f.id !== id) }))
  }

  function moveField(from: number, to: number) {
    setTpl(t => {
      const fields = [...t.fields]
      const [item] = fields.splice(from, 1)
      fields.splice(to, 0, item)
      return { ...t, fields }
    })
  }

  return (
    <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'flex-start' }}>
      {/* Field palette */}
      <div style={{ position: 'sticky', top: 24 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Add Field</div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FIELD_TYPES.map(ft => (
              <button key={ft.type} onClick={() => addField(ft.type)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--color-ink)', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-brand)', flexShrink: 0 }}>{ft.icon}</span>
                {ft.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Builder canvas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-muted)', fontSize: 13, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Templates
          </button>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--color-ink)', fontWeight: 600 }}>{tpl.name || 'New Template'}</span>
          <div style={{ flex: 1 }} />
          <button onClick={onPreview} style={btnOutline}>Preview Form</button>
          <button onClick={() => onSave(tpl)} style={btnPrimary}>Save Template</button>
        </div>

        {/* Template metadata */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div><label style={labelStyle}>Template Name</label><input value={tpl.name} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} placeholder="e.g. Personal Care" style={inputStyle} /></div>
            <div><label style={labelStyle}>Status</label><select value={tpl.status} onChange={e => setTpl(t => ({ ...t, status: e.target.value as Template['status'] }))} style={inputStyle}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
          </div>
          <div><label style={labelStyle}>Description</label><input value={tpl.description} onChange={e => setTpl(t => ({ ...t, description: e.target.value }))} placeholder="What does this care section record?" style={inputStyle} /></div>
        </div>

        {/* Fields */}
        {tpl.fields.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 14, border: '2px dashed var(--color-border)', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>No fields yet</div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>Use the panel on the left to add fields to this template.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tpl.fields.map((field, idx) => (
              <FieldEditor key={field.id} field={field} index={idx} total={tpl.fields.length}
                onChange={patch => updateField(field.id, patch)}
                onRemove={() => removeField(field.id)}
                onMove={(dir) => moveField(idx, idx + dir)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FieldEditor({ field, index, total, onChange, onRemove, onMove }: { field: TemplateField; index: number; total: number; onChange: (p: Partial<TemplateField>) => void; onRemove: () => void; onMove: (dir: 1 | -1) => void }) {
  const ft = FIELD_TYPES.find(f => f.type === field.type)
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: expanded ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)' }}>
        <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)', width: 20, textAlign: 'center' }}>{index + 1}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--color-brand-light)', color: 'var(--color-brand)', fontWeight: 700 }}>{ft?.label}</span>
        <span style={{ flex: 1, fontSize: 13, color: field.label ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontWeight: field.label ? 600 : 400 }}>{field.label || 'Untitled field'}</span>
        {field.required && <span style={{ fontSize: 10, fontWeight: 700, color: '#dc3545' }}>Required</span>}
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>↑</IconBtn>
          <IconBtn title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>↓</IconBtn>
          <IconBtn title={expanded ? 'Collapse' : 'Expand'} onClick={() => setExpanded(e => !e)}>{expanded ? '▲' : '▼'}</IconBtn>
          <IconBtn title="Remove field" onClick={onRemove} danger>×</IconBtn>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
            <div><label style={labelStyle}>Field Label</label><input value={field.label} onChange={e => onChange({ label: e.target.value })} placeholder={`Label for this ${ft?.label} field`} style={inputStyle} /></div>
            <div style={{ paddingTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-ink)' }}>
                <input type="checkbox" checked={field.required} onChange={e => onChange({ required: e.target.checked })} />
                Required
              </label>
            </div>
          </div>
          {['single', 'multiple', 'dropdown'].includes(field.type) && (
            <div>
              <label style={labelStyle}>Options (one per line)</label>
              <textarea rows={3} value={(field.options ?? []).join('\n')} onChange={e => onChange({ options: e.target.value.split('\n') })} style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' } as React.CSSProperties} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TemplatePreview({ template, onBack, onSave }: { template: Template; onBack: () => void; onSave: () => void }) {
  return (
    <div style={{ padding: 32, maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-muted)', fontSize: 13, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Builder
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={onSave} style={btnPrimary}>Save Template</button>
      </div>

      <div style={{ background: '#fff7e0', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#d97706', fontWeight: 600 }}>
        ⚠ Preview only — this form will not submit data.
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-brand)', color: 'white' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{template.name || 'Untitled Template'}</div>
          {template.description && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{template.description}</div>}
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {template.fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 14, color: 'var(--color-ink-faint)' }}>No fields added yet.</div>
          ) : template.fields.map((field, i) => <PreviewField key={i} field={field} />)}
          {template.fields.length > 0 && (
            <div>
              <label style={labelStyle}>Additional Notes</label>
              <textarea rows={3} placeholder="Any additional observations…" style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' } as React.CSSProperties} />
            </div>
          )}
        </div>
        {template.fields.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnPrimary}>Submit Care Record</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewField({ field }: { field: TemplateField }) {
  const req = field.required ? <span style={{ color: '#dc3545', marginLeft: 4 }}>*</span> : null
  return (
    <div>
      <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>{field.label || 'Untitled'}{req}</label>
      {field.type === 'text' && <input placeholder="Enter text…" style={inputStyle} />}
      {field.type === 'longtext' && <textarea rows={3} placeholder="Enter details…" style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' } as React.CSSProperties} />}
      {field.type === 'number' && <input type="number" placeholder="0" style={{ ...inputStyle, width: 160 }} />}
      {field.type === 'date' && <input type="date" style={{ ...inputStyle, width: 200 }} />}
      {field.type === 'time' && <input type="time" style={{ ...inputStyle, width: 160 }} />}
      {field.type === 'yesno' && (
        <div style={{ display: 'flex', gap: 12 }}>
          {['Yes', 'No'].map(opt => <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="radio" name={field.id} />{opt}</label>)}
        </div>
      )}
      {field.type === 'single' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(field.options ?? []).map(opt => <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--color-border)', background: 'white' }}><input type="radio" name={field.id} />{opt}</label>)}
        </div>
      )}
      {field.type === 'multiple' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(field.options ?? []).map(opt => <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--color-border)', background: 'white' }}><input type="checkbox" />{opt}</label>)}
        </div>
      )}
      {field.type === 'dropdown' && (
        <select style={{ ...inputStyle, width: 280 }}><option value="">Select…</option>{(field.options ?? []).map(o => <option key={o}>{o}</option>)}</select>
      )}
      {field.type === 'rating' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} style={{ width: 40, height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>{n}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function AssignTemplate({ template, onBack }: { template: Template; onBack: () => void }) {
  const clients = ['Peter Tumai', 'Grace Williams', 'Tom Ngatai', 'George Henare', 'Sandra Parata', 'Mark Fletcher', 'Annie Xu']
  const [assigned, setAssigned] = useState<string[]>(template.assignedTo)

  function toggle(name: string) {
    setAssigned(a => a.includes(name) ? a.filter(n => n !== name) : [...a, name])
  }

  return (
    <div style={{ padding: 32, maxWidth: 560 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-muted)', fontSize: 13, padding: 0, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Templates
      </button>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '0 0 6px', color: 'var(--color-ink)' }}>Assign Template</h2>
      <p style={{ fontSize: 14, color: 'var(--color-ink-faint)', margin: '0 0 24px' }}>Select which clients should use the <strong>{template.name}</strong> care template.</p>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 20 }}>
        {clients.map((c, i) => (
          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < clients.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', background: assigned.includes(c) ? 'var(--color-brand-light)' : 'white' }}>
            <input type="checkbox" checked={assigned.includes(c)} onChange={() => toggle(c)} />
            <Avatar name={c} size={34} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{c}</span>
            {assigned.includes(c) && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--color-brand)' }}>Assigned</span>}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={btnPrimary} onClick={onBack}>Save Assignments</button>
        <button style={btnOutline} onClick={onBack}>Cancel</button>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title, disabled = false, danger = false }: { children: React.ReactNode; onClick: () => void; title?: string; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: disabled ? 'var(--color-ink-faint)' : danger ? '#dc3545' : 'var(--color-ink-muted)', opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  )
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  const hue = name.charCodeAt(0) * 7 % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, color: 'var(--color-ink)', outline: 'none', background: 'white', fontFamily: 'var(--font-sans)' }
const btnPrimary: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--color-brand)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700 }
const btnOutline: React.CSSProperties = { padding: '9px 20px', borderRadius: 9, border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
