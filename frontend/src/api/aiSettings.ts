import { extractError } from './http'

export type UserAISetting = {
  user_id: number
  openai_api_key_masked: string
  has_openai_api_key: boolean
  openai_base_url: string
  openai_model: string
}

export type UpsertUserAISettingPayload = {
  openai_api_key: string
  openai_base_url: string
  openai_model: string
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

export async function getMyAISettings(token: string): Promise<{ setting: UserAISetting }> {
  const res = await fetch('/users/me/ai-settings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}

export async function updateMyAISettings(
  token: string,
  payload: UpsertUserAISettingPayload,
): Promise<{ setting: UserAISetting }> {
  const res = await fetch('/users/me/ai-settings', {
    method: 'PUT',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await extractError(res))
  return res.json()
}
