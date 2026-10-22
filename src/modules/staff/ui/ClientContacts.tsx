"use client"
import { useStaffData } from "../data/context"
import { staffQueries } from "../data/queries"
import { Card, Avatar, Icon, Status } from "./index"
export default function ClientContacts({ clientId }: { clientId: string }) {
  const s = useStaffData()
  const contacts = staffQueries.getClientContacts(s, clientId)
  return (
    <Card className="cm-panel">
      <h2 className="cm-h3" id={`contacts-${clientId}`} tabIndex={-1}>
        Contacts & next of kin
      </h2>
      <p className="cm-hint">
        Read-only. Contact changes are managed through the Admin CMS.
      </p>
      {contacts.length === 0 ? (
        <p className="cm-muted">No contacts recorded.</p>
      ) : (
        contacts.map((k) => (
          <div
            key={k.id}
            className={`cm-contact ${k.primary ? "cm-contact--primary" : ""}`}
            data-testid="contact-card"
          >
            <Avatar
              name={k.name}
              size={40}
              tone={k.primary ? "var(--color-accent)" : undefined}
            />
            <div className="cm-grow">
              <strong>{k.name}</strong>
              <span>{k.relation}</span>
              <div className="cm-chip-row">
                {k.primary && (
                  <Status tone="brand" dot={false}>
                    Primary contact
                  </Status>
                )}
                {k.emergency && (
                  <Status tone="warning" dot={false}>
                    Emergency contact
                  </Status>
                )}
              </div>
              <div className="cm-contact-links">
                {k.phone ? (
                  <a
                    href={`tel:${k.phone.replace(/\s/g, "")}`}
                    aria-label={`Call ${k.name}: ${k.phone}`}
                  >
                    <Icon name="phone" size={14} />
                    {k.phone}
                  </a>
                ) : (
                  <span>Telephone not recorded</span>
                )}
                {k.email && (
                  <a
                    href={`mailto:${k.email}`}
                    aria-label={`Email ${k.name}: ${k.email}`}
                  >
                    <Icon name="mail" size={14} />
                    {k.email}
                  </a>
                )}
              </div>
              {k.notes && <p className="cm-body">{k.notes}</p>}
            </div>
          </div>
        ))
      )}
    </Card>
  )
}
