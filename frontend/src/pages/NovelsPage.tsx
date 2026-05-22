import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material'
import type { AuthUser } from '../api/auth'
import ChapterEditorPage from './ChapterEditorPage'
import NovelForm from '../components/novels/NovelForm'
import ExportDialog from '../components/novels/ExportDialog'
import NovelSidebar from '../components/novels/NovelSidebar'
import NovelTopCard from '../components/novels/NovelTopCard'
import NovelDetailSection from '../components/novels/NovelDetailSection'
import NovelCharactersSection from '../components/novels/NovelCharactersSection'
import NovelChaptersSection from '../components/novels/NovelChaptersSection'
import NovelLoreEntriesSection from '../components/novels/NovelLoreEntriesSection'
import { useNovelsPage } from '../hooks/useNovelsPage'

type Props = {
  token: string
  user: AuthUser
  onLogout: () => void
}

export default function NovelsPage({ token, user, onLogout }: Props) {
  const state = useNovelsPage(token, onLogout)

  if (state.chapterEditorOpen && state.selectedNovel && state.mainTab === 'myNovels' && state.myNovelTab === 'novelChapters') {
    return (
      <ChapterEditorPage
        token={token}
        novelId={state.selectedNovel.id}
        novelTitle={state.selectedNovel.title}
        recentChapterCountDefault={state.selectedNovel.recent_chapter_count}
        volumes={state.volumes}
        characters={state.characters}
        loreEntries={state.loreEntries}
        initialChapter={state.chapterEditorTarget}
        defaultChapterNumber={state.nextChapterNumber}
        onBack={() => { state.setChapterEditorOpen(false); state.setChapterEditorTarget(null) }}
        onSaved={state.handleChapterSaved}
        onNotifySuccess={state.notifySuccess}
        onNotifyError={state.notifyError}
      />
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 3, background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0) 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <NovelSidebar
            userName={user.name}
            novels={state.novels}
            selectedNovelId={state.selectedNovelId}
            mainTab={state.mainTab}
            myNovelsExpanded={state.myNovelsExpanded}
            onToggleMyNovels={() => { state.setMainTab('myNovels'); state.setMyNovelsExpanded((v) => !v) }}
            onSelectNovel={(id) => {
              state.setMainTab('myNovels')
              state.setSelectedNovelId(id)
              state.setShowCharacterManager(false)
              state.setEditingCharacter(null)
              state.setShowLoreManager(false)
              state.setEditingLoreEntry(null)
              state.setChapterEditorOpen(false)
              state.setChapterEditorTarget(null)
              void state.refreshCharacters(id)
              void state.refreshChapters(id)
              void state.refreshVolumes(id)
              void state.refreshLoreEntries(id)
            }}
            formatNovelMeta={state.formatNovelMeta}
            onSelectCreateNovel={() => {
              state.setMainTab('createNovel')
              state.setShowNovelEditor(false)
              state.setShowCharacterManager(false)
              state.setShowLoreManager(false)
              state.setEditingLoreEntry(null)
              state.setChapterEditorOpen(false)
              state.setChapterEditorTarget(null)
              state.resetForm()
            }}
          />

          <Box sx={{ flex: 1 }}>
            <NovelTopCard
              userName={user.name}
              mainTab={state.mainTab}
              myNovelTab={state.myNovelTab}
              menuAnchor={state.menuAnchor}
              onOpenMenu={state.openMenu}
              onCloseMenu={state.closeMenu}
              onSettings={state.clickSettings}
              onLogout={state.clickLogout}
            />

            {state.mainTab === 'myNovels' && (
              <Card variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ pb: '8px !important' }}>
                  <Tabs
                    value={state.myNovelTab}
                    onChange={(_, value) => state.setMyNovelTab(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="小说详情" value="novelDetail" />
                    <Tab label="小说角色" value="novelCharacters" />
                    <Tab label="小说设定" value="novelLoreEntries" />
                    <Tab label="小说章节" value="novelChapters" />
                  </Tabs>
                  <Divider />
                </CardContent>
              </Card>
            )}

            {state.mainTab === 'createNovel' && (
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <NovelForm
                    title={state.title} genre={state.genre} language={state.language} styleProfile={state.styleProfile} worldview={state.worldview}
                    powerSystem={state.powerSystem} mainPlot={state.mainPlot} writingRules={state.writingRules} forbiddenRules={state.forbiddenRules}
                    onTitle={state.setTitle} onGenre={state.setGenre} onLanguage={state.setLanguage} onStyleProfile={state.setStyleProfile}
                    onWorldview={state.setWorldview} onPowerSystem={state.setPowerSystem} onMainPlot={state.setMainPlot}
                    onWritingRules={state.setWritingRules} onForbiddenRules={state.setForbiddenRules}
                  />
                  <Button sx={{ mt: 2 }} variant="contained" disabled={!state.title.trim() || state.loading} onClick={() => void state.handleCreate()}>创建小说</Button>
                </CardContent>
              </Card>
            )}

            {state.mainTab === 'myNovels' && state.myNovelTab === 'novelDetail' && (
              <NovelDetailSection
                selectedNovel={state.selectedNovel}
                showNovelEditor={state.showNovelEditor}
                loading={state.loading}
                title={state.title}
                genre={state.genre}
                language={state.language}
                styleProfile={state.styleProfile}
                worldview={state.worldview}
                powerSystem={state.powerSystem}
                mainPlot={state.mainPlot}
                writingRules={state.writingRules}
                forbiddenRules={state.forbiddenRules}
                onEditNovel={() => state.setShowNovelEditor(true)}
                onDeleteNovel={() => state.selectedNovelId && state.setConfirmDeleteId(state.selectedNovelId)}
                onHideEditor={() => state.setShowNovelEditor(false)}
                onUpdateNovel={() => void state.handleUpdate()}
                onTitle={state.setTitle}
                onGenre={state.setGenre}
                onLanguage={state.setLanguage}
                onStyleProfile={state.setStyleProfile}
                onWorldview={state.setWorldview}
                onPowerSystem={state.setPowerSystem}
                onMainPlot={state.setMainPlot}
                onWritingRules={state.setWritingRules}
                onForbiddenRules={state.setForbiddenRules}
              />
            )}

            {state.mainTab === 'myNovels' && state.myNovelTab === 'novelCharacters' && (
              <NovelCharactersSection
                token={token}
                selectedNovel={state.selectedNovel}
                characters={state.characters}
                characterLoading={state.characterLoading}
                showCharacterManager={state.showCharacterManager}
                editingCharacter={state.editingCharacter}
                onEditCharacter={(character) => { state.setEditingCharacter(character); state.setShowCharacterManager(true) }}
                onDeleteCharacter={state.setConfirmDeleteCharacterId}
                onOpenCreateCharacter={() => { state.setEditingCharacter(null); state.setShowCharacterManager(true) }}
                onDoneCharacterManager={() => {
                  state.setShowCharacterManager(false)
                  state.setEditingCharacter(null)
                  if (state.selectedNovel) void state.refreshCharacters(state.selectedNovel.id)
                }}
                onNotifySuccess={state.notifySuccess}
                onNotifyError={state.notifyError}
              />
            )}

            {state.mainTab === 'myNovels' && state.myNovelTab === 'novelLoreEntries' && (
              <NovelLoreEntriesSection
                token={token}
                selectedNovel={state.selectedNovel}
                characters={state.characters}
                loreEntries={state.loreEntries}
                loreLoading={state.loreLoading}
                showLoreManager={state.showLoreManager}
                editingLoreEntry={state.editingLoreEntry}
                onEditLoreEntry={(entry) => { state.setEditingLoreEntry(entry); state.setShowLoreManager(true) }}
                onDeleteLoreEntry={state.setConfirmDeleteLoreEntryId}
                onOpenCreateLoreEntry={() => { state.setEditingLoreEntry(null); state.setShowLoreManager(true) }}
                onDoneLoreEntryManager={() => {
                  state.setShowLoreManager(false)
                  state.setEditingLoreEntry(null)
                  if (state.selectedNovel) void state.refreshLoreEntries(state.selectedNovel.id)
                }}
                onNotifySuccess={state.notifySuccess}
                onNotifyError={state.notifyError}
              />
            )}

            {state.mainTab === 'myNovels' && state.myNovelTab === 'novelChapters' && (
              <NovelChaptersSection
                selectedNovel={state.selectedNovel}
                novelTotalWordCount={state.novelTotalWordCount}
                exportingMarkdown={state.exportingMarkdown}
                volumes={state.volumes}
                newVolumeTitle={state.newVolumeTitle}
                chapterSearch={state.chapterSearch}
                chapterSort={state.chapterSort}
                chapterVolumeFilter={state.chapterVolumeFilter}
                chapterCharacterFilter={state.chapterCharacterFilter}
                chapterStatusFilter={state.chapterStatusFilter}
                chapterCharacterOptions={state.chapterCharacterOptions}
                chapterLoading={state.chapterLoading}
                visibleChapters={state.visibleChapters}
                groupedChapters={state.groupedChapters}
                movingChapterId={state.movingChapterId}
                onOpenExport={() => state.setExportDialogOpen(true)}
                onNewVolumeTitleChange={state.setNewVolumeTitle}
                onCreateVolume={() => void state.handleCreateVolume()}
                onChapterSearchChange={state.setChapterSearch}
                onChapterSortChange={state.setChapterSort}
                onChapterVolumeFilterChange={state.setChapterVolumeFilter}
                onChapterCharacterFilterChange={state.setChapterCharacterFilter}
                onChapterStatusFilterChange={state.setChapterStatusFilter}
                onMoveChapterVolume={(chapter, nextVolumeID) => void state.handleMoveChapterVolume(chapter, nextVolumeID)}
                onUpdateChapterStatus={(chapter, status) => void state.handleUpdateChapterStatus(chapter, status)}
                onEditChapter={(chapter) => { state.setChapterEditorTarget(chapter); state.setChapterEditorOpen(true) }}
                onDeleteChapter={state.setConfirmDeleteChapterId}
                onCreateChapter={() => { state.setChapterEditorTarget(null); state.setChapterEditorOpen(true) }}
                onEditVolume={state.openEditVolume}
              />
            )}
          </Box>
        </Stack>

        <Dialog open={state.confirmDeleteId !== null} onClose={() => state.setConfirmDeleteId(null)}>
          <DialogTitle>删除小说</DialogTitle>
          <DialogContent><DialogContentText>确认删除这本小说吗？此操作不可撤销。</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteId(null)}>取消</Button><Button onClick={() => void state.confirmDelete()} color="error" variant="contained">删除</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteCharacterId !== null} onClose={() => state.setConfirmDeleteCharacterId(null)}>
          <DialogTitle>删除角色</DialogTitle>
          <DialogContent><DialogContentText>确认删除这个角色吗？此操作不可撤销。</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteCharacterId(null)}>取消</Button><Button onClick={() => void state.confirmDeleteCharacter()} color="error" variant="contained">删除</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteLoreEntryId !== null} onClose={() => state.setConfirmDeleteLoreEntryId(null)}>
          <DialogTitle>删除设定</DialogTitle>
          <DialogContent><DialogContentText>确认删除这个设定吗？此操作不可撤销。</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteLoreEntryId(null)}>取消</Button><Button onClick={() => void state.confirmDeleteLoreEntry()} color="error" variant="contained">删除</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteChapterId !== null} onClose={() => state.setConfirmDeleteChapterId(null)}>
          <DialogTitle>删除章节</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {state.chapterToDelete ? `你将删除：第 ${state.chapterToDelete.chapter_number} 章《${state.chapterToDelete.title || '未命名'}》，此操作不可撤销。` : '确认删除此章节吗？此操作不可撤销。'}
            </DialogContentText>
          </DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteChapterId(null)}>取消</Button><Button onClick={() => void state.confirmDeleteChapter()} color="error" variant="contained">删除</Button></DialogActions>
        </Dialog>

        <Dialog open={state.editingVolume !== null} onClose={state.closeEditVolume} fullWidth maxWidth="sm">
          <DialogTitle>编辑卷名</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 1.5 }}>{state.editingVolume ? `第${state.editingVolume.volume_number}卷` : ''}</DialogContentText>
            <TextField label="卷名" value={state.editingVolumeTitle} onChange={(e) => state.setEditingVolumeTitle(e.target.value)} fullWidth autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={state.closeEditVolume}>取消</Button>
            <Button onClick={() => void state.handleUpdateVolume()} variant="contained" disabled={!state.editingVolumeTitle.trim()}>保存</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={state.showAISettingsDialog}
          onClose={() => state.setShowAISettingsDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>AI 设置</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="ai-provider-select-label">AI Provider</InputLabel>
                <Select
                  labelId="ai-provider-select-label"
                  label="AI Provider"
                  value={state.aiProvider}
                  onChange={(e) => state.setAIProvider(String(e.target.value) as 'openai' | 'gemini')}
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={state.aiProvider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'}
                type="password"
                value={state.aiProvider === 'openai' ? state.openaiAPIKeyInput : state.geminiAPIKeyInput}
                onChange={(e) => state.aiProvider === 'openai' ? state.setOpenAIAPIKeyInput(e.target.value) : state.setGeminiAPIKeyInput(e.target.value)}
                placeholder={state.aiProvider === 'openai'
                  ? (state.openaiHasAPIKey ? `当前：${state.openaiAPIKeyMasked}` : 'sk-...')
                  : (state.geminiHasAPIKey ? `当前：${state.geminiAPIKeyMasked}` : 'AIza...')}
                helperText={state.aiProvider === 'openai'
                  ? (state.openaiHasAPIKey ? `已保存：${state.openaiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')
                  : (state.geminiHasAPIKey ? `已保存：${state.geminiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')}
                fullWidth
              />
              <TextField
                label={state.aiProvider === 'openai' ? 'OpenAI Base URL' : 'Gemini Base URL'}
                value={state.aiProvider === 'openai' ? state.openaiBaseURL : state.geminiBaseURL}
                onChange={(e) => state.aiProvider === 'openai' ? state.setOpenAIBaseURL(e.target.value) : state.setGeminiBaseURL(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="ai-model-select-label">{state.aiProvider === 'openai' ? 'OpenAI Model' : 'Gemini Model'}</InputLabel>
                <Select
                  labelId="ai-model-select-label"
                  label={state.aiProvider === 'openai' ? 'OpenAI Model' : 'Gemini Model'}
                  value={state.aiProvider === 'openai' ? state.openaiModel : state.geminiModel}
                  onChange={(e) => state.aiProvider === 'openai' ? state.setOpenAIModel(String(e.target.value)) : state.setGeminiModel(String(e.target.value))}
                >
                  {(state.aiProvider === 'openai' ? state.openaiModelOptions : state.geminiModelOptions).map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={state.resetAISettingsDefaults}>恢复默认</Button>
            <Button onClick={() => state.setShowAISettingsDialog(false)}>取消</Button>
            <Button variant="contained" onClick={() => void state.saveAISettings()} disabled={state.aiSettingLoading}>
              保存
            </Button>
          </DialogActions>
        </Dialog>

        <ExportDialog
          open={state.exportDialogOpen}
          exporting={state.exportingMarkdown}
          scope={state.exportScope}
          status={state.exportStatus}
          volumeId={state.exportVolumeID}
          fromChapter={state.exportFromChapter}
          toChapter={state.exportToChapter}
          includeBody={state.includeBody}
          includeSummary={state.includeSummary}
          includeOutline={state.includeOutline}
          volumes={state.volumes}
          onClose={() => state.setExportDialogOpen(false)}
          onScopeChange={state.setExportScope}
          onStatusChange={state.setExportStatus}
          onVolumeIdChange={state.setExportVolumeID}
          onFromChapterChange={state.setExportFromChapter}
          onToChapterChange={state.setExportToChapter}
          onIncludeBodyChange={state.setIncludeBody}
          onIncludeSummaryChange={state.setIncludeSummary}
          onIncludeOutlineChange={state.setIncludeOutline}
          onExport={() => void state.handleExportMarkdown()}
        />

        <Snackbar open={state.successOpen && Boolean(state.message)} autoHideDuration={2500} onClose={() => state.setSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
          <Alert onClose={() => state.setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>{state.message}</Alert>
        </Snackbar>

        <Snackbar open={state.errorOpen && Boolean(state.error)} autoHideDuration={3200} onClose={() => state.setErrorOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
          <Alert onClose={() => state.setErrorOpen(false)} severity="error" variant="filled" sx={{ width: '100%' }}>{state.error}</Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
