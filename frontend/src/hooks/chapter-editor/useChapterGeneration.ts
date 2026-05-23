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
  validCharacterIDSet: Set<number>
  validLoreEntryIDSet: Set<number>
  recentCharacterIDs: number[]
  generateHistory: GenerateHistoryItem[]
  generateFeedbackRating: GenerateFeedbackRating
  generateFeedbackNote: string
  bodySelection: SelectionRange
  pendingRewrite: PendingRewrite | null
  chapterSnapshots: ChapterSnapshotItem[]
  recentCharacterKey: string
  generateHistoryKey: string
  generateFeedbackKey: string
  templateKey: string
  chapterSnapshotKey: string
  onNotifySuccess: (msg: string) => void
  onNotifyError: (msg: string) => void
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

export function useChapterGeneration(options: Options) {
  function buildQuickReviseInstruction(action: QuickReviseAction): string {
    const body = options.chapterBody.trim()
    if (!body) return ''
    const base = options.chapterInstruction.trim()
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
    if (options.chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }
    if (options.volumeID <= 0) {
      const msg = '请先选择分卷。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }
    if (!instructionInput.trim()) {
      const msg = '请先填写生成指令。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }
    if (options.targetWordMin > 0 && options.targetWordMax > 0 && options.targetWordMin > options.targetWordMax) {
      const msg = '目标字数范围无效：下限不能大于上限。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }

    options.setLocalError('')
    options.setLocalSuccess('')
    options.setCanRetryGenerate(false)
    options.setGenerating(true)
    try {
      const safeCharacterIDs = options.selectedCharacterIDs.filter((id) => options.validCharacterIDSet.has(id))
      const safeLoreEntryIDs = options.selectedLoreEntryIDs.filter((id) => options.validLoreEntryIDSet.has(id))
      const feedbackHint = buildFeedbackHint(options.generateFeedbackRating, options.generateFeedbackNote)
      const generationInstruction = feedbackHint
        ? `${instructionInput.trim()}\n\n【上一轮反馈（请严格修正）】\n${feedbackHint}`
        : instructionInput.trim()
      const data = await generateChapterStream(
        options.token,
        options.novelId,
        {
          volume_id: options.volumeID,
          chapter_number: options.chapterNumber,
          title: options.chapterTitle.trim(),
          generation_instruction: generationInstruction,
          character_ids: safeCharacterIDs,
          lore_entry_ids: safeLoreEntryIDs,
          target_word_min: options.targetWordMin,
          target_word_max: options.targetWordMax,
          avoid_translation_tone: options.avoidTranslationTone,
          avoid_modern_slang: options.avoidModernSlang,
          keep_pov_consistent: options.keepPovConsistent,
          keep_tense_consistent: options.keepTenseConsistent,
          recent_chapter_count: options.recentChapterCount,
        },
        (event) => {
          if (event.type === 'progress' && Number.isFinite(event.elapsed_seconds)) {
            options.setGeneratingSeconds((prev) => Math.max(Number(prev) || 0, event.elapsed_seconds))
          }
        },
      )
      if (safeCharacterIDs.length > 0) {
        const merged = Array.from(new Set([...safeCharacterIDs, ...options.recentCharacterIDs])).slice(0, 30)
        options.setRecentCharacterIDs(merged)
        localStorage.setItem(options.recentCharacterKey, JSON.stringify(merged))
      }
      const generatedBodyWordCount = data.body.replace(/\s/g, '').length
      if (options.targetWordMin > 0 && generatedBodyWordCount < Math.floor(options.targetWordMin * 0.85)) {
        const msg = `生成结果疑似不完整（正文约 ${generatedBodyWordCount} 字，低于目标下限）。请重试，或适当放宽目标字数。`
        options.onNotifyError(msg)
        options.setLocalError(msg)
        options.setCanRetryGenerate(true)
        return
      }
      options.setChapterOutline(data.outline)
      options.setChapterBody(ensureIndentedBody(data.body))
      options.setChapterSummary(data.summary)
      options.setSidePanel('outline')
      const totalTokens = data.usage?.total_tokens ?? 0
      const usageText = totalTokens > 0 ? ` 本次消耗约 ${totalTokens} tokens。` : ''
      options.onNotifySuccess(`AI 生成完成。${usageText}`.trim())
      options.setLocalSuccess(`AI 生成完成，请检查后再保存。${usageText}`)
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
        ...options.generateHistory,
      ].slice(0, 3)
      options.setGenerateHistory(nextHistory)
      localStorage.setItem(options.generateHistoryKey, JSON.stringify(nextHistory))
      options.setCanRetryGenerate(false)
    } catch (e) {
      const msg = mapGenerateErrorMessage(e)
      options.onNotifyError(msg)
      options.setLocalError(msg)
      options.setCanRetryGenerate(true)
    } finally {
      options.setGenerating(false)
    }
  }

  async function handleGenerate() {
    await runGenerateWithInstruction(options.chapterInstruction)
  }

  async function handleQuickRevise(action: QuickReviseAction) {
    const instruction = buildQuickReviseInstruction(action)
    if (!instruction) {
      const msg = '请先填写或生成正文，再使用快速修订。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }
    await runGenerateWithInstruction(instruction)
  }

  async function handleRewriteSelectedBody(extraPrompt: string, selectionOverride?: SelectionRange) {
    const range = selectionOverride ?? options.bodySelection
    const selected = range.end > range.start ? options.chapterBody.slice(range.start, range.end).trim() : ''
    if (!selected) {
      const msg = '请先在正文里选中要重写的段落。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
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

    if (options.chapterNumber <= 0 || options.volumeID <= 0) {
      const msg = '请先确认分卷和章节编号。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      return
    }

    options.setLocalError('')
    options.setLocalSuccess('')
    options.setGenerating(true)
    try {
      const safeCharacterIDs = options.selectedCharacterIDs.filter((id) => options.validCharacterIDSet.has(id))
      const safeLoreEntryIDs = options.selectedLoreEntryIDs.filter((id) => options.validLoreEntryIDSet.has(id))
      const data = await generateChapterStream(
        options.token,
        options.novelId,
        {
          volume_id: options.volumeID,
          chapter_number: options.chapterNumber,
          title: options.chapterTitle.trim(),
          generation_instruction: rewriteInstruction,
          character_ids: safeCharacterIDs,
          lore_entry_ids: safeLoreEntryIDs,
          target_word_min: 0,
          target_word_max: 0,
          avoid_translation_tone: options.avoidTranslationTone,
          avoid_modern_slang: options.avoidModernSlang,
          keep_pov_consistent: options.keepPovConsistent,
          keep_tense_consistent: options.keepTenseConsistent,
          recent_chapter_count: options.recentChapterCount,
        },
        (event) => {
          if (event.type === 'progress' && Number.isFinite(event.elapsed_seconds)) {
            options.setGeneratingSeconds((prev) => Math.max(Number(prev) || 0, event.elapsed_seconds))
          }
        },
      )
      const rewritten = data.body.trim()
      if (!rewritten) throw new Error('重写结果为空')
      options.setPendingRewrite({
        start: range.start,
        end: range.end,
        original: options.chapterBody.slice(range.start, range.end),
        rewritten,
      })
      options.onNotifySuccess('局部重写已生成，请选择应用或放弃。')
      options.setLocalSuccess('局部重写已生成，请确认是否替换。')
    } catch (e) {
      const msg = mapGenerateErrorMessage(e)
      options.onNotifyError(msg)
      options.setLocalError(msg)
    } finally {
      options.setGenerating(false)
    }
  }

  function applyPendingRewrite() {
    if (!options.pendingRewrite) return
    const currentOriginal = options.chapterBody.slice(options.pendingRewrite.start, options.pendingRewrite.end)
    if (currentOriginal !== options.pendingRewrite.original) {
      const msg = '原文已变化，无法应用本次替换。请重新选中后重写。'
      options.onNotifyError(msg)
      options.setLocalError(msg)
      options.setPendingRewrite(null)
      return
    }
    const nextBody = `${options.chapterBody.slice(0, options.pendingRewrite.start)}${options.pendingRewrite.rewritten}${options.chapterBody.slice(options.pendingRewrite.end)}`
    const normalized = ensureIndentedBody(nextBody)
    const end = Math.min(options.pendingRewrite.start + options.pendingRewrite.rewritten.length, normalized.length)
    options.setChapterBody(normalized)
    options.setBodySelection({ start: end, end })
    options.setPendingRewrite(null)
    options.onNotifySuccess('已应用局部替换。')
    options.setLocalSuccess(`已替换第 ${options.pendingRewrite.start + 1}~${options.pendingRewrite.end} 字，请检查后保存。`)
  }

  function discardPendingRewrite() {
    if (!options.pendingRewrite) return
    options.setPendingRewrite(null)
    options.onNotifySuccess('已放弃本次局部替换。')
  }

  function saveGenerateFeedback() {
    if (!options.generateFeedbackRating && !options.generateFeedbackNote.trim()) {
      options.onNotifyError('请至少填写评分或备注后再保存反馈。')
      return
    }
    const payload: GenerateFeedback = {
      rating: options.generateFeedbackRating,
      note: options.generateFeedbackNote.trim(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(options.generateFeedbackKey, JSON.stringify(payload))
    options.onNotifySuccess('本章生成反馈已保存。下次生成会自动参考。')
  }

  function applyGenerateHistory(index: number) {
    const item = options.generateHistory[index]
    if (!item) return
    options.setChapterOutline(item.outline)
    options.setChapterBody(ensureIndentedBody(item.body))
    options.setChapterSummary(item.summary)
    options.setSidePanel('outline')
    options.onNotifySuccess('已回填历史生成版本。')
  }

  function applyTemplate(templateId: string) {
    const template = GENERATE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    options.setSelectedTemplateId(template.id)
    localStorage.setItem(options.templateKey, template.id)
    options.setTargetWordMin(template.targetWordMin)
    options.setTargetWordMax(template.targetWordMax)
    options.setRecentChapterCount(template.recentChapterCount)
    options.setAvoidTranslationTone(template.avoidTranslationTone)
    options.setAvoidModernSlang(template.avoidModernSlang)
    options.setKeepPovConsistent(template.keepPovConsistent)
    options.setKeepTenseConsistent(template.keepTenseConsistent)
    if (!options.chapterInstruction.trim()) options.setChapterInstruction(template.instructionSeed)
    options.onNotifySuccess(`已套用模板：${template.label}`)
  }

  function saveChapterSnapshot() {
    const item: ChapterSnapshotItem = {
      createdAt: new Date().toISOString(),
      chapterTitle: options.chapterTitle.trim(),
      chapterStatus: options.chapterStatus,
      body: options.chapterBody,
      outline: options.chapterOutline,
      summary: options.chapterSummary,
    }
    const next = [item, ...options.chapterSnapshots].slice(0, 10)
    options.setChapterSnapshots(next)
    localStorage.setItem(options.chapterSnapshotKey, JSON.stringify(next))
    options.onNotifySuccess('章节快照已保存。')
  }

  function applyChapterSnapshot(index: number) {
    const item = options.chapterSnapshots[index]
    if (!item) return
    options.setChapterTitle(item.chapterTitle)
    options.setChapterStatus(item.chapterStatus)
    options.setChapterBody(ensureIndentedBody(item.body))
    options.setChapterOutline(item.outline)
    options.setChapterSummary(item.summary)
    options.onNotifySuccess('已回填章节快照。')
    options.setSidePanel('snapshot')
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
