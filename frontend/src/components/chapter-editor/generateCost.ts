type CostEstimate = {
  inputTokens: number
  outputTokens: number
  low: number
  high: number
}

type CostProfile = {
  level: '低' | '中' | '高'
  isHigh: boolean
  hint: string
}

export function estimateTokenAndCost(
  model: string,
  targetWordMin: number,
  targetWordMax: number,
  recentChapterCount: number,
  selectedCharacterCount: number,
  selectedLoreEntryCount: number,
): CostEstimate {
  const target = Math.max(targetWordMax || targetWordMin || 0, 0)
  const ctx = Math.max(recentChapterCount || 1, 1)
  const inputTokens = Math.max(
    800,
    Math.round(900 + target * 0.6 + ctx * 350 + selectedCharacterCount * 60 + selectedLoreEntryCount * 90),
  )
  const outputTokens = Math.max(500, Math.round(target * 1.9))

  // Heuristic prices per 1M tokens in USD (for guidance, not billing-accurate).
  const priceTable: Record<string, { in: number; out: number }> = {
    'gpt-5.5': { in: 8, out: 24 },
    'gpt-5.4': { in: 5, out: 15 },
    'gpt-5.1': { in: 3, out: 9 },
    'gpt-5': { in: 2.5, out: 7.5 },
    'gpt-5-mini': { in: 0.8, out: 2.4 },
    'gpt-4o-mini': { in: 0.15, out: 0.6 },
    'gemini-3.5-flash': { in: 0.1, out: 0.4 },
    'gemini-2.5-flash': { in: 0.1, out: 0.4 },
    'gemini-2.5-pro': { in: 1.25, out: 5 },
    'gemini-2.0-flash': { in: 0.08, out: 0.32 },
  }

  const key = model.toLowerCase()
  const matched = Object.keys(priceTable).find((k) => key.includes(k))
  const price = matched ? priceTable[matched] : { in: 1, out: 3 }
  const usd = (inputTokens / 1_000_000) * price.in + (outputTokens / 1_000_000) * price.out
  const low = Math.max(0, usd * 0.75)
  const high = usd * 1.35

  return { inputTokens, outputTokens, low, high }
}

export function getGenerateCostProfile(
  model: string,
  targetWordMin: number,
  targetWordMax: number,
  recentChapterCount: number,
): CostProfile {
  const target = Math.max(targetWordMax || targetWordMin || 0, 0)
  const ctx = Math.max(recentChapterCount || 1, 1)
  const modelLower = model.toLowerCase()
  let score = 0

  if (target >= 2600) score += 2
  else if (target >= 2200) score += 1
  if (ctx >= 4) score += 2
  else if (ctx >= 3) score += 1

  if (modelLower.includes('gpt-5.5') || modelLower.includes('pro')) score += 3
  else if (modelLower.includes('gpt-5.4') || modelLower.includes('gpt-5.1') || modelLower === 'gpt-5') score += 2
  else if (
    modelLower.includes('gpt-5-mini') ||
    modelLower.includes('gpt-4o-mini') ||
    modelLower.includes('gemini-3.5-flash') ||
    modelLower.includes('gemini-2.5-flash')
  ) score += 0
  else score += 1

  if (score >= 5) {
    return {
      level: '高',
      isHigh: true,
      hint: '本次可能较慢且成本较高。若先打草稿，建议改用 gemini-3.5-flash / gpt-4o-mini。',
    }
  }
  if (score >= 3) {
    return {
      level: '中',
      isHigh: false,
      hint: '本次成本中等。可先生成草稿，再用高阶模型精修。',
    }
  }

  return {
    level: '低',
    isHigh: false,
    hint: '本次成本较低，适合频繁试写与重试。',
  }
}
