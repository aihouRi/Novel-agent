export async function extractError(res: Response): Promise<string> {
  let raw = `Request failed: ${res.status}`

  try {
    const data = (await res.json()) as { error?: string }
    raw = data.error ?? raw
  } catch {
    return raw
  }

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

  return raw
}
