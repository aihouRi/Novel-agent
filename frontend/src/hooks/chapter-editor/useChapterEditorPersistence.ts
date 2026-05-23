import { useEffect } from 'react'
import type { ChapterDraft, ChapterSnapshotItem, GenerateFeedback, GenerateHistoryItem } from './types'
import { ensureIndentedBody } from './text'

type Options = {
  isEdit: boolean
  latestVolumeID: number
  recentChapterCountDefault: number
  draftKey: string
  recentCharacterKey: string
  templateKey: string
  generateHistoryKey: string
  generateFeedbackKey: string
  chapterSnapshotKey: string
  volumeID: number
  setVolumeID: (v: number) => void
  chapterNumber: number
  setChapterNumber: (v: number) => void
  chapterTitle: string
  setChapterTitle: (v: string) => void
  chapterBody: string
  setChapterBody: (v: string) => void
  chapterSummary: string
  setChapterSummary: (v: string) => void
  chapterOutline: string
  setChapterOutline: (v: string) => void
  chapterStatus: 'draft' | 'review' | 'final'
  setChapterStatus: (v: 'draft' | 'review' | 'final') => void
  chapterInstruction: string
  setChapterInstruction: (v: string) => void
  selectedCharacterIDs: number[]
  setSelectedCharacterIDs: (v: number[]) => void
  selectedLoreEntryIDs: number[]
  setSelectedLoreEntryIDs: (v: number[]) => void
  targetWordMin: number
  setTargetWordMin: (v: number) => void
  targetWordMax: number
  setTargetWordMax: (v: number) => void
  avoidTranslationTone: boolean
  setAvoidTranslationTone: (v: boolean) => void
  avoidModernSlang: boolean
  setAvoidModernSlang: (v: boolean) => void
  keepPovConsistent: boolean
  setKeepPovConsistent: (v: boolean) => void
  keepTenseConsistent: boolean
  setKeepTenseConsistent: (v: boolean) => void
  recentChapterCount: number
  setRecentChapterCount: (v: number) => void
  generating: boolean
  setGeneratingSeconds: (v: number | ((prev: number) => number)) => void
  setRecentCharacterIDs: (v: number[]) => void
  setSelectedTemplateId: (v: string) => void
  setGenerateHistory: (v: GenerateHistoryItem[]) => void
  setGenerateFeedbackRating: (v: '' | 'satisfied' | 'neutral' | 'unsatisfied') => void
  setGenerateFeedbackNote: (v: string) => void
  setChapterSnapshots: (v: ChapterSnapshotItem[]) => void
  validCharacterIDSet: Set<number>
  validLoreEntryIDSet: Set<number>
  templateIds: string[]
}

