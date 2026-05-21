import { ClipboardEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { createChapter, generateChapterStream, type Chapter, updateChapter } from '../api/chapters'
import { APIError } from '../api/http'
import type { Character } from '../api/characters'
import type { LoreEntry } from '../api/loreEntries'
import type { Volume } from '../api/volumes'

type SidePanel = 'summary' | 'outline' | 'instruction' | 'history' | null
type GenerateHistoryItem = {
  createdAt: string
  outline: string
  body: string
  summary: string
  model?: string
  totalTokens?: number
  instructionPreview: string
}
type GenerateTemplate = {
  id: string
  label: string
  targetWordMin: number
  targetWordMax: number
  recentChapterCount: number
  avoidTranslationTone: boolean
  avoidModernSlang: boolean
  keepPovConsistent: boolean
  keepTenseConsistent: boolean
  instructionSeed: string
}
type GenerateFeedbackRating = 'satisfied' | 'neutral' | 'unsatisfied' | ''
type GenerateFeedback = {
  rating: GenerateFeedbackRating
  note: string
  updatedAt: string
}

type Params = {
  token: string
  novelId: number
  initialChapter?: Chapter | null
  defaultChapterNumber?: number
  volumes: Volume[]
  characters: Character[]
  loreEntries: LoreEntry[]
  recentChapterCountDefault: number
  onNotifySuccess: (msg: string) => void
  onNotifyError: (msg: string) => void
  onSaved: () => Promise<void> | void
  onBack: () => void
}

type CharacterOption = Character & { group: string }

const INDENT = '　　'
const TEMPLATE_KEY_PREFIX = 'novel_agent_generate_template'
const GENERATE_TEMPLATES: GenerateTemplate[] = [
  {
    id: 'stable-default',
    label: '稳定输出（推荐）',
    targetWordMin: 2000,
    targetWordMax: 2300,
    recentChapterCount: 2,
    avoidTranslationTone: true,
    avoidModernSlang: true,
    keepPovConsistent: true,
    keepTenseConsistent: true,
    instructionSeed: '目标：严格按设定推进剧情，保证人物动机清晰，段落节奏稳定，结尾留轻钩子。',
  },
  {
    id: 'xianxia-main',
    label: '修仙主线推进',
    targetWordMin: 2200,
    targetWordMax: 3200,
    recentChapterCount: 4,
    avoidTranslationTone: true,
    avoidModernSlang: true,
    keepPovConsistent: true,
    keepTenseConsistent: true,
    instructionSeed: '目标：推进主线冲突并回收一个旧伏笔；结尾保留下一章钩子。',
  },
  {
    id: 'battle',
    label: '战斗章节',
    targetWordMin: 1800,
    targetWordMax: 2600,
    recentChapterCount: 3,
    avoidTranslationTone: true,
    avoidModernSlang: true,
    keepPovConsistent: true,
    keepTenseConsistent: true,
    instructionSeed: '目标：按“试探-爆发-收束”推进战斗，体现战术变化与人物状态变化。',
  },
  {
    id: 'transition',
    label: '日常过渡',
    targetWordMin: 1400,
    targetWordMax: 2200,
    recentChapterCount: 2,
    avoidTranslationTone: true,
    avoidModernSlang: true,
    keepPovConsistent: true,
    keepTenseConsistent: true,
    instructionSeed: '目标：过渡但保持信息增量（关系/资源/线索至少一项变化）。',
  },
  {
    id: 'emotion',
    label: '情绪与关系',
    targetWordMin: 1600,
    targetWordMax: 2400,
    recentChapterCount: 3,
    avoidTranslationTone: true,
    avoidModernSlang: true,
    keepPovConsistent: true,
    keepTenseConsistent: true,
    instructionSeed: '目标：围绕主视角人物推进关系变化，突出行为细节与心理变化对应。',
  },
]

export function useChapterEditor({
  token,
  novelId,
  initialChapter,
  defaultChapterNumber = 1,
  volumes,
  characters,
  loreEntries,
  recentChapterCountDefault,
  onNotifySuccess,
  onNotifyError,
  onSaved,
  onBack,
}: Params) {
  const latestVolumeID = useMemo(() => {
    if (volumes.length === 0) return 0
    return volumes.reduce((latest, current) => {
      if (current.volume_number > latest.volume_number) return current
      if (current.volume_number === latest.volume_number && current.id > latest.id) return current
      return latest
    }).id
  }, [volumes])

  const [chapterNumber, setChapterNumber] = useState(initialChapter?.chapter_number ?? defaultChapterNumber)
  const [volumeID, setVolumeID] = useState<number>(initialChapter?.volume_id ?? latestVolumeID)
  const [chapterTitle, setChapterTitle] = useState(initialChapter?.title ?? '')
  const [chapterBody, setChapterBody] = useState(ensureIndentedBody(initialChapter?.body ?? INDENT))
  const [chapterSummary, setChapterSummary] = useState(initialChapter?.summary ?? '')
  const [chapterOutline, setChapterOutline] = useState(initialChapter?.outline ?? '')
  const [chapterInstruction, setChapterInstruction] = useState(initialChapter?.generation_instruction ?? '')
  const [recentChapterCount, setRecentChapterCount] = useState(Math.max(1, recentChapterCountDefault || 3))
  const [targetWordMin, setTargetWordMin] = useState(1800)
  const [targetWordMax, setTargetWordMax] = useState(2600)
  const [avoidTranslationTone, setAvoidTranslationTone] = useState(true)
  const [avoidModernSlang, setAvoidModernSlang] = useState(true)
  const [keepPovConsistent, setKeepPovConsistent] = useState(true)
  const [keepTenseConsistent, setKeepTenseConsistent] = useState(true)
  const [selectedCharacterIDs, setSelectedCharacterIDs] = useState<number[]>([])
  const [selectedLoreEntryIDs, setSelectedLoreEntryIDs] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingSeconds, setGeneratingSeconds] = useState(0)
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const [localSuccess, setLocalSuccess] = useState('')
  const [localError, setLocalError] = useState('')
  const [canRetryGenerate, setCanRetryGenerate] = useState(false)
  const [recentCharacterIDs, setRecentCharacterIDs] = useState<number[]>([])
  const [generateHistory, setGenerateHistory] = useState<GenerateHistoryItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [generateFeedbackRating, setGenerateFeedbackRating] = useState<GenerateFeedbackRating>('')
  const [generateFeedbackNote, setGenerateFeedbackNote] = useState('')

  const chapterWordCount = useMemo(() => chapterBody.replace(/\s/g, '').length, [chapterBody])
  const isEdit = Boolean(initialChapter)
  const draftKey = useMemo(() => `novel_agent_chapter_draft_${novelId}_${initialChapter?.id ?? 'new'}`,[novelId, initialChapter?.id])
  const recentCharacterKey = useMemo(() => `novel_agent_recent_characters_${novelId}`, [novelId])
  const templateKey = useMemo(() => `${TEMPLATE_KEY_PREFIX}_${novelId}`, [novelId])
  const generateHistoryKey = useMemo(() => {
    const chapterKey = initialChapter?.id ?? `new_${chapterNumber}`
    return `novel_agent_generate_history_${novelId}_${chapterKey}`
  }, [novelId, initialChapter?.id, chapterNumber])
  const generateFeedbackKey = useMemo(() => {
    const chapterKey = initialChapter?.id ?? `new_${chapterNumber}`
    return `novel_agent_generate_feedback_${novelId}_${chapterKey}`
  }, [novelId, initialChapter?.id, chapterNumber])
  const groupedCharacterOptions = useMemo<CharacterOption[]>(
    () =>
      [...characters]
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
        .map((c) => {
          let group = '全部人物'
          if (recentCharacterIDs.includes(c.id)) group = '最近使用'
          else if (c.importance_level >= 5) group = '主要人物'
          return { ...c, group }
        }),
    [characters, recentCharacterIDs],
  )
  const selectedCharacters = useMemo(
    () => groupedCharacterOptions.filter((c) => selectedCharacterIDs.includes(c.id)),
    [groupedCharacterOptions, selectedCharacterIDs],
  )
  const validCharacterIDSet = useMemo(() => new Set(characters.map((c) => c.id)), [characters])
  const selectedLoreEntries = useMemo(
    () => loreEntries.filter((e) => selectedLoreEntryIDs.includes(e.id)),
    [loreEntries, selectedLoreEntryIDs],
  )
  const validLoreEntryIDSet = useMemo(() => new Set(loreEntries.map((e) => e.id)), [loreEntries])

  useEffect(() => {
    if (volumes.length === 0) {
      if (volumeID !== 0) setVolumeID(0)
      return
    }
    if (!isEdit && volumeID <= 0) {
      setVolumeID(latestVolumeID)
      return
    }
    const matched = volumes.some((v) => v.id === volumeID)
    if (!matched) setVolumeID(isEdit ? volumes[0].id : latestVolumeID)
  }, [isEdit, latestVolumeID, volumeID, volumes])

  useEffect(() => {
    const raw = localStorage.getItem(recentCharacterKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as number[]
      if (Array.isArray(parsed)) setRecentCharacterIDs(parsed.filter((id) => Number.isFinite(id)))
    } catch {
      localStorage.removeItem(recentCharacterKey)
    }
  }, [recentCharacterKey])

  useEffect(() => {
    const saved = localStorage.getItem(templateKey)
    if (!saved) return
    if (GENERATE_TEMPLATES.some((t) => t.id === saved)) setSelectedTemplateId(saved)
  }, [templateKey])

  useEffect(() => {
    const raw = localStorage.getItem(generateHistoryKey)
    if (!raw) {
      setGenerateHistory([])
      return
    }
    try {
      const parsed = JSON.parse(raw) as GenerateHistoryItem[]
      if (Array.isArray(parsed)) setGenerateHistory(parsed.slice(0, 3))
      else setGenerateHistory([])
    } catch {
      localStorage.removeItem(generateHistoryKey)
      setGenerateHistory([])
    }
  }, [generateHistoryKey])

  useEffect(() => {
    const raw = localStorage.getItem(generateFeedbackKey)
    if (!raw) {
      setGenerateFeedbackRating('')
      setGenerateFeedbackNote('')
      return
    }
    try {
      const parsed = JSON.parse(raw) as GenerateFeedback
      setGenerateFeedbackRating(parsed.rating || '')
      setGenerateFeedbackNote(parsed.note || '')
    } catch {
      localStorage.removeItem(generateFeedbackKey)
      setGenerateFeedbackRating('')
      setGenerateFeedbackNote('')
    }
  }, [generateFeedbackKey])

  useEffect(() => {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as {
        volumeID: number
        chapterNumber: number
        chapterTitle: string
        chapterBody: string
        chapterSummary: string
        chapterOutline: string
        chapterInstruction: string
        selectedCharacterIDs?: number[]
        selectedLoreEntryIDs?: number[]
        targetWordMin?: number
        targetWordMax?: number
        avoidTranslationTone?: boolean
        avoidModernSlang?: boolean
        keepPovConsistent?: boolean
        keepTenseConsistent?: boolean
        recentChapterCount?: number
      }
      if (isEdit) setVolumeID(draft.volumeID ?? volumeID)
      else setVolumeID(latestVolumeID)
      setChapterNumber(draft.chapterNumber ?? chapterNumber)
      setChapterTitle(draft.chapterTitle ?? '')
      setChapterBody(ensureIndentedBody(draft.chapterBody ?? ''))
      setChapterSummary(draft.chapterSummary ?? '')
      setChapterOutline(draft.chapterOutline ?? '')
      setChapterInstruction(draft.chapterInstruction ?? '')
      setSelectedCharacterIDs(Array.isArray(draft.selectedCharacterIDs) ? draft.selectedCharacterIDs.filter((id) => validCharacterIDSet.has(id)) : [])
      setSelectedLoreEntryIDs(Array.isArray(draft.selectedLoreEntryIDs) ? draft.selectedLoreEntryIDs.filter((id) => validLoreEntryIDSet.has(id)) : [])
      setTargetWordMin(Number.isFinite(draft.targetWordMin) ? Math.max(0, Number(draft.targetWordMin)) : 1800)
      setTargetWordMax(Number.isFinite(draft.targetWordMax) ? Math.max(0, Number(draft.targetWordMax)) : 2600)
      setAvoidTranslationTone(draft.avoidTranslationTone ?? true)
      setAvoidModernSlang(draft.avoidModernSlang ?? true)
      setKeepPovConsistent(draft.keepPovConsistent ?? true)
      setKeepTenseConsistent(draft.keepTenseConsistent ?? true)
      setRecentChapterCount(Number.isFinite(draft.recentChapterCount) ? Math.max(1, Number(draft.recentChapterCount)) : Math.max(1, recentChapterCountDefault || 3))
    } catch {
      localStorage.removeItem(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEdit, latestVolumeID, recentChapterCountDefault, validCharacterIDSet, validLoreEntryIDSet])

  useEffect(() => {
    if (!generating) {
      setGeneratingSeconds(0)
      return
    }
    const startedAt = Date.now()
    setGeneratingSeconds(0)
    const id = window.setInterval(() => {
      setGeneratingSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [generating])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const draft = {
        volumeID,
        chapterNumber,
        chapterTitle,
        chapterBody,
        chapterSummary,
        chapterOutline,
        chapterInstruction,
        selectedCharacterIDs,
        selectedLoreEntryIDs,
        targetWordMin,
        targetWordMax,
        avoidTranslationTone,
        avoidModernSlang,
        keepPovConsistent,
        keepTenseConsistent,
        recentChapterCount,
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }, 500)
    return () => window.clearTimeout(id)
  }, [draftKey, volumeID, chapterNumber, chapterTitle, chapterBody, chapterSummary, chapterOutline, chapterInstruction, selectedCharacterIDs, selectedLoreEntryIDs, targetWordMin, targetWordMax, avoidTranslationTone, avoidModernSlang, keepPovConsistent, keepTenseConsistent, recentChapterCount])

  function handleBodyKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start !== end) return

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    if (e.key === 'Backspace' && start <= indentEnd && lineStart > 0) {
      e.preventDefault()
      const merged = `${chapterBody.slice(0, lineStart - 1)}${chapterBody.slice(indentEnd)}`
      setChapterBody(merged)
      window.requestAnimationFrame(() => {
        const nextPos = lineStart - 1
        target.selectionStart = nextPos
        target.selectionEnd = nextPos
      })
      return
    }

    if (e.key === 'Backspace' && start <= indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key === 'Delete' && start < indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = `${chapterBody.slice(0, start)}\n${INDENT}${chapterBody.slice(end)}`
    setChapterBody(next)
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 1 + INDENT.length
      target.selectionEnd = start + 1 + INDENT.length
    })
  }

  function handleBodyPaste(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    e.preventDefault()

    const raw = e.clipboardData.getData('text')
    const normalizedPaste = raw.replace(/\r\n/g, '\n')

    let start = target.selectionStart
    let end = target.selectionEnd

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    if (start < indentEnd) start = indentEnd
    if (end < indentEnd) end = indentEnd

    const next = `${chapterBody.slice(0, start)}${normalizedPaste}${chapterBody.slice(end)}`
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = start + normalizedPaste.length
      target.selectionStart = pos
      target.selectionEnd = pos
    })
  }

  function stripIndentForClipboard(text: string): string {
    return text
      .split('\n')
      .map((line) => (line.startsWith(INDENT) ? line.slice(INDENT.length) : line))
      .join('\n')
  }

  function handleBodyCopy(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const selected = target.value.slice(target.selectionStart, target.selectionEnd)
    if (!selected) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))
  }

  function handleBodyCut(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start === end) return

    e.preventDefault()
    const selected = target.value.slice(start, end)
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))

    const next = ensureIndentedBody(`${chapterBody.slice(0, start)}${chapterBody.slice(end)}`)
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = Math.min(start, next.length)
      target.selectionStart = pos
      target.selectionEnd = pos
    })
  }

  async function handleSave() {
    if (chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (volumeID <= 0) {
      const msg = '请先选择分卷。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }

    setSaving(true)
    setCanRetryGenerate(false)
    try {
      const payload = {
        volume_id: volumeID,
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        body: ensureIndentedBody(chapterBody),
        word_count: chapterWordCount,
        generation_instruction: chapterInstruction,
        outline: chapterOutline,
        summary: chapterSummary,
      }

      if (isEdit && initialChapter) {
        await updateChapter(token, novelId, initialChapter.id, payload)
        onNotifySuccess('章节已更新。')
        setLocalSuccess('章节已保存。')
      } else {
        await createChapter(token, novelId, payload)
        onNotifySuccess('章节已创建。')
        setLocalSuccess('章节已创建。')
      }

      localStorage.removeItem(draftKey)
      await onSaved()
      onBack()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存章节失败'
      onNotifyError(msg)
      setLocalError(msg)
      setCanRetryGenerate(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    if (chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (volumeID <= 0) {
      const msg = '请先选择分卷。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (!chapterInstruction.trim()) {
      const msg = '请先填写生成指令。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (targetWordMin > 0 && targetWordMax > 0 && targetWordMin > targetWordMax) {
      const msg = '目标字数范围无效：下限不能大于上限。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }

    setLocalError('')
    setLocalSuccess('')
    setCanRetryGenerate(false)
    setGenerating(true)
    try {
      const safeCharacterIDs = selectedCharacterIDs.filter((id) => validCharacterIDSet.has(id))
      const safeLoreEntryIDs = selectedLoreEntryIDs.filter((id) => validLoreEntryIDSet.has(id))
      const feedbackHint = buildFeedbackHint(generateFeedbackRating, generateFeedbackNote)
      const generationInstruction = feedbackHint
        ? `${chapterInstruction.trim()}\n\n【上一轮反馈（请严格修正）】\n${feedbackHint}`
        : chapterInstruction.trim()
      const data = await generateChapterStream(
        token,
        novelId,
        {
        volume_id: volumeID,
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        generation_instruction: generationInstruction,
        character_ids: safeCharacterIDs,
        lore_entry_ids: safeLoreEntryIDs,
        target_word_min: targetWordMin,
        target_word_max: targetWordMax,
        avoid_translation_tone: avoidTranslationTone,
        avoid_modern_slang: avoidModernSlang,
        keep_pov_consistent: keepPovConsistent,
        keep_tense_consistent: keepTenseConsistent,
        recent_chapter_count: recentChapterCount,
        },
        (event) => {
          if (event.type === 'progress' && Number.isFinite(event.elapsed_seconds)) {
            setGeneratingSeconds((prev) => Math.max(prev, event.elapsed_seconds))
          }
        },
      )
      if (safeCharacterIDs.length > 0) {
        const merged = Array.from(new Set([...safeCharacterIDs, ...recentCharacterIDs])).slice(0, 30)
        setRecentCharacterIDs(merged)
        localStorage.setItem(recentCharacterKey, JSON.stringify(merged))
      }
      const generatedBodyWordCount = data.body.replace(/\s/g, '').length
      if (targetWordMin > 0 && generatedBodyWordCount < Math.floor(targetWordMin * 0.85)) {
        const msg = `生成结果疑似不完整（正文约 ${generatedBodyWordCount} 字，低于目标下限）。请重试，或适当放宽目标字数。`
        onNotifyError(msg)
        setLocalError(msg)
        setCanRetryGenerate(true)
        return
      }
      setChapterOutline(data.outline)
      setChapterBody(ensureIndentedBody(data.body))
      setChapterSummary(data.summary)
      setSidePanel('outline')
      const totalTokens = data.usage?.total_tokens ?? 0
      const usageText = totalTokens > 0 ? ` 本次消耗约 ${totalTokens} tokens。` : ''
      onNotifySuccess(`AI 生成完成。${usageText}`.trim())
      setLocalSuccess(`AI 生成完成，请检查后再保存。${usageText}`)
      const nextHistory: GenerateHistoryItem[] = [
        {
          createdAt: new Date().toISOString(),
          outline: data.outline,
          body: data.body,
          summary: data.summary,
          model: data.model,
          totalTokens: totalTokens > 0 ? totalTokens : undefined,
          instructionPreview: chapterInstruction.trim().slice(0, 80),
        },
        ...generateHistory,
      ].slice(0, 3)
      setGenerateHistory(nextHistory)
      localStorage.setItem(generateHistoryKey, JSON.stringify(nextHistory))
      setCanRetryGenerate(false)
    } catch (e) {
      const msg = mapGenerateErrorMessage(e)
      onNotifyError(msg)
      setLocalError(msg)
      setCanRetryGenerate(true)
    } finally {
      setGenerating(false)
    }
  }

  function saveGenerateFeedback() {
    if (!generateFeedbackRating && !generateFeedbackNote.trim()) {
      onNotifyError('请至少填写评分或备注后再保存反馈。')
      return
    }
    const payload: GenerateFeedback = {
      rating: generateFeedbackRating,
      note: generateFeedbackNote.trim(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(generateFeedbackKey, JSON.stringify(payload))
    onNotifySuccess('本章生成反馈已保存。下次生成会自动参考。')
  }

  function applyGenerateHistory(index: number) {
    const item = generateHistory[index]
    if (!item) return
    setChapterOutline(item.outline)
    setChapterBody(ensureIndentedBody(item.body))
    setChapterSummary(item.summary)
    setSidePanel('outline')
    onNotifySuccess('已回填历史生成版本。')
  }

  function applyTemplate(templateId: string) {
    const template = GENERATE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    setSelectedTemplateId(template.id)
    localStorage.setItem(templateKey, template.id)
    setTargetWordMin(template.targetWordMin)
    setTargetWordMax(template.targetWordMax)
    setRecentChapterCount(template.recentChapterCount)
    setAvoidTranslationTone(template.avoidTranslationTone)
    setAvoidModernSlang(template.avoidModernSlang)
    setKeepPovConsistent(template.keepPovConsistent)
    setKeepTenseConsistent(template.keepTenseConsistent)
    if (!chapterInstruction.trim()) setChapterInstruction(template.instructionSeed)
    onNotifySuccess(`已套用模板：${template.label}`)
  }

  return {
    chapterNumber,
    volumeID,
    chapterTitle,
    chapterBody,
    chapterSummary,
    chapterOutline,
    chapterInstruction,
    targetWordMin,
    targetWordMax,
    avoidTranslationTone,
    avoidModernSlang,
    keepPovConsistent,
    keepTenseConsistent,
    recentChapterCount,
    selectedCharacterIDs,
    selectedLoreEntryIDs,
    saving,
    generating,
    generatingSeconds,
    sidePanel,
    localSuccess,
    localError,
    canRetryGenerate,
    generateHistory,
    generateTemplates: GENERATE_TEMPLATES,
    selectedTemplateId,
    generateFeedbackRating,
    generateFeedbackNote,
    chapterWordCount,
    isEdit,
    groupedCharacterOptions,
    selectedCharacters,
    selectedLoreEntries,
    setChapterNumber,
    setVolumeID,
    setChapterTitle,
    setChapterBody,
    setChapterSummary,
    setChapterOutline,
    setChapterInstruction,
    setTargetWordMin,
    setTargetWordMax,
    setAvoidTranslationTone,
    setAvoidModernSlang,
    setKeepPovConsistent,
    setKeepTenseConsistent,
    setRecentChapterCount,
    setSelectedCharacterIDs,
    setSelectedLoreEntryIDs,
    setSidePanel,
    setLocalSuccess,
    setLocalError,
    setSelectedTemplateId,
    setGenerateFeedbackRating,
    setGenerateFeedbackNote,
    handleBodyKeyDown,
    handleBodyPaste,
    handleBodyCopy,
    handleBodyCut,
    handleSave,
    handleGenerate,
    retryGenerate: handleGenerate,
    applyGenerateHistory,
    applyTemplate,
    saveGenerateFeedback,
    ensureIndentedBody,
  }
}

function buildFeedbackHint(rating: GenerateFeedbackRating, note: string): string {
  const parts: string[] = []
  if (rating) {
    if (rating === 'satisfied') parts.push('评分：满意（保持当前风格与节奏）。')
    if (rating === 'neutral') parts.push('评分：一般（在结构与表达上继续优化）。')
    if (rating === 'unsatisfied') parts.push('评分：不满意（需明显修正内容质量与稳定性）。')
  }
  if (note.trim()) {
    parts.push(`备注：${note.trim()}`)
  }
  return parts.join('\n')
}

function mapGenerateErrorMessage(error: unknown): string {
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

function ensureIndentedBody(text: string): string {
  if (!text) return INDENT
  const lines = text.split('\n')
  return lines
    .map((line) => (line.startsWith(INDENT) ? line : `${INDENT}${line}`))
    .join('\n')
}
