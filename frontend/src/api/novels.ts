import { extractError } from './http'
export type Novel = {
  id: number
  user_id: number
  title: string
  genre: string
  language: string
  style_profile: string
  worldview: string
  power_system: string
  main_plot: string
  writing_rules: string
  forbidden_rules: string
  recent_chapter_count: number
  created_at: string
  updated_at: string
}

export type CreateNovelPayload = {
  title: string
  genre: string
  language: string
  style_profile: string
  worldview: string
  power_system: string
  main_plot: string
  writing_rules: string
  forbidden_rules: string
  recent_chapter_count: number
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function listNovels(token: string): Promise<{ novels: Novel[] }> {
  const res = await fetch('/novels', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function createNovel(token: string, payload: CreateNovelPayload): Promise<{ novel: Novel }> {
  const res = await fetch('/novels', {
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

export async function updateNovel(token: string, id: number, payload: CreateNovelPayload): Promise<{ novel: Novel }> {
  const res = await fetch(`/novels/${id}`, {
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

export async function deleteNovel(token: string, id: number): Promise<void> {
  const res = await fetch(`/novels/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error(await extractError(res))
}

