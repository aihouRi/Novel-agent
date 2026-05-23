import { generateChapterStream } from '../../api/chapters'
import { GENERATE_TEMPLATES } from './constants'
import { mapGenerateErrorMessage } from './errors'
import { buildFeedbackHint, ensureIndentedBody } from './text'
import type {
  ChapterSnapshotItem,
  GenerateFeedback,
  GenerateFeedbackRating,
  GenerateHistoryItem,
  PendingRewrite,
  QuickReviseAction,
  SelectionRange,
} from './types'

type Options = {
  request: {
    token: string
    novelId: number
    chapterNumber: number
    volumeID: number
    chapterTitle: string
    chapterBody: string
    chapterInstruction: string
    chapterOutline: string
    chapterSummary: string
    chapterStatus: 'draft' | 'review' | 'final'
    targetWordMin: number
    targetWordMax: number
    avoidTranslationTone: boolean
    avoidModernSlang: boolean
    keepPovConsistent: boolean
    keepTenseConsistent: boolean
    recentChapterCount: number
    selectedCharacterIDs: number[]
    selectedLoreEntryIDs: number[]
  }
  state: {
    validCharacterIDSet: Set<number>
    validLoreEntryIDSet: Set<number>
    recentCharacterIDs: number[]
    generateHistory: GenerateHistoryItem[]
    generateFeedbackRating: GenerateFeedbackRating
    generateFeedbackNote: string
    bodySelection: SelectionRange
    pendingRewrite: PendingRewrite | null
    chapterSnapshots: ChapterSnapshotItem[]
  }
  storageKeys: {
    recentCharacterKey: string
    generateHistoryKey: string
    generateFeedbackKey: string
    templateKey: string
    chapterSnapshotKey: string
  }
  notify: {
    onNotifySuccess: (msg: string) => void
    onNotifyError: (msg: string) => void
  }
  setters: {
    setLocalError: (msg: string) => void
    setLocalSuccess: (msg: string) => void
    setCanRetryGenerate: (v: boolean) => void
    setGenerating: (v: boolean) => void
    setGeneratingSeconds: (v: number | ((prev: number) => number)) => void
    setRecentCharacterIDs: (v: number[]) => void
    setGenerateHistory: (v: GenerateHistoryItem[]) => void
    setChapterOutline: (v: string) => void
    setChapterBody: (v: string) => void
    setChapterSummary: (v: string) => void
    setSidePanel: (v: 'summary' | 'outline' | 'instruction' | 'history' | 'snapshot' | null) => void
    setPendingRewrite: (v: PendingRewrite | null) => void
    setBodySelection: (v: SelectionRange) => void
    setSelectedTemplateId: (v: string) => void
    setTargetWordMin: (v: number) => void
    setTargetWordMax: (v: number) => void
    setRecentChapterCount: (v: number) => void
    setAvoidTranslationTone: (v: boolean) => void
    setAvoidModernSlang: (v: boolean) => void
    setKeepPovConsistent: (v: boolean) => void
    setKeepTenseConsistent: (v: boolean) => void
    setChapterInstruction: (v: string) => void
    setChapterTitle: (v: string) => void
    setChapterStatus: (v: 'draft' | 'review' | 'final') => void
    setChapterSnapshots: (v: ChapterSnapshotItem[]) => void
  }
}

