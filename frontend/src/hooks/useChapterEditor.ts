import { useEffect, useMemo } from 'react'
import { createChapter, type Chapter, updateChapter } from '../api/chapters'
import type { Character } from '../api/characters'
import type { LoreEntry } from '../api/loreEntries'
import type { Volume } from '../api/volumes'
import { GENERATE_TEMPLATES, INDENT, TEMPLATE_KEY_PREFIX } from './chapter-editor/constants'
import { ensureIndentedBody } from './chapter-editor/text'
import type { CharacterOption, Params } from './chapter-editor/types'
import { useChapterEditorCoreState } from './chapter-editor/useChapterEditorCoreState'
import { useChapterEditorAiState } from './chapter-editor/useChapterEditorAiState'
import { useBodyEditing } from './chapter-editor/useBodyEditing'
import { useChapterEditorPersistence } from './chapter-editor/useChapterEditorPersistence'
import { useChapterGeneration } from './chapter-editor/useChapterGeneration'

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

  const coreState = useChapterEditorCoreState({
    initialChapter,
    defaultChapterNumber,
    latestVolumeID,
    recentChapterCountDefault,
  })
  const aiState = useChapterEditorAiState()

  const {
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
  } = coreState

  const {
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
  } = aiState

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
  const chapterSnapshotKey = useMemo(() => {
    const chapterKey = initialChapter?.id ?? `new_${chapterNumber}`
    return `novel_agent_chapter_snapshots_${novelId}_${chapterKey}`
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

  useChapterEditorPersistence({
    isEdit,
    latestVolumeID,
    recentChapterCountDefault,
    draftKey,
    recentCharacterKey,
    templateKey,
    generateHistoryKey,
    generateFeedbackKey,
    chapterSnapshotKey,
    volumeID,
    setVolumeID,
    chapterNumber,
    setChapterNumber,
    chapterTitle,
    setChapterTitle,
    chapterBody,
    setChapterBody,
    chapterSummary,
    setChapterSummary,
    chapterOutline,
    setChapterOutline,
    chapterStatus,
    setChapterStatus,
    chapterInstruction,
    setChapterInstruction,
    selectedCharacterIDs,
    setSelectedCharacterIDs,
    selectedLoreEntryIDs,
    setSelectedLoreEntryIDs,
    targetWordMin,
    setTargetWordMin,
    targetWordMax,
    setTargetWordMax,
    avoidTranslationTone,
    setAvoidTranslationTone,
    avoidModernSlang,
    setAvoidModernSlang,
    keepPovConsistent,
    setKeepPovConsistent,
    keepTenseConsistent,
    setKeepTenseConsistent,
    recentChapterCount,
    setRecentChapterCount,
    generating,
    setGeneratingSeconds,
    setRecentCharacterIDs,
    setSelectedTemplateId,
    setGenerateHistory,
    setGenerateFeedbackRating,
    setGenerateFeedbackNote,
    setChapterSnapshots,
    validCharacterIDSet,
    validLoreEntryIDSet,
    templateIds: GENERATE_TEMPLATES.map((t) => t.id),
  })

  const {
    handleBodyKeyDown,
    handleBodyPaste,
    handleBodyCopy,
    handleBodyCut,
    handleBodySelect,
    getSelectedBodyText,
    handleBodyFocus,
    handleBodyBlur,
  } = useBodyEditing({
    chapterBody,
    setChapterBody,
    bodySelection,
    setBodySelection,
    setBodyFocused,
  })

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
        status: chapterStatus,
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

  const {
    handleGenerate,
    retryGenerate,
    handleQuickRevise,
    handleRewriteSelectedBody,
    applyPendingRewrite,
    discardPendingRewrite,
    saveGenerateFeedback,
    applyGenerateHistory,
    applyTemplate,
    saveChapterSnapshot,
    applyChapterSnapshot,
  } = useChapterGeneration({
    request: {
      token,
      novelId,
      chapterNumber,
      volumeID,
      chapterTitle,
      chapterBody,
      chapterInstruction,
      chapterOutline,
      chapterSummary,
      chapterStatus,
      targetWordMin,
      targetWordMax,
      avoidTranslationTone,
      avoidModernSlang,
      keepPovConsistent,
      keepTenseConsistent,
      recentChapterCount,
      selectedCharacterIDs,
      selectedLoreEntryIDs,
    },
    state: {
      validCharacterIDSet,
      validLoreEntryIDSet,
      recentCharacterIDs,
      generateHistory,
      generateFeedbackRating,
      generateFeedbackNote,
      bodySelection,
      pendingRewrite,
      chapterSnapshots,
    },
    storageKeys: {
      recentCharacterKey,
      generateHistoryKey,
      generateFeedbackKey,
      templateKey,
      chapterSnapshotKey,
    },
    notify: {
      onNotifySuccess,
      onNotifyError,
    },
    setters: {
      setLocalError,
      setLocalSuccess,
      setCanRetryGenerate,
      setGenerating,
      setGeneratingSeconds,
      setRecentCharacterIDs,
      setGenerateHistory,
      setChapterOutline,
      setChapterBody,
      setChapterSummary,
      setSidePanel,
      setPendingRewrite,
      setBodySelection,
      setSelectedTemplateId,
      setTargetWordMin,
      setTargetWordMax,
      setRecentChapterCount,
      setAvoidTranslationTone,
      setAvoidModernSlang,
      setKeepPovConsistent,
      setKeepTenseConsistent,
      setChapterInstruction,
      setChapterTitle,
      setChapterStatus,
      setChapterSnapshots,
    },
  })

  return {
    chapterNumber,
    volumeID,
    chapterTitle,
    chapterBody,
    chapterSummary,
    chapterOutline,
    chapterStatus,
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
    chapterSnapshots,
    generateTemplates: GENERATE_TEMPLATES,
    selectedTemplateId,
    generateFeedbackRating,
    generateFeedbackNote,
    chapterWordCount,
    isEdit,
    groupedCharacterOptions,
    selectedCharacters,
    selectedLoreEntries,
    bodyFocused,
    bodySelection,
    selectedBodyText: getSelectedBodyText(),
    pendingRewrite,
    setChapterNumber,
    setVolumeID,
    setChapterTitle,
    setChapterBody,
    setChapterSummary,
    setChapterOutline,
    setChapterStatus,
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
    handleBodyFocus,
    handleBodyBlur,
    handleBodySelect,
    handleSave,
    handleGenerate,
    retryGenerate: handleGenerate,
    handleQuickRevise,
    handleRewriteSelectedBody,
    applyPendingRewrite,
    discardPendingRewrite,
    applyGenerateHistory,
    saveChapterSnapshot,
    applyChapterSnapshot,
    applyTemplate,
    saveGenerateFeedback,
    ensureIndentedBody,
  }
}
