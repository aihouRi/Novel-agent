export class APIError extends Error {
  code?: string
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
  }
}

export async function extractError(res: Response): Promise<string> {
  let raw = `Request failed: ${res.status}`

  try {
    const data = (await res.json()) as { error?: string }
    raw = data.error ?? raw
  } catch {
    return raw
  }

  return mapLegacyError(raw)
}

export async function extractAPIError(res: Response): Promise<APIError> {
  let raw = `Request failed: ${res.status}`
  let code: string | undefined

  try {
    const data = (await res.json()) as { error?: string; code?: string }
    raw = data.error ?? raw
    code = data.code
  } catch {
    return new APIError(raw, res.status)
  }

  const mapped = mapLegacyError(raw)
  return new APIError(mapped, res.status, code)
}

function mapLegacyError(raw: string): string {
  if (
    raw.includes('uk_chapters_novel_chapter_number') ||
    (raw.includes('Duplicate entry') && raw.includes('chapter'))
  ) {
    return '章节号已存在，请使用其他章节号。'
  }

  if (raw.includes('main character cannot be deleted') || raw.includes('importance_level >= 7')) {
    return '该人物为主要角色，禁止删除。请先降低权重后再删除。'
  }

  if (raw === 'missing bearer token' || raw === 'invalid token') {
    return '登录状态已失效，请重新登录。'
  }

  if (raw.toLowerCase().includes('openai api key is not configured')) {
    return '尚未配置 OpenAI API Key。请在写作页右上角点击「AI 设置」后填写 API Key。'
  }
  if (raw.toLowerCase().includes('gemini api key is not configured')) {
    return '尚未配置 Gemini API Key。请在写作页右上角点击「AI 设置」后填写 API Key。'
  }

  return raw
}
