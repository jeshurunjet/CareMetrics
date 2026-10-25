/** Native JSON parsing plus duplicate-key rejection, including escaped equivalent keys. */
export function uniqueKeyJson(source: string): unknown {
  const result: unknown = JSON.parse(source)
  const frames: Array<Set<string> | null> = []
  for (const token of source.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\]]/g)) {
    const text = token[0]
    if (text === "{") frames.push(new Set())
    else if (text === "[") frames.push(null)
    else if (text === "}" || text === "]") frames.pop()
    else if (
      source
        .slice(token.index + text.length)
        .trimStart()
        .startsWith(":")
    ) {
      const keys = frames.at(-1),
        key = JSON.parse(text) as string
      if (!keys || keys.has(key)) throw new Error("Duplicate JSON key")
      keys.add(key)
    }
  }
  return result
}
