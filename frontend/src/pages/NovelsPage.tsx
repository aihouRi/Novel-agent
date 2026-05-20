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
                    recentChapterCount={state.recentChapterCount}
                    onTitle={state.setTitle} onGenre={state.setGenre} onLanguage={state.setLanguage} onStyleProfile={state.setStyleProfile}
                    onWorldview={state.setWorldview} onPowerSystem={state.setPowerSystem} onMainPlot={state.setMainPlot}
                    onWritingRules={state.setWritingRules} onForbiddenRules={state.setForbiddenRules} onRecentChapterCount={state.setRecentChapterCount}
                  />
                  <Button sx={{ mt: 2 }} variant="contained" disabled={!state.title.trim() || state.loading} onClick={() => void state.handleCreate()}>Create Novel</Button>
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
                recentChapterCount={state.recentChapterCount}
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
                onRecentChapterCount={state.setRecentChapterCount}
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
                chapterLoading={state.chapterLoading}
                visibleChapters={state.visibleChapters}
                groupedChapters={state.groupedChapters}
                movingChapterId={state.movingChapterId}
                onOpenExport={() => state.setExportDialogOpen(true)}
                onNewVolumeTitleChange={state.setNewVolumeTitle}
                onCreateVolume={() => void state.handleCreateVolume()}
                onChapterSearchChange={state.setChapterSearch}
                onChapterSortChange={state.setChapterSort}
                onMoveChapterVolume={(chapter, nextVolumeID) => void state.handleMoveChapterVolume(chapter, nextVolumeID)}
                onEditChapter={(chapter) => { state.setChapterEditorTarget(chapter); state.setChapterEditorOpen(true) }}
                onDeleteChapter={state.setConfirmDeleteChapterId}
                onCreateChapter={() => { state.setChapterEditorTarget(null); state.setChapterEditorOpen(true) }}
                onEditVolume={state.openEditVolume}
              />
            )}
          </Box>
        </Stack>

        <Dialog open={state.confirmDeleteId !== null} onClose={() => state.setConfirmDeleteId(null)}>
          <DialogTitle>Delete Novel</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete this novel? This action cannot be undone.</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteId(null)}>Cancel</Button><Button onClick={() => void state.confirmDelete()} color="error" variant="contained">Delete</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteCharacterId !== null} onClose={() => state.setConfirmDeleteCharacterId(null)}>
          <DialogTitle>Delete Character</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete this character? This action cannot be undone.</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteCharacterId(null)}>Cancel</Button><Button onClick={() => void state.confirmDeleteCharacter()} color="error" variant="contained">Delete</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteLoreEntryId !== null} onClose={() => state.setConfirmDeleteLoreEntryId(null)}>
          <DialogTitle>Delete Lore Entry</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to delete this lore entry? This action cannot be undone.</DialogContentText></DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteLoreEntryId(null)}>Cancel</Button><Button onClick={() => void state.confirmDeleteLoreEntry()} color="error" variant="contained">Delete</Button></DialogActions>
        </Dialog>

        <Dialog open={state.confirmDeleteChapterId !== null} onClose={() => state.setConfirmDeleteChapterId(null)}>
          <DialogTitle>Delete Chapter</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {state.chapterToDelete ? `你将删除：第 ${state.chapterToDelete.chapter_number} 章《${state.chapterToDelete.title || 'Untitled'}》，此操作不可撤销。` : 'Are you sure you want to delete this chapter? This action cannot be undone.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions><Button onClick={() => state.setConfirmDeleteChapterId(null)}>Cancel</Button><Button onClick={() => void state.confirmDeleteChapter()} color="error" variant="contained">Delete</Button></DialogActions>
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

        <ExportDialog
          open={state.exportDialogOpen}
          exporting={state.exportingMarkdown}
          scope={state.exportScope}
          volumeId={state.exportVolumeID}
          fromChapter={state.exportFromChapter}
          toChapter={state.exportToChapter}
          includeBody={state.includeBody}
          includeSummary={state.includeSummary}
          includeOutline={state.includeOutline}
          volumes={state.volumes}
          onClose={() => state.setExportDialogOpen(false)}
          onScopeChange={state.setExportScope}
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
