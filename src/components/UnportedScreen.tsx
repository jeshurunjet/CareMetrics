export default function UnportedScreen({ title }: { title: string }) {
  return (
    <>
      <header className="cm-page-header">
        <div className="cm-page-title">
          <h1>{title}</h1>
          <p>UI ONLY · screen migration pending</p>
        </div>
      </header>
      <section className="cm-card" style={{ padding: "1.5rem" }}>
        <p>
          The approved screen is preserved in the original export. Its content
          and interactions have not been ported at this bootstrap checkpoint.
        </p>
      </section>
    </>
  )
}
