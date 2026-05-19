import { extractError } from './http'

export type LoreEntryCategory = 'artifact' | 'elixir' | 'formation' | 'technique' | 'location' | 'organization' | 'other'

export type LoreEntry = {
  id: number
  novel_id: number
  category: LoreEntryCategory
  name: string
  description: string
  rules_or_limits: string
  tags: string
  character_ids: number[]
  created_at: string
  updated_at: string
}

export type UpsertLoreEntryPayload = {
  category: LoreEntryCategory
  name: string
  description: string
  rules_or_limits: string
  tags: string
  character_ids: number[]
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function listLoreEntries(token: string, novelId: number): Promise<{ lore_entries: LoreEntry[] }> {
  const res = await fetch(`/novels/${novelId}/lore-entries`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function createLoreEntry(
  token: string,
  novelId: number,
  payload: UpsertLoreEntryPayload,
): Promise<{ lore_entry: LoreEntry }> {
  const res = await fetch(`/novels/${novelId}/lore-entries`, {
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

export async function updateLoreEntry(
  token: string,
  novelId: number,
  id: number,
  payload: UpsertLoreEntryPayload,
): Promise<{ lore_entry: LoreEntry }> {
  const res = await fetch(`/novels/${novelId}/lore-entries/${id}`, {
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

export async function deleteLoreEntry(token: string, novelId: number, id: number): Promise<void> {
  const res = await fetch(`/novels/${novelId}/lore-entries/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await extractError(res))
}
