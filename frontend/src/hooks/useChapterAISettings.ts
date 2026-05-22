import { useState } from 'react'
import { getMyAISettings, updateMyAISettings } from '../api/aiSettings'

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
export const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const DEFAULT_PROVIDER: 'openai' | 'gemini' = 'openai'

type Options = {
  token: string
  onNotifySuccess: (msg: string) => void
  onNotifyError: (msg: string) => void
  setLocalError: (msg: string) => void
}

export function useChapterAISettings({ token, onNotifySuccess, onNotifyError, setLocalError }: Options) {
  const [aiSettingLoading, setAISettingLoading] = useState(false)
  const [aiProvider, setAIProvider] = useState<'openai' | 'gemini'>(DEFAULT_PROVIDER)
  const [openaiAPIKeyInput, setOpenAIAPIKeyInput] = useState('')
  const [openaiAPIKeyMasked, setOpenAIAPIKeyMasked] = useState('')
  const [openaiHasAPIKey, setOpenAIHasAPIKey] = useState(false)
  const [openaiBaseURL, setOpenAIBaseURL] = useState(DEFAULT_OPENAI_BASE_URL)
  const [openaiModel, setOpenAIModel] = useState(DEFAULT_OPENAI_MODEL)
  const [geminiAPIKeyInput, setGeminiAPIKeyInput] = useState('')
  const [geminiAPIKeyMasked, setGeminiAPIKeyMasked] = useState('')
  const [geminiHasAPIKey, setGeminiHasAPIKey] = useState(false)
  const [geminiBaseURL, setGeminiBaseURL] = useState(DEFAULT_GEMINI_BASE_URL)
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL)

  async function loadAISettings() {
    setAISettingLoading(true)
    try {
      const data = await getMyAISettings(token)
      setAIProvider(data.setting.provider || DEFAULT_PROVIDER)
      setOpenAIHasAPIKey(data.setting.has_openai_api_key)
      setOpenAIAPIKeyMasked(data.setting.openai_api_key_masked)
      setOpenAIBaseURL(data.setting.openai_base_url || DEFAULT_OPENAI_BASE_URL)
      setOpenAIModel(data.setting.openai_model || DEFAULT_OPENAI_MODEL)
      setGeminiHasAPIKey(data.setting.has_gemini_api_key)
      setGeminiAPIKeyMasked(data.setting.gemini_api_key_masked)
      setGeminiBaseURL(data.setting.gemini_base_url || DEFAULT_GEMINI_BASE_URL)
      setGeminiModel(data.setting.gemini_model || DEFAULT_GEMINI_MODEL)
      setOpenAIAPIKeyInput('')
      setGeminiAPIKeyInput('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载 AI 设置失败'
      onNotifyError(msg)
      setLocalError(msg)
    } finally {
      setAISettingLoading(false)
    }
  }

  async function saveAISettings() {
    const isOpenAI = aiProvider === 'openai'
    const nextBaseURL = (isOpenAI ? openaiBaseURL : geminiBaseURL).trim()
    const nextModel = (isOpenAI ? openaiModel : geminiModel).trim()
    const nextAPIKey = (isOpenAI ? openaiAPIKeyInput : geminiAPIKeyInput).trim()
    const hasSaved = isOpenAI ? openaiHasAPIKey : geminiHasAPIKey

    if (!hasSaved && !nextAPIKey) {
      const msg = isOpenAI ? '请先填写 OpenAI API Key。' : '请先填写 Gemini API Key。'
      onNotifyError(msg)
      setLocalError(msg)
      return false
    }
    if (!nextModel) {
      const msg = '请选择模型。'
      onNotifyError(msg)
      setLocalError(msg)
      return false
    }
    try {
      const parsed = new URL(nextBaseURL)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const msg = 'Base URL 必须是 http 或 https 地址。'
        onNotifyError(msg)
        setLocalError(msg)
        return false
      }
    } catch {
      const msg = 'Base URL 格式不正确，请输入完整地址。'
      onNotifyError(msg)
      setLocalError(msg)
      return false
    }

    setAISettingLoading(true)
    try {
      const data = await updateMyAISettings(token, {
        provider: aiProvider,
        openai_api_key: openaiAPIKeyInput.trim(),
        openai_base_url: openaiBaseURL.trim(),
        openai_model: openaiModel.trim(),
        gemini_api_key: geminiAPIKeyInput.trim(),
        gemini_base_url: geminiBaseURL.trim(),
        gemini_model: geminiModel.trim(),
      })
      setAIProvider(data.setting.provider || DEFAULT_PROVIDER)
      setOpenAIHasAPIKey(data.setting.has_openai_api_key)
      setOpenAIAPIKeyMasked(data.setting.openai_api_key_masked)
      setOpenAIBaseURL(data.setting.openai_base_url || DEFAULT_OPENAI_BASE_URL)
      setOpenAIModel(data.setting.openai_model || DEFAULT_OPENAI_MODEL)
      setGeminiHasAPIKey(data.setting.has_gemini_api_key)
      setGeminiAPIKeyMasked(data.setting.gemini_api_key_masked)
      setGeminiBaseURL(data.setting.gemini_base_url || DEFAULT_GEMINI_BASE_URL)
      setGeminiModel(data.setting.gemini_model || DEFAULT_GEMINI_MODEL)
      setOpenAIAPIKeyInput('')
      setGeminiAPIKeyInput('')
      onNotifySuccess('AI 设置已保存。')
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存 AI 设置失败'
      onNotifyError(msg)
      setLocalError(msg)
      return false
    } finally {
      setAISettingLoading(false)
    }
  }

  function resetAISettingsDefaults() {
    setOpenAIBaseURL(DEFAULT_OPENAI_BASE_URL)
    setOpenAIModel(DEFAULT_OPENAI_MODEL)
    setGeminiBaseURL(DEFAULT_GEMINI_BASE_URL)
    setGeminiModel(DEFAULT_GEMINI_MODEL)
  }

  return {
    aiSettingLoading,
    aiProvider,
    setAIProvider,
    openaiAPIKeyInput,
    setOpenAIAPIKeyInput,
    openaiAPIKeyMasked,
    openaiHasAPIKey,
    openaiBaseURL,
    setOpenAIBaseURL,
    openaiModel,
    setOpenAIModel,
    geminiAPIKeyInput,
    setGeminiAPIKeyInput,
    geminiAPIKeyMasked,
    geminiHasAPIKey,
    geminiBaseURL,
    setGeminiBaseURL,
    geminiModel,
    setGeminiModel,
    loadAISettings,
    saveAISettings,
    resetAISettingsDefaults,
  }
}
