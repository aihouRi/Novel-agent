import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { createNovel, deleteNovel, listNovels, type Novel, updateNovel } from '../api/novels'
import { deleteCharacter, listCharacters, type Character } from '../api/characters'
import { deleteLoreEntry, listLoreEntries, type LoreEntry } from '../api/loreEntries'
import { getMyAISettings, updateMyAISettings } from '../api/aiSettings'
import type { Chapter } from '../api/chapters'
import type { MainTab, MyNovelTab } from '../components/novels/NovelSidebar'
import { useNovelsChapters } from './useNovelsChapters'

const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_RECENT_COUNT = 3
const DEFAULT_PROVIDER: 'openai' | 'gemini' = 'openai'
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const OPENAI_MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.1',
  'gpt-5',
  'gpt-5-mini',
]
const GEMINI_MODEL_OPTIONS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]

export function useNovelsPage(token: string, onLogout: () => void) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [novelWordCounts, setNovelWordCounts] = useState<Record<number, number>>({})
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)

  const [mainTab, setMainTab] = useState<MainTab>('myNovels')
  const [myNovelsExpanded, setMyNovelsExpanded] = useState(true)
  const [myNovelTab, setMyNovelTab] = useState<MyNovelTab>('novelDetail')

  const [showNovelEditor, setShowNovelEditor] = useState(false)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [showLoreManager, setShowLoreManager] = useState(false)
  const [editingLoreEntry, setEditingLoreEntry] = useState<LoreEntry | null>(null)

  const [characters, setCharacters] = useState<Character[]>([])
  const [characterLoading, setCharacterLoading] = useState(false)
  const [confirmDeleteCharacterId, setConfirmDeleteCharacterId] = useState<number | null>(null)
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([])
  const [loreLoading, setLoreLoading] = useState(false)
  const [confirmDeleteLoreEntryId, setConfirmDeleteLoreEntryId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [styleProfile, setStyleProfile] = useState('')
  const [worldview, setWorldview] = useState('')
  const [powerSystem, setPowerSystem] = useState('')
  const [mainPlot, setMainPlot] = useState('')
  const [writingRules, setWritingRules] = useState('')
  const [forbiddenRules, setForbiddenRules] = useState('')
  const [recentChapterCount, setRecentChapterCount] = useState(DEFAULT_RECENT_COUNT)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorOpen, setErrorOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [showAISettingsDialog, setShowAISettingsDialog] = useState(false)
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

  const selectedNovel = useMemo(() => novels.find((n) => n.id === selectedNovelId) ?? null, [novels, selectedNovelId])

  function notifySuccess(text: string) {
    setError('')
    setMessage(text)
    setSuccessOpen(true)
  }

  function notifyError(text: string) {
    setMessage('')
    setError(text)
  }

  async function refreshNovels() {
    setLoading(true)
    setError('')
    try {
      const data = await listNovels(token)
      setNovels(data.novels)
      void refreshNovelWordCounts(data.novels)
      if (!selectedNovelId && data.novels.length > 0) setSelectedNovelId(data.novels[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载小说失败')
    } finally {
      setLoading(false)
    }
  }

  const chaptersState = useNovelsChapters({
    token,
    selectedNovelId,
    onNotifySuccess: notifySuccess,
    onNotifyError: notifyError,
    onRefreshNovels: refreshNovels,
    active: mainTab === 'myNovels' && myNovelTab === 'novelChapters',
  })

  useEffect(() => {
    void refreshNovels()
  }, [])

  useEffect(() => {
    if (selectedNovel) fillForm(selectedNovel)
  }, [selectedNovelId, novels])

  useEffect(() => {
    if (mainTab === 'myNovels' && myNovelTab === 'novelCharacters' && selectedNovelId) {
      void refreshCharacters(selectedNovelId)
    }
    if (mainTab === 'myNovels' && myNovelTab === 'novelChapters' && selectedNovelId) {
      void chaptersState.refreshChapters(selectedNovelId)
      void chaptersState.refreshVolumes(selectedNovelId)
      void refreshCharacters(selectedNovelId)
      void refreshLoreEntries(selectedNovelId)
    }
    if (mainTab === 'myNovels' && myNovelTab === 'novelLoreEntries' && selectedNovelId) {
      void refreshCharacters(selectedNovelId)
      void refreshLoreEntries(selectedNovelId)
    }
  }, [mainTab, myNovelTab, selectedNovelId])

  useEffect(() => {
    if (error) setErrorOpen(true)
  }, [error])

  useEffect(() => {
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelDetail') setShowNovelEditor(false)
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelCharacters') setShowCharacterManager(false)
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelLoreEntries') setShowLoreManager(false)
  }, [mainTab, myNovelTab])

  async function refreshNovelWordCounts(novelList: Novel[]) {
    if (novelList.length === 0) return setNovelWordCounts({})
    const entries = await Promise.all(
      novelList.map(async (novel) => {
        try {
          const data = await chaptersState.refreshChaptersForWordCount(novel.id)
          const total = data.reduce((sum, c) => sum + (Number.isFinite(c.word_count) ? c.word_count : 0), 0)
          return [novel.id, total] as const
        } catch {
          return [novel.id, 0] as const
        }
      }),
    )
    setNovelWordCounts(Object.fromEntries(entries))
  }

  async function refreshCharacters(novelId: number) {
    setCharacterLoading(true)
    try {
      const data = await listCharacters(token, novelId)
      setCharacters(data.characters)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载角色失败')
    } finally {
      setCharacterLoading(false)
    }
  }

  async function refreshLoreEntries(novelId: number) {
    setLoreLoading(true)
    try {
      const data = await listLoreEntries(token, novelId)
      setLoreEntries(data.lore_entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设定失败')
    } finally {
      setLoreLoading(false)
    }
  }

  function fillForm(novel: Novel) {
    setTitle(novel.title)
    setGenre(novel.genre)
    setLanguage(novel.language || DEFAULT_LANGUAGE)
    setStyleProfile(novel.style_profile)
    setWorldview(novel.worldview)
    setPowerSystem(novel.power_system)
    setMainPlot(novel.main_plot)
    setWritingRules(novel.writing_rules)
    setForbiddenRules(novel.forbidden_rules)
    setRecentChapterCount(novel.recent_chapter_count || DEFAULT_RECENT_COUNT)
  }

  function resetForm() {
    setTitle('')
    setGenre('')
    setLanguage(DEFAULT_LANGUAGE)
    setStyleProfile('')
    setWorldview('')
    setPowerSystem('')
    setMainPlot('')
    setWritingRules('')
    setForbiddenRules('')
    setRecentChapterCount(DEFAULT_RECENT_COUNT)
  }

  function currentPayload() {
    return {
      title: title.trim(),
      genre: genre.trim(),
      language: language.trim() || DEFAULT_LANGUAGE,
      style_profile: styleProfile.trim(),
      worldview: worldview.trim(),
      power_system: powerSystem.trim(),
      main_plot: mainPlot.trim(),
      writing_rules: writingRules.trim(),
      forbidden_rules: forbiddenRules.trim(),
      recent_chapter_count: recentChapterCount > 0 ? recentChapterCount : DEFAULT_RECENT_COUNT,
    }
  }

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await createNovel(token, currentPayload())
      setNovels((prev) => [data.novel, ...prev])
      setSelectedNovelId(data.novel.id)
      setMainTab('myNovels')
      setMyNovelsExpanded(true)
      setMyNovelTab('novelDetail')
      setShowNovelEditor(false)
      notifySuccess('小说已创建。')
      fillForm(data.novel)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '创建小说失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!selectedNovelId || !title.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await updateNovel(token, selectedNovelId, currentPayload())
      setNovels((prev) => prev.map((n) => (n.id === selectedNovelId ? data.novel : n)))
      notifySuccess('小说已更新。')
      setShowNovelEditor(false)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '更新小说失败')
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteNovel(token, id)
      const next = novels.filter((n) => n.id !== id)
      setNovels(next)
      setSelectedNovelId(next.length > 0 ? next[0].id : null)
      notifySuccess('小说已删除。')
      setShowNovelEditor(false)
      if (next.length > 0) fillForm(next[0])
      else resetForm()
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '删除小说失败')
    } finally {
      setLoading(false)
    }
  }

  async function confirmDeleteCharacter() {
    if (!confirmDeleteCharacterId || !selectedNovelId) return
    const id = confirmDeleteCharacterId
    setConfirmDeleteCharacterId(null)
    setCharacterLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteCharacter(token, selectedNovelId, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      notifySuccess('角色已删除。')
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '删除角色失败')
    } finally {
      setCharacterLoading(false)
    }
  }

  async function confirmDeleteLoreEntry() {
    if (!confirmDeleteLoreEntryId || !selectedNovelId) return
    const id = confirmDeleteLoreEntryId
    setConfirmDeleteLoreEntryId(null)
    setLoreLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteLoreEntry(token, selectedNovelId, id)
      setLoreEntries((prev) => prev.filter((entry) => entry.id !== id))
      notifySuccess('设定已删除。')
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '删除设定失败')
    } finally {
      setLoreLoading(false)
    }
  }

  function formatNovelMeta(novel: Novel): string {
    const parts: string[] = [novel.genre || '未填写类型']
    if (novel.language && novel.language !== DEFAULT_LANGUAGE) parts.push(novel.language)
    parts.push(`${(novelWordCounts[novel.id] ?? 0).toLocaleString()} 字`)
    return parts.join(' · ')
  }

  function openMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchor(event.currentTarget)
  }

  function closeMenu() {
    setMenuAnchor(null)
  }

  function clickSettings() {
    closeMenu()
    setShowAISettingsDialog(true)
    void loadAISettings()
  }

  function clickLogout() {
    closeMenu()
    onLogout()
  }

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
      notifyError(e instanceof Error ? e.message : '加载 AI 设置失败')
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
      notifyError(isOpenAI ? '请先填写 OpenAI API Key。' : '请先填写 Gemini API Key。')
      return
    }
    if (!nextModel) {
      notifyError('请选择模型。')
      return
    }
    try {
      const parsed = new URL(nextBaseURL)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        notifyError('Base URL 必须是 http 或 https 地址。')
        return
      }
    } catch {
      notifyError('Base URL 格式不正确，请输入完整地址。')
      return
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
      notifySuccess('AI 设置已保存。')
    } catch (e) {
      notifyError(e instanceof Error ? e.message : '保存 AI 设置失败')
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
    novels,
    selectedNovelId,
    selectedNovel,
    mainTab,
    myNovelsExpanded,
    myNovelTab,
    showNovelEditor,
    showCharacterManager,
    editingCharacter,
    showLoreManager,
    editingLoreEntry,
    characters,
    characterLoading,
    confirmDeleteCharacterId,
    loreEntries,
    loreLoading,
    confirmDeleteLoreEntryId,
    title,
    genre,
    language,
    styleProfile,
    worldview,
    powerSystem,
    mainPlot,
    writingRules,
    forbiddenRules,
    recentChapterCount,
    loading,
    error,
    errorOpen,
    message,
    successOpen,
    menuAnchor,
    confirmDeleteId,
    showAISettingsDialog,
    aiSettingLoading,
    aiProvider,
    openaiAPIKeyInput,
    openaiAPIKeyMasked,
    openaiHasAPIKey,
    openaiBaseURL,
    openaiModel,
    geminiAPIKeyInput,
    geminiAPIKeyMasked,
    geminiHasAPIKey,
    geminiBaseURL,
    geminiModel,
    openaiModelOptions: OPENAI_MODEL_OPTIONS,
    geminiModelOptions: GEMINI_MODEL_OPTIONS,
    formatNovelMeta,
    setSelectedNovelId,
    setMainTab,
    setMyNovelsExpanded,
    setMyNovelTab,
    setShowNovelEditor,
    setShowCharacterManager,
    setEditingCharacter,
    setShowLoreManager,
    setEditingLoreEntry,
    setConfirmDeleteCharacterId,
    setConfirmDeleteLoreEntryId,
    setTitle,
    setGenre,
    setLanguage,
    setStyleProfile,
    setWorldview,
    setPowerSystem,
    setMainPlot,
    setWritingRules,
    setForbiddenRules,
    setRecentChapterCount,
    setErrorOpen,
    setSuccessOpen,
    setConfirmDeleteId,
    setShowAISettingsDialog,
    setAIProvider,
    setOpenAIAPIKeyInput,
    setOpenAIBaseURL,
    setOpenAIModel,
    setGeminiAPIKeyInput,
    setGeminiBaseURL,
    setGeminiModel,
    resetAISettingsDefaults,
    notifySuccess,
    notifyError,
    refreshCharacters,
    refreshLoreEntries,
    resetForm,
    handleCreate,
    handleUpdate,
    confirmDelete,
    confirmDeleteCharacter,
    confirmDeleteLoreEntry,
    openMenu,
    closeMenu,
    clickSettings,
    clickLogout,
    loadAISettings,
    saveAISettings,
    ...chaptersState,
  }
}
