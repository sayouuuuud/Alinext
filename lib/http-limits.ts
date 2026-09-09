import 'server-only'

export class BodyLimitExceededError extends Error {
  constructor(readonly limit: number) {
    super(`Body exceeded the ${limit}-byte limit.`)
    this.name = 'BodyLimitExceededError'
  }
}

export async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  contentLength: string | null,
  limit: number
): Promise<Uint8Array> {
  const declaredLength = Number(contentLength)
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw new BodyLimitExceededError(limit)
  }

  if (!body) return new Uint8Array()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      total += value.byteLength
      if (total > limit) {
        await reader.cancel()
        throw new BodyLimitExceededError(limit)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined
}

export function decodeUtf8(body: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(body)
}
