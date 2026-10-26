// Unknown APIs must fail with an HTTP error, including on hosts that stream
// the HTML not-found page with status 200. Specific API routes take precedence.
export const dynamic = "force-dynamic"
function unavailable() {
  return Response.json({ error: "Service unavailable" }, {
    status: 404,
    headers: { "Cache-Control": "private, no-store" },
  })
}
export {
  unavailable as GET,
  unavailable as POST,
  unavailable as PUT,
  unavailable as PATCH,
  unavailable as DELETE,
  unavailable as HEAD,
  unavailable as OPTIONS,
}
