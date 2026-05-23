import { useState } from 'react'
import { INDENT } from './constants'
import { ensureIndentedBody } from './text'
import type { Chapter } from '../../api/chapters'
import type { PendingRewrite, SelectionRange, SidePanel } from './types'

type Params = {
  initialChapter: Chapter | null | undefined
  defaultChapterNumber: number
  latestVolumeID: number
  recentChapterCountDefault: number
}

export function useChapterEditorCoreState({
  initialChapter,
  defaultChapterNumber,
  latestVolumeID,
  recentChapterCountDefault,
}: Params) {
  const [chapterNumber, setChapterNumber] = useState(initialChapter?.chapter_number ?? defaultChapterNumber)
  const [volumeID, setVolumeID] = useState<number>(initialChapter?.volume_id ?? latestVolumeID)
  const [chapterTitle, setChapterTitle] = useState(initialChapter?.title ?? '')
  const [chapterBody, setChapterBody] = useState(ensureIndentedBody(initialChapter?.body ?? INDENT))
  const [chapterSummary, setChapterSummary] = useState(initialChapter?.summary ?? '')
  const [chapterOutline, setChapterOutline] = useState(initialChapter?.outline ?? '')
  const [chapterStatus, setChapterStatus] = useState<'draft' | 'review' | 'final'>(initialChapter?.status ?? 'draft')
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
  const [bodySelection, setBodySelection] = useState<SelectionRange>({ start: 0, end: 0 })
  const [bodyFocused, setBodyFocused] = useState(false)
  const [pendingRewrite, setPendingRewrite] = useState<PendingRewrite | null>(null)

  return {
    chapterNumber,
    volumeID,
    chapterTitle,
    chapterBody,
    chapterSummary,
    chapterOutline,
    chapterStatus,
    chapterInstruction,
    recentChapterCount,
    targetWordMin,
    targetWordMax,
    avoidTranslationTone,
    avoidModernSlang,
    keepPovConsistent,
    keepTenseConsistent,
    selectedCharacterIDs,
    selectedLoreEntryIDs,
    saving,
    generating,
    generatingSeconds,
    sidePanel,
    localSuccess,
    localError,
    canRetryGenerate,
    bodySelection,
    bodyFocused,
    pendingRewrite,
    setChapterNumber,
    setVolumeID,
    setChapterTitle,
    setChapterBody,
    setChapterSummary,
    setChapterOutline,
    setChapterStatus,
    setChapterInstruction,
    setRecentChapterCount,
    setTargetWordMin,
    setTargetWordMax,
    setAvoidTranslationTone,
    setAvoidModernSlang,
    setKeepPovConsistent,
    setKeepTenseConsistent,
    setSelectedCharacterIDs,
    setSelectedLoreEntryIDs,
    setSaving,
    setGenerating,
    setGeneratingSeconds,
    setSidePanel,
    setLocalSuccess,
    setLocalError,
    setCanRetryGenerate,
    setBodySelection,
    setBodyFocused,
    setPendingRewrite,
  }
}
