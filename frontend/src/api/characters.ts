export type Character = {
  id: number
  novel_id: number
  name: string
  aliases: string
  role: string
  personality: string
  realm_or_ability: string
  goal: string
  relationships: string
  speech_style: string
  first_appearance_chapter: number
  last_appearance_chapter: number
  memo: string
  importance_level: number
  created_at: string
  updated_at: string
}

export type UpsertCharacterPayload = {
  name: string
  aliases: string
  role: string
  personality: string
  realm_or_ability: string
  goal: string
  relationships: string
  speech_style: string
  first_appearance_chapter: number
  last_appearance_chapter: number
  memo: string
  importance_level: number
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function listCharacters(token: string, novelId: number): Promise<{ characters: Character[] }> {
  const res = await fetch(`/novels/${novelId}/characters`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function createCharacter(
  token: string,
  novelId: number,
  payload: UpsertCharacterPayload,
): Promise<{ character: Character }> {
  const res = await fetch(`/novels/${novelId}/characters`, {
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

export async function updateCharacter(
  token: string,
  novelId: number,
  id: number,
  payload: UpsertCharacterPayload,
): Promise<{ character: Character }> {
  const res = await fetch(`/novels/${novelId}/characters/${id}`, {
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

export async function deleteCharacter(token: string, novelId: number, id: number): Promise<void> {
  const res = await fetch(`/novels/${novelId}/characters/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    const raw = data.error ?? `Request failed: ${res.status}`
    if (raw.includes('importance_level >= 7')) {
      return '该人物为主要角色，禁止删除。请先降低权重后再删除。'
    }
    return raw
  } catch {
    return `Request failed: ${res.status}`
  }
}
