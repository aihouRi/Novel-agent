import { APIError } from '../../api/http'

export function mapGenerateErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'AI_OUTPUT_INVALID':
        return '生成失败：模型输出格式异常。建议点击重试，或缩短并明确你的生成指令。'
      case 'AI_REQUEST_FAILED':
        return '生成失败：模型请求异常。请检查 API 设置（写作页右上角「AI 设置」）、额度、模型配置或稍后重试。'
      case 'AUTH_UNAUTHORIZED':
        return '登录状态已失效，请重新登录。'
      case 'NOVEL_NOT_FOUND':
        return '当前小说不存在或无权限访问。'
      default:
        break
    }
  }

  const raw = error instanceof Error ? error.message : '生成章节失败'
  const msg = raw.toLowerCase()

  if (msg.includes('ai output parse failed') || msg.includes('openai returned invalid json output')) {
    return '生成失败：模型输出格式异常。建议点击重试，或缩短并明确你的生成指令。'
  }
  if (
    msg.includes('openai api key is not configured') ||
    msg.includes('尚未配置 openai api key') ||
    msg.includes('ai service request failed') ||
    msg.includes('openai request failed') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('429')
  ) {
    return '生成失败：模型请求异常。请检查 API 设置（写作页右上角「AI 设置」）、额度、模型配置或稍后重试。'
  }
  if (
    msg.includes('timeout') ||
    msg.includes('deadline exceeded') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch')
  ) {
    return '生成失败：请求超时或网络异常。建议缩短目标字数后重试。'
  }
  return raw
}
