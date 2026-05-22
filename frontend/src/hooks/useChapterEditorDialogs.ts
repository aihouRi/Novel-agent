import { useMemo, useState } from 'react'

type Options = {
  generateHistory: Array<any>
}

export function useChapterEditorDialogs({ generateHistory }: Options) {
  const [pendingHistoryIndex, setPendingHistoryIndex] = useState<number | null>(null)
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false)
  const [highCostAcknowledged, setHighCostAcknowledged] = useState(false)
  const [showAISettingsDialog, setShowAISettingsDialog] = useState(false)
  const [showRewriteDialog, setShowRewriteDialog] = useState(false)
  const [rewritePrompt, setRewritePrompt] = useState('')
  const [rewriteSelection, setRewriteSelection] = useState<{ start: number; end: number } | null>(null)

  const pendingHistoryItem = useMemo(
    () => (pendingHistoryIndex === null ? null : generateHistory[pendingHistoryIndex] ?? null),
    [generateHistory, pendingHistoryIndex],
  )

  function openGenerateConfirm() {
    setHighCostAcknowledged(false)
    setConfirmGenerateOpen(true)
  }

  return {
    pendingHistoryIndex,
    setPendingHistoryIndex,
    pendingHistoryItem,
    confirmGenerateOpen,
    setConfirmGenerateOpen,
    openGenerateConfirm,
    highCostAcknowledged,
    setHighCostAcknowledged,
    showAISettingsDialog,
    setShowAISettingsDialog,
    showRewriteDialog,
    setShowRewriteDialog,
    rewritePrompt,
    setRewritePrompt,
    rewriteSelection,
    setRewriteSelection,
  }
}