export function useChapterEditorPersistence(opts: Options) {
  useEffect(() => {
    const raw = localStorage.getItem(opts.recentCharacterKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as number[]
      if (Array.isArray(parsed)) opts.setRecentCharacterIDs(parsed.filter((id) => Number.isFinite(id)))
    } catch {
      localStorage.removeItem(opts.recentCharacterKey)
    }
  }, [opts.recentCharacterKey])

  useEffect(() => {
    const saved = localStorage.getItem(opts.templateKey)
    if (!saved) return
    if (opts.templateIds.includes(saved)) opts.setSelectedTemplateId(saved)
  }, [opts.templateKey, opts.templateIds])

  useEffect(() => {
    const raw = localStorage.getItem(opts.generateHistoryKey)
    if (!raw) {
      opts.setGenerateHistory([])
      return
    }
    try {
      const parsed = JSON.parse(raw) as GenerateHistoryItem[]
      if (Array.isArray(parsed)) opts.setGenerateHistory(parsed.slice(0, 3))
      else opts.setGenerateHistory([])
    } catch {
      localStorage.removeItem(opts.generateHistoryKey)
      opts.setGenerateHistory([])
    }
  }, [opts.generateHistoryKey])

  useEffect(() => {
    const raw = localStorage.getItem(opts.generateFeedbackKey)
    if (!raw) {
      opts.setGenerateFeedbackRating('')
      opts.setGenerateFeedbackNote('')
      return
    }
    try {
      const parsed = JSON.parse(raw) as GenerateFeedback
      opts.setGenerateFeedbackRating(parsed.rating || '')
      opts.setGenerateFeedbackNote(parsed.note || '')
    } catch {
      localStorage.removeItem(opts.generateFeedbackKey)
      opts.setGenerateFeedbackRating('')
      opts.setGenerateFeedbackNote('')
    }
  }, [opts.generateFeedbackKey])

  useEffect(() => {
    const raw = localStorage.getItem(opts.chapterSnapshotKey)
    if (!raw) {
      opts.setChapterSnapshots([])
      return
    }
    try {
      const parsed = JSON.parse(raw) as ChapterSnapshotItem[]
      if (Array.isArray(parsed)) opts.setChapterSnapshots(parsed.slice(0, 10))
      else opts.setChapterSnapshots([])
    } catch {
      localStorage.removeItem(opts.chapterSnapshotKey)
      opts.setChapterSnapshots([])
    }
  }, [opts.chapterSnapshotKey])

  useEffect(() => {
    const saved = localStorage.getItem(opts.draftKey)
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as ChapterDraft
      if (opts.isEdit) opts.setVolumeID(draft.volumeID ?? opts.volumeID)
      else opts.setVolumeID(opts.latestVolumeID)
      opts.setChapterNumber(draft.chapterNumber ?? opts.chapterNumber)
      opts.setChapterTitle(draft.chapterTitle ?? '')
      opts.setChapterBody(ensureIndentedBody(draft.chapterBody ?? ''))
      opts.setChapterSummary(draft.chapterSummary ?? '')
      opts.setChapterOutline(draft.chapterOutline ?? '')
      opts.setChapterStatus(draft.chapterStatus ?? 'draft')
      opts.setChapterInstruction(draft.chapterInstruction ?? '')
      opts.setSelectedCharacterIDs(
        Array.isArray(draft.selectedCharacterIDs) ? draft.selectedCharacterIDs.filter((id) => opts.validCharacterIDSet.has(id)) : [],
      )
      opts.setSelectedLoreEntryIDs(
        Array.isArray(draft.selectedLoreEntryIDs) ? draft.selectedLoreEntryIDs.filter((id) => opts.validLoreEntryIDSet.has(id)) : [],
      )
      opts.setTargetWordMin(Number.isFinite(draft.targetWordMin) ? Math.max(0, Number(draft.targetWordMin)) : 1800)
      opts.setTargetWordMax(Number.isFinite(draft.targetWordMax) ? Math.max(0, Number(draft.targetWordMax)) : 2600)
      opts.setAvoidTranslationTone(draft.avoidTranslationTone ?? true)
      opts.setAvoidModernSlang(draft.avoidModernSlang ?? true)
      opts.setKeepPovConsistent(draft.keepPovConsistent ?? true)
      opts.setKeepTenseConsistent(draft.keepTenseConsistent ?? true)
      opts.setRecentChapterCount(
        Number.isFinite(draft.recentChapterCount)
          ? Math.max(1, Number(draft.recentChapterCount))
          : Math.max(1, opts.recentChapterCountDefault || 3),
      )
    } catch {
      localStorage.removeItem(opts.draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.draftKey, opts.isEdit, opts.latestVolumeID, opts.recentChapterCountDefault, opts.validCharacterIDSet, opts.validLoreEntryIDSet])

  useEffect(() => {
    if (!opts.generating) {
      opts.setGeneratingSeconds(0)
      return
    }
    const startedAt = Date.now()
    opts.setGeneratingSeconds(0)
    const id = window.setInterval(() => {
      opts.setGeneratingSeconds((prev) => Math.max(Number(prev) || 0, Math.floor((Date.now() - startedAt) / 1000)))
    }, 1000)
    return () => window.clearInterval(id)
  }, [opts.generating])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const draft: ChapterDraft = {
        volumeID: opts.volumeID,
        chapterNumber: opts.chapterNumber,
        chapterTitle: opts.chapterTitle,
        chapterBody: opts.chapterBody,
        chapterSummary: opts.chapterSummary,
        chapterOutline: opts.chapterOutline,
        chapterStatus: opts.chapterStatus,
        chapterInstruction: opts.chapterInstruction,
        selectedCharacterIDs: opts.selectedCharacterIDs,
        selectedLoreEntryIDs: opts.selectedLoreEntryIDs,
        targetWordMin: opts.targetWordMin,
        targetWordMax: opts.targetWordMax,
        avoidTranslationTone: opts.avoidTranslationTone,
        avoidModernSlang: opts.avoidModernSlang,
        keepPovConsistent: opts.keepPovConsistent,
        keepTenseConsistent: opts.keepTenseConsistent,
        recentChapterCount: opts.recentChapterCount,
      }
      localStorage.setItem(opts.draftKey, JSON.stringify(draft))
    }, 500)
    return () => window.clearTimeout(id)
  }, [
    opts.draftKey,
    opts.volumeID,
    opts.chapterNumber,
    opts.chapterTitle,
    opts.chapterBody,
    opts.chapterSummary,
    opts.chapterOutline,
    opts.chapterStatus,
    opts.chapterInstruction,
    opts.selectedCharacterIDs,
    opts.selectedLoreEntryIDs,
    opts.targetWordMin,
    opts.targetWordMax,
    opts.avoidTranslationTone,
    opts.avoidModernSlang,
    opts.keepPovConsistent,
    opts.keepTenseConsistent,
    opts.recentChapterCount,
  ])
}
