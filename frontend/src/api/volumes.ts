export type Volume = {
  id: number
  novel_id: number
  volume_number: number
  title: string
  created_at: string
  updated_at: string
}

export type UpsertVolumePayload = {
  volume_number: number
  title: string
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function listVolumes(token: string, novelId: number): Promise<{ volumes: Volume[] }> {
  const res = await fetch(`/novels/${novelId}/volumes`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function createVolume(token: string, novelId: number, payload: UpsertVolumePayload): Promise<{ volume: Volume }> {
  const res = await fetch(`/novels/${novelId}/volumes`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function updateVolume(
  token: string,
  novelId: number,
  volumeId: number,
  payload: UpsertVolumePayload,
): Promise<{ volume: Volume }> {
  const res = await fetch(`/novels/${novelId}/volumes/${volumeId}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? `Request failed: ${res.status}`
  } catch {
    return `Request failed: ${res.status}`
  }
}
