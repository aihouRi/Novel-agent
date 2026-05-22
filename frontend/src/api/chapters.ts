import { APIError, extractAPIError, extractError } from './http'
export type Chapter = {
  id: number
  novel_id: number
  volume_id: number
  chapter_number: number
  title: string
  body: string
  word_count: number
  generation_instruction: string
  outline: string
  summary: string
  status: 'draft' | 'review' | 'final'
  created_at: string
  updated_at: string
}

export type UpsertChapterPayload = {
  volume_id: number
  chapter_number: number
  title: string
  body: string
  word_count: number
  generation_instruction: string
  outline: string
  summary: string
  status: 'draft' | 'review' | 'final'
}

export type GenerateChapterPayload = {
  volume_id: number
  chapter_number: number
  title: string
  generation_instruction: string
  character_ids: number[]
  lore_entry_ids: number[]
  target_word_min: number
  target_word_max: number
  avoid_translation_tone: boolean
  avoid_modern_slang: boolean
  keep_pov_consistent: boolean
  keep_tense_consistent: boolean
  recent_chapter_count: number
}

export type GenerateChapterResponse = {
  outline: string
  body: string
  summary: string
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type GenerateChapterStreamEvent =
  | { type: 'progress'; elapsed_seconds: number }
  | { type: 'done'; data: GenerateChapterResponse }
  | { type: 'error'; code?: string; error: string }

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function listChapters(token: string, novelId: number): Promise<{ chapters: Chapter[] }> {
  const res = await fetch(`/novels/${novelId}/chapters`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function createChapter(
  token: string,
  novelId: number,
  payload: UpsertChapterPayload,
): Promise<{ chapter: Chapter }> {
  const res = await fetch(`/novels/${novelId}/chapters`, {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function updateChapter(
  token: string,
  novelId: number,
  id: number,
  payload: UpsertChapterPayload,
): Promise<{ chapter: Chapter }> {
  const res = await fetch(`/novels/${novelId}/chapters/${id}`, {
    method: 'PUT',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function generateChapter(
  token: string,
  novelId: number,
  payload: GenerateChapterPayload,
): Promise<GenerateChapterResponse> {
  const res = await fetch(`/novels/${novelId}/chapters/generate`, {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw await extractAPIError(res)
  return res.json()
}

export async function generateChapterStream(
  token: string,
  novelId: number,
  payload: GenerateChapterPayload,
  onEvent: (event: GenerateChapterStreamEvent) => void,
): Promise<GenerateChapterResponse> {
  const res = await fetch(`/novels/${novelId}/chapters/generate/stream`, {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw await extractAPIError(res)
  if (!res.body) throw new Error('stream response body is empty')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalData: GenerateChapterResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    while (true) {
      const idx = buffer.indexOf('\n\n')
      if (idx === -1) break
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const parsed = parseSSEChunk(chunk)
      if (!parsed) continue
      if (parsed.event === 'progress') {
        const data = parsedJSON<{ elapsed_seconds?: number }>(parsed.data)
        if (data && Number.isFinite(data.elapsed_seconds)) {
          onEvent({ type: 'progress', elapsed_seconds: Number(data.elapsed_seconds) })
        }
      } else if (parsed.event === 'error') {
        const data = parsedJSON<{ code?: string; error?: string }>(parsed.data)
        const msg = data?.error || 'ai service request failed'
        onEvent({ type: 'error', code: data?.code, error: msg })
        throw new APIError(msg, 502, data?.code)
      } else if (parsed.event === 'done') {
        const data = parsedJSON<GenerateChapterResponse>(parsed.data)
        if (data) {
          finalData = data
          onEvent({ type: 'done', data })
        }
      }
    }
  }

  if (!finalData) throw new Error('stream finished without result')
  return finalData
}

function parseSSEChunk(chunk: string): { event: string; data: string } | null {
  const lines = chunk.split('\n')
  let event = 'message'
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

function parsedJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function deleteChapter(token: string, novelId: number, id: number): Promise<void> {
  const res = await fetch(`/novels/${novelId}/chapters/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
}

export type ExportScope = 'all' | 'volume' | 'chapter_range'

export type ExportNovelPayload = {
  format: 'markdown'
  scope: ExportScope
  volume_id?: number
  from_chapter?: number
  to_chapter?: number
  include_body: boolean
  include_summary: boolean
  include_outline: boolean
}

export async function exportNovel(
  token: string,
  novelId: number,
  payload: ExportNovelPayload,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`/novels/${novelId}/export`, {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))

  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const matchUtf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  const matchBasic = disposition.match(/filename=\"?([^\";]+)\"?/i)
  const filename =
    (matchUtf8?.[1] ? decodeURIComponent(matchUtf8[1]) : undefined) ??
    matchBasic?.[1] ??
    `novel-${novelId}.md`
  return { blob, filename }
}
