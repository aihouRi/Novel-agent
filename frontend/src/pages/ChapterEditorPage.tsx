import { Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Chapter } from '../api/chapters'
import type { Character } from '../api/characters'
import type { LoreEntry } from '../api/loreEntries'
import type { Volume } from '../api/volumes'
import { getMyAISettings, updateMyAISettings } from '../api/aiSettings'
import EditorActionButtons from '../components/chapter-editor/EditorActionButtons'
import { useChapterEditor } from '../hooks/useChapterEditor'

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_PROVIDER: 'openai' | 'gemini' = 'openai'
const AI_MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.1',
  'gpt-5',
  'gpt-5-mini',
]
const GEMINI_MODEL_OPTIONS = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']

type Props = {
  token: string
  novelId: number
  novelTitle: string
  recentChapterCountDefault: number
  volumes: Volume[]
  characters: Character[]
  loreEntries: LoreEntry[]
  initialChapter?: Chapter | null
  defaultChapterNumber?: number
  onBack: () => void
  onNotifySuccess: (msg: string) => void
  onNotifyError: (msg: string) => void
  onSaved: () => Promise<void> | void
}

export default function ChapterEditorPage({
  token,
  novelId,
  novelTitle,
  recentChapterCountDefault,
  initialChapter,
  defaultChapterNumber = 1,
  volumes,
  characters,
  loreEntries,
  onBack,
  onNotifySuccess,
  onNotifyError,
  onSaved,
}: Props) {
  const loreCategoryLabelMap: Record<string, string> = {
    artifact: '法器',
    elixir: '丹药',
    formation: '阵法',
    technique: '功法',
    location: '地点',
    organization: '势力',
    other: '其他',
  }

  const editor = useChapterEditor({
    token,
    novelId,
    initialChapter,
    defaultChapterNumber,
    volumes,
    characters,
    loreEntries,
    recentChapterCountDefault,
    onNotifySuccess,
    onNotifyError,
    onSaved,
    onBack,
  })
  const canRewrite = editor.bodySelection.end > editor.bodySelection.start
  const [pendingHistoryIndex, setPendingHistoryIndex] = useState<number | null>(null)
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false)
  const [highCostAcknowledged, setHighCostAcknowledged] = useState(false)
  const [showAISettingsDialog, setShowAISettingsDialog] = useState(false)
  const [showRewriteDialog, setShowRewriteDialog] = useState(false)
  const [rewritePrompt, setRewritePrompt] = useState('')
  const [rewriteSelection, setRewriteSelection] = useState<{ start: number; end: number } | null>(null)
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
  const pendingHistoryItem = useMemo(
    () => (pendingHistoryIndex === null ? null : editor.generateHistory[pendingHistoryIndex] ?? null),
    [editor.generateHistory, pendingHistoryIndex],
  )
  const chapterBodyInputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!editor.pendingRewrite || !chapterBodyInputRef.current) return
    chapterBodyInputRef.current.focus()
    chapterBodyInputRef.current.setSelectionRange(editor.pendingRewrite.start, editor.pendingRewrite.end)
  }, [editor.pendingRewrite])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!editor.bodyFocused) return
      const textarea = chapterBodyInputRef.current
      if (!textarea) return
      const target = event.target as Node | null
      if (target instanceof Element && target.closest('[data-keep-body-selection="true"]')) return
      if (target && textarea.contains(target)) return
      editor.handleBodyBlur()
    }

    document.addEventListener('mousedown', handlePointerDown, true)
    document.addEventListener('touchstart', handlePointerDown, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true)
      document.removeEventListener('touchstart', handlePointerDown, true)
    }
  }, [editor])

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
      editor.setLocalError(msg)
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
      editor.setLocalError(msg)
      return
    }
    if (!nextModel) {
      const msg = '请选择模型。'
      onNotifyError(msg)
      editor.setLocalError(msg)
      return
    }
    try {
      const parsed = new URL(nextBaseURL)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const msg = 'Base URL 必须是 http 或 https 地址。'
        onNotifyError(msg)
        editor.setLocalError(msg)
        return
      }
    } catch {
      const msg = 'Base URL 格式不正确，请输入完整地址。'
      onNotifyError(msg)
      editor.setLocalError(msg)
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
      onNotifySuccess('AI 设置已保存。')
      setShowAISettingsDialog(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存 AI 设置失败'
      onNotifyError(msg)
      editor.setLocalError(msg)
    } finally {
      setAISettingLoading(false)
    }
  }

  function openGenerateConfirm() {
    setHighCostAcknowledged(false)
    setConfirmGenerateOpen(true)
  }

  async function confirmGenerate() {
    setConfirmGenerateOpen(false)
    await editor.handleGenerate()
  }

  function estimateTokenAndCost() {
    const model = aiProvider === 'openai' ? openaiModel : geminiModel
    const target = Math.max(editor.targetWordMax || editor.targetWordMin || 0, 0)
    const ctx = Math.max(editor.recentChapterCount || 1, 1)
    const inputTokens = Math.max(800, Math.round(900 + target*0.6 + ctx*350 + editor.selectedCharacterIDs.length*60 + editor.selectedLoreEntryIDs.length*90))
    const outputTokens = Math.max(500, Math.round(target*1.9))

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
    const p = matched ? priceTable[matched] : { in: 1, out: 3 }
    const usd = inputTokens/1_000_000*p.in + outputTokens/1_000_000*p.out
    const low = Math.max(0, usd*0.75)
    const high = usd*1.35
    return { inputTokens, outputTokens, low, high }
  }

  function getGenerateCostProfile() {
    const model = aiProvider === 'openai' ? openaiModel : geminiModel
    const target = Math.max(editor.targetWordMax || editor.targetWordMin || 0, 0)
    const ctx = Math.max(editor.recentChapterCount || 1, 1)
    const modelLower = model.toLowerCase()

    let score = 0
    if (target >= 2600) score += 2
    else if (target >= 2200) score += 1
    if (ctx >= 4) score += 2
    else if (ctx >= 3) score += 1

    if (modelLower.includes('gpt-5.5') || modelLower.includes('pro')) score += 3
    else if (modelLower.includes('gpt-5.4') || modelLower.includes('gpt-5.1') || modelLower === 'gpt-5') score += 2
    else if (modelLower.includes('gpt-5-mini') || modelLower.includes('gpt-4o-mini') || modelLower.includes('gemini-3.5-flash') || modelLower.includes('gemini-2.5-flash')) score += 0
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

  function resetAISettingsDefaults() {
    setOpenAIBaseURL(DEFAULT_OPENAI_BASE_URL)
    setOpenAIModel(DEFAULT_OPENAI_MODEL)
    setGeminiBaseURL(DEFAULT_GEMINI_BASE_URL)
    setGeminiModel(DEFAULT_GEMINI_MODEL)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 3,
        background:
          'radial-gradient(circle at top, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0) 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 2,
            px: { xs: 1, md: 0 },
            py: 1.2,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(2px)',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
              <IconButton
                onClick={onBack}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  '&:hover': { bgcolor: '#e5e7eb' },
                }}
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {novelTitle}
                </Typography>
                <Stack direction="row" spacing={1.2} sx={{ color: '#9ca3af', mt: 0.25 }}>
                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <TaskAltRoundedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">已保存到云端</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">正文 {editor.chapterWordCount} 字</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            <EditorActionButtons
              onBack={onBack}
              onOpenAISettings={() => {
                setShowAISettingsDialog(true)
                void loadAISettings()
              }}
              onRewrite={() => {
                setRewriteSelection({ start: editor.bodySelection.start, end: editor.bodySelection.end })
                setShowRewriteDialog(true)
              }}
              rewriteDisabled={editor.generating || !canRewrite}
              onGenerate={openGenerateConfirm}
              onSave={() => void editor.handleSave()}
              generating={editor.generating}
              saving={editor.saving}
              chapterNumber={editor.chapterNumber}
              volumeID={editor.volumeID}
              isEdit={editor.isEdit}
            />
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
          {editor.generating && (
            <Alert
              severity="info"
              icon={<CircularProgress size={18} />}
              sx={{ mb: 1.5, borderRadius: 2 }}
            >
              正在生成章节内容，请稍候... 已思考 {editor.generatingSeconds} 秒
            </Alert>
          )}

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
                <Box sx={{ flex: editor.sidePanel ? 5 : 1, display: 'flex', justifyContent: 'center' }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      width: '100%',
                      maxWidth: 900,
                      transition: 'all 220ms ease',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                          <FormControl sx={{ width: { xs: '100%', sm: 220 } }}>
                            <InputLabel id="chapter-volume-select">分卷</InputLabel>
                            <Select
                              labelId="chapter-volume-select"
                              label="分卷"
                              value={editor.volumeID}
                              onChange={(e) => editor.setVolumeID(Number(e.target.value))}
                            >
                              {volumes.map((v) => (
                                <MenuItem key={v.id} value={v.id}>
                                  第{v.volume_number}卷：{v.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            label="章节编号"
                            type="number"
                            value={editor.chapterNumber}
                            onChange={(e) => editor.setChapterNumber(Number(e.target.value) || 0)}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                          />
                          <TextField
                            label="章节标题"
                            value={editor.chapterTitle}
                            onChange={(e) => editor.setChapterTitle(e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="字数（自动）"
                            type="number"
                            value={editor.chapterWordCount}
                            InputProps={{ readOnly: true }}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                          />
                        </Stack>

                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <TextField
                              label="正文"
                              multiline
                              minRows={26}
                              value={editor.chapterBody}
                              onChange={(e) => editor.setChapterBody(e.target.value)}
                              inputRef={chapterBodyInputRef}
                              onSelect={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                editor.handleBodySelect(target.selectionStart ?? 0, target.selectionEnd ?? 0)
                              }}
                              onFocus={editor.handleBodyFocus}
                              onKeyDown={editor.handleBodyKeyDown}
                              onPaste={editor.handleBodyPaste}
                              onCopy={editor.handleBodyCopy}
                              onCut={editor.handleBodyCut}
                              onBlur={(e) => {
                                editor.setChapterBody((prev) => editor.ensureIndentedBody(prev))
                                const next = e.relatedTarget as Element | null
                                if (next && next.closest('[data-keep-body-selection="true"]')) {
                                  return
                                }
                                editor.handleBodyBlur()
                              }}
                              fullWidth
                              sx={{
                                '& textarea::selection': {
                                  backgroundColor: '#fb923c',
                                  color: '#111827',
                                },
                                '& textarea::-moz-selection': {
                                  backgroundColor: '#fb923c',
                                  color: '#111827',
                                },
                              }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              已选中 {Math.max(0, editor.bodySelection.end - editor.bodySelection.start)} 字
                            </Typography>
                          </CardContent>
                        </Card>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {editor.sidePanel && (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      flex: 2,
                      transition: 'all 220ms ease',
                      bgcolor: 'rgba(255,255,255,0.98)',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {editor.sidePanel === 'summary' && '章节总结'}
                          {editor.sidePanel === 'outline' && '章节大纲'}
                          {editor.sidePanel === 'instruction' && '生成指令'}
                          {editor.sidePanel === 'history' && '生成历史'}
                        </Typography>
                        <IconButton size="small" onClick={() => editor.setSidePanel(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      {editor.sidePanel === 'summary' && (
                        <TextField label="章节总结" multiline minRows={24} value={editor.chapterSummary} onChange={(e) => editor.setChapterSummary(e.target.value)} fullWidth />
                      )}
                      {editor.sidePanel === 'outline' && (
                        <TextField label="章节大纲" multiline minRows={24} value={editor.chapterOutline} onChange={(e) => editor.setChapterOutline(e.target.value)} fullWidth />
                      )}
                      {editor.sidePanel === 'instruction' && (
                        <Stack spacing={1.5}>
                          <Autocomplete
                            multiple
                            options={editor.groupedCharacterOptions}
                            groupBy={(option) => option.group}
                            value={editor.selectedCharacters}
                            onChange={(_, next) => editor.setSelectedCharacterIDs(next.map((c) => c.id))}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            filterOptions={(options, state) => {
                              const keyword = state.inputValue.trim().toLowerCase()
                              if (!keyword) return options
                              return options.filter((o) =>
                                o.name.toLowerCase().includes(keyword) ||
                                o.aliases.toLowerCase().includes(keyword) ||
                                o.role.toLowerCase().includes(keyword),
                              )
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="本章登场人物（可选）" placeholder="搜索姓名/别名/身份" />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {option.role || '无身份'}{option.aliases ? ` · 别名：${option.aliases}` : ''}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                          <Autocomplete
                            multiple
                            options={loreEntries}
                            value={editor.selectedLoreEntries}
                            onChange={(_, next) => editor.setSelectedLoreEntryIDs(next.map((e) => e.id))}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                              <TextField {...params} label="本章相关设定（可选）" placeholder="选择法器/丹药/阵法等" />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {loreCategoryLabelMap[option.category] ?? option.category}{option.tags ? ` · ${option.tags}` : ''}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                          <TextField label="生成指令" multiline minRows={20} value={editor.chapterInstruction} onChange={(e) => editor.setChapterInstruction(e.target.value)} fullWidth />
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <FormControl sx={{ minWidth: 200 }}>
                              <InputLabel id="generate-template-select">生成模板</InputLabel>
                              <Select
                                labelId="generate-template-select"
                                label="生成模板"
                                value={editor.selectedTemplateId}
                                onChange={(e) => editor.applyTemplate(String(e.target.value))}
                              >
                                <MenuItem value="">不使用模板</MenuItem>
                                {editor.generateTemplates.map((tpl) => (
                                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Button
                              variant="outlined"
                              disabled={!editor.selectedTemplateId}
                              onClick={() => editor.applyTemplate(editor.selectedTemplateId)}
                            >
                              重新套用
                            </Button>
                          </Stack>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <TextField
                              label="最近章节参考数"
                              type="number"
                              value={editor.recentChapterCount}
                              onChange={(e) => editor.setRecentChapterCount(Math.max(1, Number(e.target.value) || 1))}
                              sx={{ flex: 1 }}
                              inputProps={{ min: 1, max: 20 }}
                            />
                            <TextField
                              label="目标字数下限"
                              type="number"
                              value={editor.targetWordMin}
                              onChange={(e) => editor.setTargetWordMin(Math.max(0, Number(e.target.value) || 0))}
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="目标字数上限"
                              type="number"
                              value={editor.targetWordMax}
                              onChange={(e) => editor.setTargetWordMax(Math.max(0, Number(e.target.value) || 0))}
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}>
                            <CardContent sx={{ py: 1.5 }}>
                              <Stack spacing={1.2}>
                                <Typography variant="subtitle2">生成反馈（用于下一次自动优化）</Typography>
                                <FormControl fullWidth size="small">
                                  <InputLabel id="generate-feedback-rating-label">评分</InputLabel>
                                  <Select
                                    labelId="generate-feedback-rating-label"
                                    label="评分"
                                    value={editor.generateFeedbackRating}
                                    onChange={(e) => editor.setGenerateFeedbackRating(String(e.target.value) as '' | 'satisfied' | 'neutral' | 'unsatisfied')}
                                  >
                                    <MenuItem value="">未评分</MenuItem>
                                    <MenuItem value="satisfied">满意</MenuItem>
                                    <MenuItem value="neutral">一般</MenuItem>
                                    <MenuItem value="unsatisfied">不满意</MenuItem>
                                  </Select>
                                </FormControl>
                                <TextField
                                  label="备注（可选）"
                                  value={editor.generateFeedbackNote}
                                  onChange={(e) => editor.setGenerateFeedbackNote(e.target.value)}
                                  multiline
                                  minRows={2}
                                  placeholder="例如：减少说教，战斗节奏更快，对话更自然。"
                                  fullWidth
                                />
                                <Stack direction="row" justifyContent="flex-end">
                                  <Button size="small" variant="outlined" onClick={editor.saveGenerateFeedback}>
                                    保存反馈
                                  </Button>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                          <Stack spacing={0}>
                            <FormControlLabel
                              control={<Checkbox checked={editor.avoidTranslationTone} onChange={(e) => editor.setAvoidTranslationTone(e.target.checked)} />}
                              label="避免翻译腔"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.avoidModernSlang} onChange={(e) => editor.setAvoidModernSlang(e.target.checked)} />}
                              label="避免现代网络口语"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.keepPovConsistent} onChange={(e) => editor.setKeepPovConsistent(e.target.checked)} />}
                              label="保持叙事视角一致"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.keepTenseConsistent} onChange={(e) => editor.setKeepTenseConsistent(e.target.checked)} />}
                              label="保持时态一致"
                            />
                          </Stack>
                          <Button
                            variant="outlined"
                            onClick={() => void editor.retryGenerate()}
                            disabled={
                              editor.generating ||
                              !editor.chapterInstruction.trim() ||
                              editor.volumeID <= 0 ||
                              editor.chapterNumber <= 0 ||
                              (editor.targetWordMin > 0 && editor.targetWordMax > 0 && editor.targetWordMin > editor.targetWordMax)
                            }
                          >
                            重试生成
                          </Button>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button
                              variant="outlined"
                              onClick={() => void editor.handleQuickRevise('polish')}
                              disabled={editor.generating || !editor.chapterBody.trim()}
                            >
                              快速润色
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => void editor.handleQuickRevise('compress')}
                              disabled={editor.generating || !editor.chapterBody.trim()}
                            >
                              快速压缩
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => void editor.handleQuickRevise('reflow')}
                              disabled={editor.generating || !editor.chapterBody.trim()}
                            >
                              重排段落
                            </Button>
                          </Stack>
                        </Stack>
                      )}
                      {editor.sidePanel === 'history' && (
                        <Stack spacing={1}>
                          {editor.generateHistory.length === 0 && (
                            <Typography variant="body2" color="text.secondary">暂无历史生成记录。</Typography>
                          )}
                          {editor.generateHistory.map((item, idx) => (
                            <Card key={`${item.createdAt}_${idx}`} variant="outlined" sx={{ borderRadius: 2 }}>
                              <CardContent sx={{ py: 1.5 }}>
                                <Stack spacing={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                                    {item.model ? ` · ${item.model}` : ''}
                                    {item.totalTokens ? ` · ${item.totalTokens} tokens` : ''}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#475569' }}>
                                    指令：{item.instructionPreview || '（无）'}
                                  </Typography>
                                  <Button size="small" variant="outlined" onClick={() => setPendingHistoryIndex(idx)}>
                                    回填此版本
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>

            <Stack
              spacing={1}
              sx={{
                width: 110,
                flexShrink: 0,
                position: { lg: 'sticky' },
                top: { lg: 110 },
              }}
            >
              <Button
                variant={editor.sidePanel === 'summary' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'summary' ? null : 'summary'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'summary' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'summary' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'summary' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'summary' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'summary' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                总结
              </Button>
              <Button
                variant={editor.sidePanel === 'outline' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'outline' ? null : 'outline'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'outline' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'outline' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'outline' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'outline' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'outline' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                大纲
              </Button>
              <Button
                variant={editor.sidePanel === 'instruction' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'instruction' ? null : 'instruction'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'instruction' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'instruction' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'instruction' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'instruction' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'instruction' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                指令
              </Button>
              <Button
                variant={editor.sidePanel === 'history' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'history' ? null : 'history'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'history' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'history' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'history' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'history' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'history' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                历史
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            bgcolor: 'rgba(255,255,255,0.95)',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            px: 2,
            py: 1,
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          }}
        >
          <EditorActionButtons
            onBack={onBack}
            onRewrite={() => {
              setRewriteSelection({ start: editor.bodySelection.start, end: editor.bodySelection.end })
              setShowRewriteDialog(true)
            }}
            rewriteDisabled={editor.generating || !canRewrite}
            onGenerate={openGenerateConfirm}
            onSave={() => void editor.handleSave()}
            generating={editor.generating}
            saving={editor.saving}
            chapterNumber={editor.chapterNumber}
            volumeID={editor.volumeID}
            isEdit={editor.isEdit}
            compact
          />
        </Box>

        <Snackbar open={Boolean(editor.localSuccess)} autoHideDuration={2400} onClose={() => editor.setLocalSuccess('')}>
          <Alert severity="success" onClose={() => editor.setLocalSuccess('')} sx={{ width: '100%' }}>
            {editor.localSuccess}
          </Alert>
        </Snackbar>
        <Snackbar open={Boolean(editor.localError)} autoHideDuration={3200} onClose={() => editor.setLocalError('')}>
          <Alert
            severity="error"
            onClose={() => editor.setLocalError('')}
            sx={{ width: '100%' }}
            action={editor.canRetryGenerate ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => void editor.retryGenerate()}
                disabled={editor.generating || !editor.chapterInstruction.trim() || editor.volumeID <= 0 || editor.chapterNumber <= 0}
              >
                重试
              </Button>
            ) : undefined}
          >
            {editor.localError}
          </Alert>
        </Snackbar>

        <Dialog
          open={showAISettingsDialog}
          onClose={() => setShowAISettingsDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>AI 设置</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="chapter-ai-provider-select-label">AI Provider</InputLabel>
                <Select
                  labelId="chapter-ai-provider-select-label"
                  label="AI Provider"
                  value={aiProvider}
                  onChange={(e) => setAIProvider(String(e.target.value) as 'openai' | 'gemini')}
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={aiProvider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'}
                type="password"
                value={aiProvider === 'openai' ? openaiAPIKeyInput : geminiAPIKeyInput}
                onChange={(e) => aiProvider === 'openai' ? setOpenAIAPIKeyInput(e.target.value) : setGeminiAPIKeyInput(e.target.value)}
                placeholder={aiProvider === 'openai'
                  ? (openaiHasAPIKey ? `当前：${openaiAPIKeyMasked}` : 'sk-...')
                  : (geminiHasAPIKey ? `当前：${geminiAPIKeyMasked}` : 'AIza...')}
                helperText={aiProvider === 'openai'
                  ? (openaiHasAPIKey ? `已保存：${openaiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')
                  : (geminiHasAPIKey ? `已保存：${geminiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')}
                fullWidth
              />
              <TextField
                label={aiProvider === 'openai' ? 'OpenAI Base URL' : 'Gemini Base URL'}
                value={aiProvider === 'openai' ? openaiBaseURL : geminiBaseURL}
                onChange={(e) => aiProvider === 'openai' ? setOpenAIBaseURL(e.target.value) : setGeminiBaseURL(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="chapter-ai-model-select-label">{aiProvider === 'openai' ? 'OpenAI Model' : 'Gemini Model'}</InputLabel>
                <Select
                  labelId="chapter-ai-model-select-label"
                  label={aiProvider === 'openai' ? 'OpenAI Model' : 'Gemini Model'}
                  value={aiProvider === 'openai' ? openaiModel : geminiModel}
                  onChange={(e) => aiProvider === 'openai' ? setOpenAIModel(String(e.target.value)) : setGeminiModel(String(e.target.value))}
                >
                  {(aiProvider === 'openai' ? AI_MODEL_OPTIONS : GEMINI_MODEL_OPTIONS).map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetAISettingsDefaults}>恢复默认</Button>
            <Button onClick={() => setShowAISettingsDialog(false)}>取消</Button>
            <Button variant="contained" onClick={() => void saveAISettings()} disabled={aiSettingLoading}>
              保存
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmGenerateOpen} onClose={() => setConfirmGenerateOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>确认 AI 生成</DialogTitle>
          <DialogContent>
            <Stack spacing={1} sx={{ mt: 0.5 }}>
              <Typography variant="body2">
                成本档位：<Box component="span" sx={{ fontWeight: 700 }}>{getGenerateCostProfile().level}</Box>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                预计 tokens：输入约 {estimateTokenAndCost().inputTokens} / 输出约 {estimateTokenAndCost().outputTokens}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                预计费用：${estimateTokenAndCost().low.toFixed(3)} - ${estimateTokenAndCost().high.toFixed(3)}（USD，估算）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getGenerateCostProfile().hint}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                将基于当前参数生成并回填「正文 / 大纲 / 总结」，会覆盖当前这三项内容。
              </Typography>
              <Typography variant="body2">Provider：{aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}</Typography>
              <Typography variant="body2">模型：{aiProvider === 'openai' ? openaiModel : geminiModel}</Typography>
              <Typography variant="body2">分卷：{volumes.find((v) => v.id === editor.volumeID)?.title ?? '未选择'}</Typography>
              <Typography variant="body2">章节：第 {editor.chapterNumber} 章 {editor.chapterTitle ? `《${editor.chapterTitle}》` : ''}</Typography>
              <Typography variant="body2">目标字数：{editor.targetWordMin} - {editor.targetWordMax}</Typography>
              <Typography variant="body2">
                指令预览：{editor.chapterInstruction.trim() ? editor.chapterInstruction.trim().slice(0, 80) : '（空）'}
              </Typography>
              {getGenerateCostProfile().isHigh && (
                <FormControlLabel
                  control={<Checkbox checked={highCostAcknowledged} onChange={(e) => setHighCostAcknowledged(e.target.checked)} />}
                  label="我已知晓本次是高成本生成，仍继续。"
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmGenerateOpen(false)}>取消</Button>
            <Button
              variant="contained"
              onClick={() => void confirmGenerate()}
              disabled={
                (getGenerateCostProfile().isHigh && !highCostAcknowledged) ||
                editor.generating ||
                editor.saving ||
                !editor.chapterInstruction.trim() ||
                editor.volumeID <= 0 ||
                editor.chapterNumber <= 0 ||
                (editor.targetWordMin > 0 && editor.targetWordMax > 0 && editor.targetWordMin > editor.targetWordMax)
              }
            >
              确认生成
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={pendingHistoryIndex !== null} onClose={() => setPendingHistoryIndex(null)} fullWidth maxWidth="md">
          <DialogTitle>确认回填历史版本</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                回填将覆盖当前“正文/大纲/总结”内容，请确认后继续。
              </Typography>
              {pendingHistoryItem && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>当前内容（预览）</Typography>
                      <Typography variant="caption" color="text.secondary">正文</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{editor.chapterBody.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">大纲</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{editor.chapterOutline.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">总结</Typography>
                      <Typography variant="body2">{editor.chapterSummary.slice(0, 120) || '（空）'}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>历史版本（预览）</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(pendingHistoryItem.createdAt).toLocaleString('zh-CN')}
                        {pendingHistoryItem.model ? ` · ${pendingHistoryItem.model}` : ''}
                        {pendingHistoryItem.totalTokens ? ` · ${pendingHistoryItem.totalTokens} tokens` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>正文</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{pendingHistoryItem.body.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">大纲</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{pendingHistoryItem.outline.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">总结</Typography>
                      <Typography variant="body2">{pendingHistoryItem.summary.slice(0, 120) || '（空）'}</Typography>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingHistoryIndex(null)}>取消</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (pendingHistoryIndex !== null) editor.applyGenerateHistory(pendingHistoryIndex)
                setPendingHistoryIndex(null)
              }}
            >
              确认回填
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showRewriteDialog} onClose={() => setShowRewriteDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle>局部重写</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                仅替换当前选中的正文内容，其他正文保持不变。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                当前选中：{Math.max(0, (rewriteSelection?.end ?? 0) - (rewriteSelection?.start ?? 0))} 字
              </Typography>
              <TextField
                label="本段额外提示词（可选）"
                value={rewritePrompt}
                onChange={(e) => setRewritePrompt(e.target.value)}
                multiline
                minRows={3}
                placeholder="例如：更克制冷静；减少解释；强调动作与细节。"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRewriteDialog(false)}>取消</Button>
            <Button
              variant="contained"
              data-keep-body-selection="true"
              disabled={editor.generating || !rewriteSelection || rewriteSelection.end <= rewriteSelection.start}
              onClick={() => {
                const prompt = rewritePrompt
                setShowRewriteDialog(false)
                setRewritePrompt('')
                const selectedRange = rewriteSelection
                setRewriteSelection(null)
                void editor.handleRewriteSelectedBody(prompt, selectedRange ?? undefined)
              }}
            >
              开始重写
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(editor.pendingRewrite)}
          onClose={editor.discardPendingRewrite}
          fullWidth
          maxWidth="sm"
          sx={{
            '& .MuiDialog-container': {
              justifyContent: 'flex-end',
              alignItems: 'center',
              pr: { xs: 1, md: 2 },
            },
            '& .MuiDialog-paper': {
              m: 0,
              width: { xs: '96vw', sm: 560 },
              maxHeight: '78vh',
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle>局部重写预览</DialogTitle>
          <DialogContent>
            <Stack spacing={1.2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                请先确认重写内容，再决定是否替换。
              </Typography>
              <TextField
                label="原文（选中段落）"
                value={editor.pendingRewrite?.original ?? ''}
                multiline
                minRows={5}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="重写结果"
                value={editor.pendingRewrite?.rewritten ?? ''}
                multiline
                minRows={7}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={editor.discardPendingRewrite}>放弃替换</Button>
            <Button
              variant="contained"
              onClick={editor.applyPendingRewrite}
              sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}
            >
              应用替换
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