export function useChapterGeneration(options: Options) {
  const { request, state, storageKeys, notify, setters } = options

  function buildQuickReviseInstruction(action: QuickReviseAction): string {
    const body = request.chapterBody.trim()
    if (!body) return ''
    const base = request.chapterInstruction.trim()
    const actionPromptMap: Record<QuickReviseAction, string> = {
      polish:
        '请在不改变剧情事实与人物关系的前提下润色正文：减少翻译腔，优化句式与节奏，保留中文网文可读性。',
      compress:
        '请在不改变核心剧情与人物动机的前提下压缩正文至更紧凑版本：删冗句、减重复、保留关键转折和情绪。',
      reflow:
        '请重排正文段落与节奏：加强分段与停顿，让阅读更顺滑；不要改动剧情事实与主要信息。',
    }
    const suffix = `【快速修订任务】\n${actionPromptMap[action]}\n\n【待修订正文】\n${body}`
    return base ? `${base}\n\n${suffix}` : suffix
  }

  async function runGenerateWithInstruction(instructionInput: string) {
    if (request.chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }
    if (request.volumeID <= 0) {
      const msg = '请先选择分卷。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }
    if (!instructionInput.trim()) {
      const msg = '请先填写生成指令。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }
    if (request.targetWordMin > 0 && request.targetWordMax > 0 && request.targetWordMin > request.targetWordMax) {
      const msg = '目标字数范围无效：下限不能大于上限。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }

    setters.setLocalError('')
    setters.setLocalSuccess('')
    setters.setCanRetryGenerate(false)
    setters.setGenerating(true)
    try {
      const safeCharacterIDs = request.selectedCharacterIDs.filter((id) => state.validCharacterIDSet.has(id))
      const safeLoreEntryIDs = request.selectedLoreEntryIDs.filter((id) => state.validLoreEntryIDSet.has(id))
      const feedbackHint = buildFeedbackHint(state.generateFeedbackRating, state.generateFeedbackNote)
      const generationInstruction = feedbackHint
        ? `${instructionInput.trim()}\n\n【上一轮反馈（请严格修正）】\n${feedbackHint}`
        : instructionInput.trim()
      const data = await generateChapterStream(
        request.token,
        request.novelId,
        {
          volume_id: request.volumeID,
          chapter_number: request.chapterNumber,
          title: request.chapterTitle.trim(),
          generation_instruction: generationInstruction,
          character_ids: safeCharacterIDs,
          lore_entry_ids: safeLoreEntryIDs,
          target_word_min: request.targetWordMin,
          target_word_max: request.targetWordMax,
          avoid_translation_tone: request.avoidTranslationTone,
          avoid_modern_slang: request.avoidModernSlang,
          keep_pov_consistent: request.keepPovConsistent,
          keep_tense_consistent: request.keepTenseConsistent,
          recent_chapter_count: request.recentChapterCount,
        },
        (event) => {
          if (event.type === 'progress' && Number.isFinite(event.elapsed_seconds)) {
            setters.setGeneratingSeconds((prev) => Math.max(Number(prev) || 0, event.elapsed_seconds))
          }
        },
      )
      if (safeCharacterIDs.length > 0) {
        const merged = Array.from(new Set([...safeCharacterIDs, ...state.recentCharacterIDs])).slice(0, 30)
        setters.setRecentCharacterIDs(merged)
        localStorage.setItem(storageKeys.recentCharacterKey, JSON.stringify(merged))
      }
      const generatedBodyWordCount = data.body.replace(/\s/g, '').length
      if (request.targetWordMin > 0 && generatedBodyWordCount < Math.floor(request.targetWordMin * 0.85)) {
        const msg = `生成结果疑似不完整（正文约 ${generatedBodyWordCount} 字，低于目标下限）。请重试，或适当放宽目标字数。`
        notify.onNotifyError(msg)
        setters.setLocalError(msg)
        setters.setCanRetryGenerate(true)
        return
      }
      setters.setChapterOutline(data.outline)
      setters.setChapterBody(ensureIndentedBody(data.body))
      setters.setChapterSummary(data.summary)
      setters.setSidePanel('outline')
      const totalTokens = data.usage?.total_tokens ?? 0
      const usageText = totalTokens > 0 ? ` 本次消耗约 ${totalTokens} tokens。` : ''
      notify.onNotifySuccess(`AI 生成完成。${usageText}`.trim())
      setters.setLocalSuccess(`AI 生成完成，请检查后再保存。${usageText}`)
      const nextHistory: GenerateHistoryItem[] = [
        {
          createdAt: new Date().toISOString(),
          outline: data.outline,
          body: data.body,
          summary: data.summary,
          model: data.model,
          totalTokens: totalTokens > 0 ? totalTokens : undefined,
          instructionPreview: instructionInput.trim().slice(0, 80),
        },
        ...state.generateHistory,
      ].slice(0, 3)
      setters.setGenerateHistory(nextHistory)
      localStorage.setItem(storageKeys.generateHistoryKey, JSON.stringify(nextHistory))
      setters.setCanRetryGenerate(false)
    } catch (e) {
      const msg = mapGenerateErrorMessage(e)
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      setters.setCanRetryGenerate(true)
    } finally {
      setters.setGenerating(false)
    }
  }

  async function handleGenerate() {
    await runGenerateWithInstruction(request.chapterInstruction)
  }

  async function handleQuickRevise(action: QuickReviseAction) {
    const instruction = buildQuickReviseInstruction(action)
    if (!instruction) {
      const msg = '请先填写或生成正文，再使用快速修订。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }
    await runGenerateWithInstruction(instruction)
  }

  async function handleRewriteSelectedBody(extraPrompt: string, selectionOverride?: SelectionRange) {
    const range = selectionOverride ?? state.bodySelection
    const selected = range.end > range.start ? request.chapterBody.slice(range.start, range.end).trim() : ''
    if (!selected) {
      const msg = '请先在正文里选中要重写的段落。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }
    const actionPrompt = extraPrompt.trim() || '请在不改变剧情事实的前提下优化这段文字，使表达更自然、节奏更顺。'
    const rewriteInstruction = [
      '【局部重写任务】',
      '你只需要重写“待重写段落”，不要扩写整章，不要输出解释。',
      '输出要求：返回 JSON，其中 body 字段仅包含“重写后的该段文本”。',
      actionPrompt,
      '',
      '【待重写段落】',
      selected,
    ].join('\n')

    if (request.chapterNumber <= 0 || request.volumeID <= 0) {
      const msg = '请先确认分卷和章节编号。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      return
    }

    setters.setLocalError('')
    setters.setLocalSuccess('')
    setters.setGenerating(true)
    try {
      const safeCharacterIDs = request.selectedCharacterIDs.filter((id) => state.validCharacterIDSet.has(id))
      const safeLoreEntryIDs = request.selectedLoreEntryIDs.filter((id) => state.validLoreEntryIDSet.has(id))
      const data = await generateChapterStream(
        request.token,
        request.novelId,
        {
          volume_id: request.volumeID,
          chapter_number: request.chapterNumber,
          title: request.chapterTitle.trim(),
          generation_instruction: rewriteInstruction,
          character_ids: safeCharacterIDs,
          lore_entry_ids: safeLoreEntryIDs,
          target_word_min: 0,
          target_word_max: 0,
          avoid_translation_tone: request.avoidTranslationTone,
          avoid_modern_slang: request.avoidModernSlang,
          keep_pov_consistent: request.keepPovConsistent,
          keep_tense_consistent: request.keepTenseConsistent,
          recent_chapter_count: request.recentChapterCount,
        },
        (event) => {
          if (event.type === 'progress' && Number.isFinite(event.elapsed_seconds)) {
            setters.setGeneratingSeconds((prev) => Math.max(Number(prev) || 0, event.elapsed_seconds))
          }
        },
      )
      const rewritten = data.body.trim()
      if (!rewritten) throw new Error('重写结果为空')
      setters.setPendingRewrite({
        start: range.start,
        end: range.end,
        original: request.chapterBody.slice(range.start, range.end),
        rewritten,
      })
      notify.onNotifySuccess('局部重写已生成，请选择应用或放弃。')
      setters.setLocalSuccess('局部重写已生成，请确认是否替换。')
    } catch (e) {
      const msg = mapGenerateErrorMessage(e)
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
    } finally {
      setters.setGenerating(false)
    }
  }

  function applyPendingRewrite() {
    if (!state.pendingRewrite) return
    const currentOriginal = request.chapterBody.slice(state.pendingRewrite.start, state.pendingRewrite.end)
    if (currentOriginal !== state.pendingRewrite.original) {
      const msg = '原文已变化，无法应用本次替换。请重新选中后重写。'
      notify.onNotifyError(msg)
      setters.setLocalError(msg)
      setters.setPendingRewrite(null)
      return
    }
    const nextBody = `${request.chapterBody.slice(0, state.pendingRewrite.start)}${state.pendingRewrite.rewritten}${request.chapterBody.slice(state.pendingRewrite.end)}`
    const normalized = ensureIndentedBody(nextBody)
    const end = Math.min(state.pendingRewrite.start + state.pendingRewrite.rewritten.length, normalized.length)
    setters.setChapterBody(normalized)
    setters.setBodySelection({ start: end, end })
    setters.setPendingRewrite(null)
    notify.onNotifySuccess('已应用局部替换。')
    setters.setLocalSuccess(`已替换第 ${state.pendingRewrite.start + 1}~${state.pendingRewrite.end} 字，请检查后保存。`)
  }

  function discardPendingRewrite() {
    if (!state.pendingRewrite) return
    setters.setPendingRewrite(null)
    notify.onNotifySuccess('已放弃本次局部替换。')
  }

  function saveGenerateFeedback() {
    if (!state.generateFeedbackRating && !state.generateFeedbackNote.trim()) {
      notify.onNotifyError('请至少填写评分或备注后再保存反馈。')
      return
    }
    const payload: GenerateFeedback = {
      rating: state.generateFeedbackRating,
      note: state.generateFeedbackNote.trim(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(storageKeys.generateFeedbackKey, JSON.stringify(payload))
    notify.onNotifySuccess('本章生成反馈已保存。下次生成会自动参考。')
  }

  function applyGenerateHistory(index: number) {
    const item = state.generateHistory[index]
    if (!item) return
    setters.setChapterOutline(item.outline)
    setters.setChapterBody(ensureIndentedBody(item.body))
    setters.setChapterSummary(item.summary)
    setters.setSidePanel('outline')
    notify.onNotifySuccess('已回填历史生成版本。')
  }

  function applyTemplate(templateId: string) {
    const template = GENERATE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    setters.setSelectedTemplateId(template.id)
    localStorage.setItem(storageKeys.templateKey, template.id)
    setters.setTargetWordMin(template.targetWordMin)
    setters.setTargetWordMax(template.targetWordMax)
    setters.setRecentChapterCount(template.recentChapterCount)
    setters.setAvoidTranslationTone(template.avoidTranslationTone)
    setters.setAvoidModernSlang(template.avoidModernSlang)
    setters.setKeepPovConsistent(template.keepPovConsistent)
    setters.setKeepTenseConsistent(template.keepTenseConsistent)
    if (!request.chapterInstruction.trim()) setters.setChapterInstruction(template.instructionSeed)
    notify.onNotifySuccess(`已套用模板：${template.label}`)
  }

  function saveChapterSnapshot() {
    const item: ChapterSnapshotItem = {
      createdAt: new Date().toISOString(),
      chapterTitle: request.chapterTitle.trim(),
      chapterStatus: request.chapterStatus,
      body: request.chapterBody,
      outline: request.chapterOutline,
      summary: request.chapterSummary,
    }
    const next = [item, ...state.chapterSnapshots].slice(0, 10)
    setters.setChapterSnapshots(next)
    localStorage.setItem(storageKeys.chapterSnapshotKey, JSON.stringify(next))
    notify.onNotifySuccess('章节快照已保存。')
  }

  function applyChapterSnapshot(index: number) {
    const item = state.chapterSnapshots[index]
    if (!item) return
    setters.setChapterTitle(item.chapterTitle)
    setters.setChapterStatus(item.chapterStatus)
    setters.setChapterBody(ensureIndentedBody(item.body))
    setters.setChapterOutline(item.outline)
    setters.setChapterSummary(item.summary)
    notify.onNotifySuccess('已回填章节快照。')
    setters.setSidePanel('snapshot')
  }

  return {
    handleGenerate,
    retryGenerate: handleGenerate,
    handleQuickRevise,
    handleRewriteSelectedBody,
    applyPendingRewrite,
    discardPendingRewrite,
    saveGenerateFeedback,
    applyGenerateHistory,
    applyTemplate,
    saveChapterSnapshot,
    applyChapterSnapshot,
  }
}
