import type { Chapter } from '../../api/chapters'
import type { Character } from '../../api/characters'
import type { LoreEntry } from '../../api/loreEntries'
import type { Volume } from '../../api/volumes'

export type SidePanel = 'summary' | 'outline' | 'instruction' | 'history' | 'snapshot' | null

export type GenerateHistoryItem = {
  createdAt: string
  outline: string
  body: string
  summary: string
  model?: string
  totalTokens?: number
  instructionPreview: string
}

export type GenerateTemplate = {
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

export type GenerateFeedbackRating = 'satisfied' | 'neutral' | 'unsatisfied' | ''

export type GenerateFeedback = {
  rating: GenerateFeedbackRating
  note: string
  updatedAt: string
}

export type QuickReviseAction = 'polish' | 'compress' | 'reflow'
export type SelectionRange = { start: number; end: number }

export type PendingRewrite = {
  start: number
  end: number
  original: string
  rewritten: string
}

export type ChapterSnapshotItem = {
  createdAt: string
  chapterTitle: string
  chapterStatus: 'draft' | 'review' | 'final'
  body: string
  outline: string
  summary: string
}

export type Params = {
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

export type CharacterOption = Character & { group: string }

export type ChapterDraft = {
  volumeID: number
  chapterNumber: number
  chapterTitle: string
  chapterBody: string
  chapterSummary: string
  chapterOutline: string
  chapterStatus?: 'draft' | 'review' | 'final'
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
