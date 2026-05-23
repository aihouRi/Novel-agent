import { useState } from 'react'
import type { ChapterSnapshotItem, GenerateFeedbackRating, GenerateHistoryItem } from './types'

export function useChapterEditorAiState() {
  const [recentCharacterIDs, setRecentCharacterIDs] = useState<number[]>([])
  const [generateHistory, setGenerateHistory] = useState<GenerateHistoryItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [generateFeedbackRating, setGenerateFeedbackRating] = useState<GenerateFeedbackRating>('')
  const [generateFeedbackNote, setGenerateFeedbackNote] = useState('')
  const [chapterSnapshots, setChapterSnapshots] = useState<ChapterSnapshotItem[]>([])

  return {
    recentCharacterIDs,
    generateHistory,
    selectedTemplateId,
    generateFeedbackRating,
    generateFeedbackNote,
    chapterSnapshots,
    setRecentCharacterIDs,
    setGenerateHistory,
    setSelectedTemplateId,
    setGenerateFeedbackRating,
    setGenerateFeedbackNote,
    setChapterSnapshots,
  }
}
