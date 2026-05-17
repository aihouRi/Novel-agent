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
}

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

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    const raw = data.error ?? `Request failed: ${res.status}`
    if (
      raw.includes('uk_chapters_novel_chapter_number') ||
      (raw.includes('Duplicate entry') && raw.includes('chapter'))
    ) {
      return '章节号已存在，请使用其他章节号。'
    }
    return raw
  } catch {
    return `Request failed: ${res.status}`
  }
}
