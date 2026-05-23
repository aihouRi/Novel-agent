import type { GenerateFeedbackRating } from './types'
import { INDENT } from './constants'

export function ensureIndentedBody(text: string): string {
  if (!text) return INDENT
  const lines = text.split('\n')
  return lines.map((line) => (line.startsWith(INDENT) ? line : `${INDENT}${line}`)).join('\n')
}

export function stripIndentForClipboard(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.startsWith(INDENT) ? line.slice(INDENT.length) : line))
    .join('\n')
}

export function buildFeedbackHint(rating: GenerateFeedbackRating, note: string): string {
  const parts: string[] = []
  if (rating) {
    if (rating === 'satisfied') parts.push('评分：满意（保持当前风格与节奏）。')
    if (rating === 'neutral') parts.push('评分：一般（在结构与表达上继续优化）。')
    if (rating === 'unsatisfied') parts.push('评分：不满意（需明显修正内容质量与稳定性）。')
  }
  if (note.trim()) parts.push(`备注：${note.trim()}`)
  return parts.join('\n')
}
