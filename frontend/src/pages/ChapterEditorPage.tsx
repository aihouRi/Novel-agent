import { Alert, Box, CircularProgress, Container } from '@mui/material'
import { useEffect, useRef } from 'react'
import type { Chapter } from '../api/chapters'
import type { Character } from '../api/characters'
import type { LoreEntry } from '../api/loreEntries'
import type { Volume } from '../api/volumes'
import AISettingsDialog from '../components/chapter-editor/AISettingsDialog'
import ChapterEditorFloatingActions from '../components/chapter-editor/ChapterEditorFloatingActions'
import ChapterEditorHeader from '../components/chapter-editor/ChapterEditorHeader'
import ChapterEditorWorkspace from '../components/chapter-editor/ChapterEditorWorkspace'
import EditorSnackbars from '../components/chapter-editor/EditorSnackbars'
import GenerateConfirmDialog from '../components/chapter-editor/GenerateConfirmDialog'
import HistoryFillDialog from '../components/chapter-editor/HistoryFillDialog'
import RewriteInputDialog from '../components/chapter-editor/RewriteInputDialog'
import RewritePreviewDialog from '../components/chapter-editor/RewritePreviewDialog'
import { useChapterAISettings } from '../hooks/useChapterAISettings'
import { useChapterEditorDialogs } from '../hooks/useChapterEditorDialogs'
import { useChapterEditor } from '../hooks/useChapterEditor'
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
  const dialogs = useChapterEditorDialogs({ generateHistory: editor.generateHistory })
  const chapterBodyInputRef = useRef<HTMLTextAreaElement | null>(null)
  const aiSettings = useChapterAISettings({
    token,
    onNotifySuccess,
    onNotifyError,
    setLocalError: editor.setLocalError,
  })

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

  async function confirmGenerate() {
    dialogs.setConfirmGenerateOpen(false)
    await editor.handleGenerate()
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
        <ChapterEditorHeader
          novelTitle={novelTitle}
          chapterWordCount={editor.chapterWordCount}
          onBack={onBack}
          onOpenAISettings={() => {
            dialogs.setShowAISettingsDialog(true)
            void aiSettings.loadAISettings()
          }}
          onRewrite={() => {
            dialogs.setRewriteSelection({ start: editor.bodySelection.start, end: editor.bodySelection.end })
            dialogs.setShowRewriteDialog(true)
          }}
          rewriteDisabled={editor.generating || !canRewrite}
          onGenerate={dialogs.openGenerateConfirm}
          onSave={() => void editor.handleSave()}
          generating={editor.generating}
          saving={editor.saving}
          chapterNumber={editor.chapterNumber}
          volumeID={editor.volumeID}
          isEdit={editor.isEdit}
        />

        {editor.generating && (
          <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 1.5, borderRadius: 2 }}>
            正在生成章节内容，请稍候... 已思考 {editor.generatingSeconds} 秒
          </Alert>
        )}

        <ChapterEditorWorkspace
          editor={editor}
          volumes={volumes}
          loreEntries={loreEntries}
          chapterBodyInputRef={chapterBodyInputRef}
          loreCategoryLabelMap={loreCategoryLabelMap}
          onOpenHistoryFill={dialogs.setPendingHistoryIndex}
        />

        <ChapterEditorFloatingActions
          onBack={onBack}
          onRewrite={() => {
            dialogs.setRewriteSelection({ start: editor.bodySelection.start, end: editor.bodySelection.end })
            dialogs.setShowRewriteDialog(true)
          }}
          rewriteDisabled={editor.generating || !canRewrite}
          onGenerate={dialogs.openGenerateConfirm}
          onSave={() => void editor.handleSave()}
          generating={editor.generating}
          saving={editor.saving}
          chapterNumber={editor.chapterNumber}
          volumeID={editor.volumeID}
          isEdit={editor.isEdit}
        />

        <EditorSnackbars
          localSuccess={editor.localSuccess}
          localError={editor.localError}
          canRetryGenerate={editor.canRetryGenerate}
          generating={editor.generating}
          chapterInstruction={editor.chapterInstruction}
          volumeID={editor.volumeID}
          chapterNumber={editor.chapterNumber}
          onCloseSuccess={() => editor.setLocalSuccess('')}
          onCloseError={() => editor.setLocalError('')}
          onRetryGenerate={() => void editor.retryGenerate()}
        />

        <AISettingsDialog
          open={dialogs.showAISettingsDialog}
          loading={aiSettings.aiSettingLoading}
          provider={aiSettings.aiProvider}
          openaiAPIKeyInput={aiSettings.openaiAPIKeyInput}
          openaiHasAPIKey={aiSettings.openaiHasAPIKey}
          openaiAPIKeyMasked={aiSettings.openaiAPIKeyMasked}
          openaiBaseURL={aiSettings.openaiBaseURL}
          openaiModel={aiSettings.openaiModel}
          geminiAPIKeyInput={aiSettings.geminiAPIKeyInput}
          geminiHasAPIKey={aiSettings.geminiHasAPIKey}
          geminiAPIKeyMasked={aiSettings.geminiAPIKeyMasked}
          geminiBaseURL={aiSettings.geminiBaseURL}
          geminiModel={aiSettings.geminiModel}
          openAIModelOptions={AI_MODEL_OPTIONS}
          geminiModelOptions={GEMINI_MODEL_OPTIONS}
          onClose={() => dialogs.setShowAISettingsDialog(false)}
          onSave={() => void aiSettings.saveAISettings().then((ok) => ok && dialogs.setShowAISettingsDialog(false))}
          onResetDefault={aiSettings.resetAISettingsDefaults}
          onProviderChange={aiSettings.setAIProvider}
          onOpenAIAPIKeyInput={aiSettings.setOpenAIAPIKeyInput}
          onOpenAIBaseURL={aiSettings.setOpenAIBaseURL}
          onOpenAIModel={aiSettings.setOpenAIModel}
          onGeminiAPIKeyInput={aiSettings.setGeminiAPIKeyInput}
          onGeminiBaseURL={aiSettings.setGeminiBaseURL}
          onGeminiModel={aiSettings.setGeminiModel}
        />

        <GenerateConfirmDialog
          open={dialogs.confirmGenerateOpen}
          highCostAcknowledged={dialogs.highCostAcknowledged}
          provider={aiSettings.aiProvider}
          model={aiSettings.aiProvider === 'openai' ? aiSettings.openaiModel : aiSettings.geminiModel}
          volumes={volumes.map((v) => ({ id: v.id, title: v.title }))}
          volumeID={editor.volumeID}
          chapterNumber={editor.chapterNumber}
          chapterTitle={editor.chapterTitle}
          targetWordMin={editor.targetWordMin}
          targetWordMax={editor.targetWordMax}
          chapterInstruction={editor.chapterInstruction}
          recentChapterCount={editor.recentChapterCount}
          selectedCharacterCount={editor.selectedCharacterIDs.length}
          selectedLoreEntryCount={editor.selectedLoreEntryIDs.length}
          generating={editor.generating}
          saving={editor.saving}
          onClose={() => dialogs.setConfirmGenerateOpen(false)}
          onConfirm={() => void confirmGenerate()}
          onHighCostAcknowledged={dialogs.setHighCostAcknowledged}
        />

        <HistoryFillDialog
          open={dialogs.pendingHistoryIndex !== null}
          currentBody={editor.chapterBody}
          currentOutline={editor.chapterOutline}
          currentSummary={editor.chapterSummary}
          pendingHistoryItem={dialogs.pendingHistoryItem}
          onClose={() => dialogs.setPendingHistoryIndex(null)}
          onConfirm={() => {
            if (dialogs.pendingHistoryIndex !== null) editor.applyGenerateHistory(dialogs.pendingHistoryIndex)
            dialogs.setPendingHistoryIndex(null)
          }}
        />

        <RewriteInputDialog
          open={dialogs.showRewriteDialog}
          generating={editor.generating}
          rewritePrompt={dialogs.rewritePrompt}
          rewriteSelection={dialogs.rewriteSelection}
          onClose={() => dialogs.setShowRewriteDialog(false)}
          onRewritePromptChange={dialogs.setRewritePrompt}
          onConfirm={() => {
            const prompt = dialogs.rewritePrompt
            dialogs.setShowRewriteDialog(false)
            dialogs.setRewritePrompt('')
            const selectedRange = dialogs.rewriteSelection
            dialogs.setRewriteSelection(null)
            void editor.handleRewriteSelectedBody(prompt, selectedRange ?? undefined)
          }}
        />

        <RewritePreviewDialog
          pendingRewrite={editor.pendingRewrite}
          onClose={editor.discardPendingRewrite}
          onDiscard={editor.discardPendingRewrite}
          onApply={editor.applyPendingRewrite}
        />
      </Container>
    </Box>
  )
}
