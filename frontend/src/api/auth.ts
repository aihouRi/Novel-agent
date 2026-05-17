export type AuthUser = {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

type AuthResponse = {
  token: string
  user: AuthUser
}

const BASE_HEADERS = {
  'Content-Type': 'application/json',
}

export async function register(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await extractError(res))
  }

  return res.json()
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await extractError(res))
  }

  return res.json()
}

export async function me(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error(await extractError(res))
  }

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
