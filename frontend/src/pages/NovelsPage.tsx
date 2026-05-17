import { MouseEvent, useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import type { AuthUser } from '../api/auth'
import { createNovel, deleteNovel, listNovels, type Novel, updateNovel } from '../api/novels'
import { deleteCharacter, listCharacters, type Character } from '../api/characters'
import { createChapter, deleteChapter, listChapters, type Chapter, updateChapter } from '../api/chapters'
import CharacterManager from '../components/CharacterManager'

type Props = {
  token: string
  user: AuthUser
  onLogout: () => void
}

type MainTab = 'myNovels' | 'createNovel'
type MyNovelTab = 'novelDetail' | 'novelCharacters' | 'novelChapters'

const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_RECENT_COUNT = 3

export default function NovelsPage({ token, user, onLogout }: Props) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)

  const [mainTab, setMainTab] = useState<MainTab>('myNovels')
  const [myNovelsExpanded, setMyNovelsExpanded] = useState(true)
  const [myNovelTab, setMyNovelTab] = useState<MyNovelTab>('novelDetail')

  const [showNovelEditor, setShowNovelEditor] = useState(false)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterLoading, setChapterLoading] = useState(false)
  const [showChapterEditor, setShowChapterEditor] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [confirmDeleteChapterId, setConfirmDeleteChapterId] = useState<number | null>(null)

  const [chapterNumber, setChapterNumber] = useState(1)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterBody, setChapterBody] = useState('')
  const [chapterWordCount, setChapterWordCount] = useState(0)
  const [chapterInstruction, setChapterInstruction] = useState('')
  const [chapterOutline, setChapterOutline] = useState('')
  const [chapterSummary, setChapterSummary] = useState('')

  const [characters, setCharacters] = useState<Character[]>([])
  const [characterLoading, setCharacterLoading] = useState(false)
  const [confirmDeleteCharacterId, setConfirmDeleteCharacterId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [styleProfile, setStyleProfile] = useState('')
  const [worldview, setWorldview] = useState('')
  const [powerSystem, setPowerSystem] = useState('')
  const [mainPlot, setMainPlot] = useState('')
  const [writingRules, setWritingRules] = useState('')
  const [forbiddenRules, setForbiddenRules] = useState('')
  const [recentChapterCount, setRecentChapterCount] = useState(DEFAULT_RECENT_COUNT)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorOpen, setErrorOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const selectedNovel = useMemo(() => novels.find((n) => n.id === selectedNovelId) ?? null, [novels, selectedNovelId])

  useEffect(() => {
    void refreshNovels()
  }, [])

  useEffect(() => {
    if (selectedNovel) fillForm(selectedNovel)
  }, [selectedNovelId, novels])

  useEffect(() => {
    if (mainTab === 'myNovels' && myNovelTab === 'novelCharacters' && selectedNovelId) {
      void refreshCharacters(selectedNovelId)
    }
    if (mainTab === 'myNovels' && myNovelTab === 'novelChapters' && selectedNovelId) {
      void refreshChapters(selectedNovelId)
    }
  }, [mainTab, myNovelTab, selectedNovelId])

  useEffect(() => {
    if (error) setErrorOpen(true)
  }, [error])

  function notifySuccess(text: string) {
    setError('')
    setMessage(text)
    setSuccessOpen(true)
  }

  function notifyError(text: string) {
    setMessage('')
    setError(text)
  }

  useEffect(() => {
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelDetail') {
      setShowNovelEditor(false)
    }
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelCharacters') {
      setShowCharacterManager(false)
    }
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelChapters') {
      setShowChapterEditor(false)
      setEditingChapter(null)
    }
  }, [mainTab, myNovelTab])

  async function refreshNovels() {
    setLoading(true)
    setError('')
    try {
      const data = await listNovels(token)
      setNovels(data.novels)
      if (!selectedNovelId && data.novels.length > 0) {
        setSelectedNovelId(data.novels[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load novels')
    } finally {
      setLoading(false)
    }
  }

  async function refreshCharacters(novelId: number) {
    setCharacterLoading(true)
    try {
      const data = await listCharacters(token, novelId)
      setCharacters(data.characters)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters')
    } finally {
      setCharacterLoading(false)
    }
  }

  async function refreshChapters(novelId: number) {
    setChapterLoading(true)
    try {
      const data = await listChapters(token, novelId)
      setChapters(data.chapters)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chapters')
    } finally {
      setChapterLoading(false)
    }
  }

  function resetChapterForm() {
    setChapterNumber(1)
    setChapterTitle('')
    setChapterBody('')
    setChapterWordCount(0)
    setChapterInstruction('')
    setChapterOutline('')
    setChapterSummary('')
    setEditingChapter(null)
  }

  function fillChapterForm(chapter: Chapter) {
    setChapterNumber(chapter.chapter_number)
    setChapterTitle(chapter.title)
    setChapterBody(chapter.body)
    setChapterWordCount(chapter.word_count)
    setChapterInstruction(chapter.generation_instruction)
    setChapterOutline(chapter.outline)
    setChapterSummary(chapter.summary)
    setEditingChapter(chapter)
  }

  async function handleCreateChapter() {
    if (!selectedNovelId) return
    setChapterLoading(true)
    setError('')
    setMessage('')
    try {
      await createChapter(token, selectedNovelId, {
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        body: chapterBody,
        word_count: chapterWordCount,
        generation_instruction: chapterInstruction,
        outline: chapterOutline,
        summary: chapterSummary,
      })
      notifySuccess('Chapter created.')
      setShowChapterEditor(false)
      resetChapterForm()
      await refreshChapters(selectedNovelId)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to create chapter')
    } finally {
      setChapterLoading(false)
    }
  }

  async function handleUpdateChapter() {
    if (!selectedNovelId || !editingChapter) return
    setChapterLoading(true)
    setError('')
    setMessage('')
    try {
      await updateChapter(token, selectedNovelId, editingChapter.id, {
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        body: chapterBody,
        word_count: chapterWordCount,
        generation_instruction: chapterInstruction,
        outline: chapterOutline,
        summary: chapterSummary,
      })
      notifySuccess('Chapter updated.')
      setShowChapterEditor(false)
      resetChapterForm()
      await refreshChapters(selectedNovelId)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to update chapter')
    } finally {
      setChapterLoading(false)
    }
  }

  function fillForm(novel: Novel) {
    setTitle(novel.title)
    setGenre(novel.genre)
    setLanguage(novel.language || DEFAULT_LANGUAGE)
    setStyleProfile(novel.style_profile)
    setWorldview(novel.worldview)
    setPowerSystem(novel.power_system)
    setMainPlot(novel.main_plot)
    setWritingRules(novel.writing_rules)
    setForbiddenRules(novel.forbidden_rules)
    setRecentChapterCount(novel.recent_chapter_count || DEFAULT_RECENT_COUNT)
  }

  function resetForm() {
    setTitle('')
    setGenre('')
    setLanguage(DEFAULT_LANGUAGE)
    setStyleProfile('')
    setWorldview('')
    setPowerSystem('')
    setMainPlot('')
    setWritingRules('')
    setForbiddenRules('')
    setRecentChapterCount(DEFAULT_RECENT_COUNT)
  }

  function currentPayload() {
    return {
      title: title.trim(),
      genre: genre.trim(),
      language: language.trim() || DEFAULT_LANGUAGE,
      style_profile: styleProfile.trim(),
      worldview: worldview.trim(),
      power_system: powerSystem.trim(),
      main_plot: mainPlot.trim(),
      writing_rules: writingRules.trim(),
      forbidden_rules: forbiddenRules.trim(),
      recent_chapter_count: recentChapterCount > 0 ? recentChapterCount : DEFAULT_RECENT_COUNT,
    }
  }

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await createNovel(token, currentPayload())
      setNovels((prev) => [data.novel, ...prev])
      setSelectedNovelId(data.novel.id)
      setMainTab('myNovels')
      setMyNovelsExpanded(true)
      setMyNovelTab('novelDetail')
      setShowNovelEditor(false)
      notifySuccess('Novel created.')
      fillForm(data.novel)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to create novel')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!selectedNovelId || !title.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await updateNovel(token, selectedNovelId, currentPayload())
      setNovels((prev) => prev.map((n) => (n.id === selectedNovelId ? data.novel : n)))
      notifySuccess('Novel updated.')
      setShowNovelEditor(false)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to update novel')
    } finally {
      setLoading(false)
    }
  }

  function requestDelete(id: number) {
    setConfirmDeleteId(id)
  }

  function closeDeleteDialog() {
    setConfirmDeleteId(null)
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteNovel(token, id)
      const next = novels.filter((n) => n.id !== id)
      setNovels(next)
      setSelectedNovelId(next.length > 0 ? next[0].id : null)
      notifySuccess('Novel deleted.')
      setShowNovelEditor(false)
      if (next.length > 0) fillForm(next[0])
      else resetForm()
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to delete novel')
    } finally {
      setLoading(false)
    }
  }

  function requestDeleteCharacter(id: number) {
    setConfirmDeleteCharacterId(id)
  }

  function closeDeleteCharacterDialog() {
    setConfirmDeleteCharacterId(null)
  }

  async function confirmDeleteCharacter() {
    if (!confirmDeleteCharacterId || !selectedNovelId) return
    const id = confirmDeleteCharacterId
    setConfirmDeleteCharacterId(null)
    setCharacterLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteCharacter(token, selectedNovelId, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      notifySuccess('Character deleted.')
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to delete character')
    } finally {
      setCharacterLoading(false)
    }
  }

  function requestDeleteChapter(id: number) {
    setConfirmDeleteChapterId(id)
  }

  function closeDeleteChapterDialog() {
    setConfirmDeleteChapterId(null)
  }

  async function confirmDeleteChapter() {
    if (!confirmDeleteChapterId || !selectedNovelId) return
    const id = confirmDeleteChapterId
    setConfirmDeleteChapterId(null)
    setChapterLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteChapter(token, selectedNovelId, id)
      notifySuccess('Chapter deleted.')
      await refreshChapters(selectedNovelId)
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'Failed to delete chapter')
    } finally {
      setChapterLoading(false)
    }
  }

  function openMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchor(event.currentTarget)
  }

  function closeMenu() {
    setMenuAnchor(null)
  }

  function clickSettings() {
    closeMenu()
    notifySuccess('User settings will be available in a later phase.')
  }

  function clickLogout() {
    closeMenu()
    onLogout()
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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card
            variant="outlined"
            sx={{ width: { xs: '100%', md: 300 }, borderRadius: 3, borderColor: 'rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.9)' }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: '#0f766e' }}>{user.name.slice(0, 1).toUpperCase()}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Novel Agent</Typography>
                  <Typography variant="body2" color="text.secondary">{user.name}</Typography>
                </Box>
              </Stack>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  startIcon={<LibraryBooksOutlinedIcon />}
                  endIcon={myNovelsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => {
                    setMainTab('myNovels')
                    setMyNovelsExpanded((v) => !v)
                  }}
                  sx={{
                    justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, px: 1.5, py: 1.2,
                    color: '#111827', fontWeight: 600,
                    '& .MuiButton-endIcon': { marginLeft: 'auto' },
                  }}
                >
                  我的小说
                </Button>

                <Collapse in={myNovelsExpanded}>
                  <Stack spacing={0.6} sx={{ pl: 1.5, pr: 1, mt: 0.4 }}>
                    <Button
                      fullWidth
                      onClick={() => {
                        setMainTab('myNovels')
                        setMyNovelTab('novelDetail')
                        setShowNovelEditor(false)
                      }}
                      sx={{
                        justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
                        pl: 5.5, pr: 1.5, py: 1,
                        color: mainTab === 'myNovels' && myNovelTab === 'novelDetail' ? '#ea580c' : '#111827',
                        bgcolor: mainTab === 'myNovels' && myNovelTab === 'novelDetail' ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                        fontWeight: mainTab === 'myNovels' && myNovelTab === 'novelDetail' ? 700 : 500,
                      }}
                    >
                      小说详情
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => {
                        setMainTab('myNovels')
                        setMyNovelTab('novelCharacters')
                        setShowCharacterManager(false)
                        setEditingCharacter(null)
                        if (selectedNovelId) void refreshCharacters(selectedNovelId)
                      }}
                      sx={{
                        justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
                        pl: 5.5, pr: 1.5, py: 1,
                        color: mainTab === 'myNovels' && myNovelTab === 'novelCharacters' ? '#ea580c' : '#111827',
                        bgcolor: mainTab === 'myNovels' && myNovelTab === 'novelCharacters' ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                        fontWeight: mainTab === 'myNovels' && myNovelTab === 'novelCharacters' ? 700 : 500,
                      }}
                    >
                      小说角色
                    </Button>
                    <Button
                      fullWidth
                      onClick={() => {
                        setMainTab('myNovels')
                        setMyNovelTab('novelChapters')
                        setShowChapterEditor(false)
                        resetChapterForm()
                        if (selectedNovelId) void refreshChapters(selectedNovelId)
                      }}
                      sx={{
                        justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
                        pl: 5.5, pr: 1.5, py: 1,
                        color: mainTab === 'myNovels' && myNovelTab === 'novelChapters' ? '#ea580c' : '#111827',
                        bgcolor: mainTab === 'myNovels' && myNovelTab === 'novelChapters' ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                        fontWeight: mainTab === 'myNovels' && myNovelTab === 'novelChapters' ? 700 : 500,
                      }}
                    >
                      小说章节
                    </Button>
                  </Stack>
                </Collapse>

                <Button
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setMainTab('createNovel')
                    setShowNovelEditor(false)
                    setShowCharacterManager(false)
                    resetForm()
                  }}
                  sx={{
                    justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
                    px: 1.5, py: 1.2,
                    color: mainTab === 'createNovel' ? '#ea580c' : '#111827',
                    bgcolor: mainTab === 'createNovel' ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                    fontWeight: mainTab === 'createNovel' ? 700 : 600,
                  }}
                >
                  新建小说
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 3, borderColor: 'rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.9)' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {mainTab === 'createNovel' ? '新建小说' : myNovelTab === 'novelDetail' ? '小说详情' : myNovelTab === 'novelCharacters' ? '小说角色' : '小说章节'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mainTab === 'createNovel'
                      ? 'Create a new novel project'
                      : myNovelTab === 'novelDetail'
                        ? 'Select and edit your novel'
                        : myNovelTab === 'novelCharacters'
                          ? 'Manage characters under selected novel'
                          : 'Manage chapters under selected novel'}
                  </Typography>
                </Box>

                <IconButton onClick={openMenu} sx={{ border: '1px solid #cbd5e1', borderRadius: 999, p: 0.5, bgcolor: 'white' }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f766e', fontSize: 16, fontWeight: 700 }}>
                    {user.name.slice(0, 1).toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                  <MenuItem onClick={clickSettings}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>User Settings (Soon)</MenuItem>
                  <MenuItem onClick={clickLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
                </Menu>
              </CardContent>
            </Card>

            {mainTab === 'createNovel' && (
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <NovelForm
                    title={title} genre={genre} language={language} styleProfile={styleProfile} worldview={worldview}
                    powerSystem={powerSystem} mainPlot={mainPlot} writingRules={writingRules} forbiddenRules={forbiddenRules}
                    recentChapterCount={recentChapterCount}
                    onTitle={setTitle} onGenre={setGenre} onLanguage={setLanguage} onStyleProfile={setStyleProfile}
                    onWorldview={setWorldview} onPowerSystem={setPowerSystem} onMainPlot={setMainPlot}
                    onWritingRules={setWritingRules} onForbiddenRules={setForbiddenRules} onRecentChapterCount={setRecentChapterCount}
                  />
                  <Button sx={{ mt: 2 }} variant="contained" disabled={!title.trim() || loading} onClick={() => void handleCreate()}>
                    Create Novel
                  </Button>
                </CardContent>
              </Card>
            )}

            {mainTab === 'myNovels' && myNovelTab === 'novelDetail' && (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>My Novels</Typography>
                    {novels.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No novels yet.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {novels.map((novel) => (
                          <Card key={novel.id} variant="outlined" sx={{ borderRadius: 2, borderColor: selectedNovelId === novel.id ? '#14b8a6' : '#e2e8f0' }}>
                            <CardActionArea onClick={() => setSelectedNovelId(novel.id)}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>{novel.title}</Typography>
                                  <Typography variant="body2" color="text.secondary">{novel.genre || 'No genre'} · {novel.language}</Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton onClick={(e) => { e.stopPropagation(); setSelectedNovelId(novel.id); setShowNovelEditor(true) }}><EditOutlinedIcon /></IconButton>
                                  <IconButton onClick={(e) => { e.stopPropagation(); requestDelete(novel.id) }}><DeleteOutlineIcon /></IconButton>
                                </Stack>
                              </Stack>
                            </CardActionArea>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                {selectedNovel && showNovelEditor && (
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Novel Detail Editor</Typography>
                      <NovelForm
                        title={title} genre={genre} language={language} styleProfile={styleProfile} worldview={worldview}
                        powerSystem={powerSystem} mainPlot={mainPlot} writingRules={writingRules} forbiddenRules={forbiddenRules}
                        recentChapterCount={recentChapterCount}
                        onTitle={setTitle} onGenre={setGenre} onLanguage={setLanguage} onStyleProfile={setStyleProfile}
                        onWorldview={setWorldview} onPowerSystem={setPowerSystem} onMainPlot={setMainPlot}
                        onWritingRules={setWritingRules} onForbiddenRules={setForbiddenRules} onRecentChapterCount={setRecentChapterCount}
                      />
                      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                        <Button variant="contained" disabled={!title.trim() || loading} onClick={() => void handleUpdate()}>Update Novel</Button>
                        <Button variant="outlined" onClick={() => setShowNovelEditor(false)} disabled={loading}>Cancel</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}

            {mainTab === 'myNovels' && myNovelTab === 'novelCharacters' && (
              selectedNovel ? (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>小说角色</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="character-novel-select">选择小说</InputLabel>
                      <Select
                        labelId="character-novel-select"
                        label="选择小说"
                        value={selectedNovelId ?? ''}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setSelectedNovelId(next)
                          setShowCharacterManager(false)
                          setEditingCharacter(null)
                          void refreshCharacters(next)
                        }}
                      >
                        {novels.map((n) => (
                          <MenuItem key={n.id} value={n.id}>{n.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>当前角色</Typography>
                    {characterLoading ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
                    ) : (
                      !showCharacterManager && (characters.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No characters yet.</Typography>
                      ) : (
                        <Stack spacing={1.2} sx={{ mb: 2 }}>
                          {characters.map((c) => (
                            <Box key={c.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{c.role || 'No role'}</Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  onClick={() => {
                                    setEditingCharacter(c)
                                    setShowCharacterManager(true)
                                  }}
                                  disabled={characterLoading}
                                >
                                  <EditOutlinedIcon />
                                </IconButton>
                                <IconButton onClick={() => requestDeleteCharacter(c.id)} disabled={characterLoading}>
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ))
                    )}

                    {!showCharacterManager ? (
                      <Button
                        variant="contained"
                        onClick={() => {
                          setEditingCharacter(null)
                          setShowCharacterManager(true)
                        }}
                      >
                        新增角色
                      </Button>
                    ) : (
                      <CharacterManager
                        token={token}
                        novelId={selectedNovel.id}
                        initialCharacter={editingCharacter}
                        onNotifySuccess={notifySuccess}
                        onNotifyError={notifyError}
                        onDone={() => {
                          setShowCharacterManager(false)
                          setEditingCharacter(null)
                          void refreshCharacters(selectedNovel.id)
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">请先在“小说详情”中选择一本小说，再管理角色。</Typography>
                  </CardContent>
                </Card>
              )
            )}

            {mainTab === 'myNovels' && myNovelTab === 'novelChapters' && (
              selectedNovel ? (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>小说章节</Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="chapter-novel-select">选择小说</InputLabel>
                      <Select
                        labelId="chapter-novel-select"
                        label="选择小说"
                        value={selectedNovelId ?? ''}
                        onChange={(e) => {
                          const next = Number(e.target.value)
                          setSelectedNovelId(next)
                          setShowChapterEditor(false)
                          resetChapterForm()
                          void refreshChapters(next)
                        }}
                      >
                        {novels.map((n) => (
                          <MenuItem key={n.id} value={n.id}>{n.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {!showChapterEditor && (
                      <>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>当前章节</Typography>
                        {chapterLoading ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
                        ) : chapters.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No chapters yet.</Typography>
                        ) : (
                          <Stack spacing={1.2} sx={{ mb: 2 }}>
                            {chapters.map((c) => (
                              <Box key={c.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>第 {c.chapter_number} 章 · {c.title || 'Untitled'}</Typography>
                                  <Typography variant="body2" color="text.secondary">{c.word_count} words</Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    onClick={() => {
                                      fillChapterForm(c)
                                      setShowChapterEditor(true)
                                    }}
                                  >
                                    <EditOutlinedIcon />
                                  </IconButton>
                                  <IconButton onClick={() => requestDeleteChapter(c.id)}>
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        )}
                        <Button
                          variant="contained"
                          onClick={() => {
                            resetChapterForm()
                            setShowChapterEditor(true)
                          }}
                        >
                          新增章节
                        </Button>
                      </>
                    )}

                    {showChapterEditor && (
                      <Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            {editingChapter ? 'Chapter Editor' : 'Create Chapter'}
                          </Typography>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Chapter Number"
                              type="number"
                              value={chapterNumber}
                              onChange={(e) => setChapterNumber(Number(e.target.value) || 0)}
                            />
                            <TextField
                              label="Title"
                              value={chapterTitle}
                              onChange={(e) => setChapterTitle(e.target.value)}
                            />
                            <TextField
                              label="Body"
                              multiline
                              minRows={6}
                              value={chapterBody}
                              onChange={(e) => setChapterBody(e.target.value)}
                            />
                            <TextField
                              label="Word Count"
                              type="number"
                              value={chapterWordCount}
                              onChange={(e) => setChapterWordCount(Number(e.target.value) || 0)}
                            />
                            <TextField
                              label="Generation Instruction"
                              multiline
                              minRows={3}
                              value={chapterInstruction}
                              onChange={(e) => setChapterInstruction(e.target.value)}
                            />
                            <TextField
                              label="Outline"
                              multiline
                              minRows={3}
                              value={chapterOutline}
                              onChange={(e) => setChapterOutline(e.target.value)}
                            />
                            <TextField
                              label="Summary"
                              multiline
                              minRows={3}
                              value={chapterSummary}
                              onChange={(e) => setChapterSummary(e.target.value)}
                            />
                            <Stack direction="row" spacing={1.5}>
                              <Button
                                variant="contained"
                                disabled={chapterLoading || chapterNumber <= 0}
                                onClick={() => void (editingChapter ? handleUpdateChapter() : handleCreateChapter())}
                              >
                                {editingChapter ? 'Update Chapter' : 'Create Chapter'}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setShowChapterEditor(false)
                                  resetChapterForm()
                                }}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">请先在“小说详情”中选择一本小说，再管理章节。</Typography>
                  </CardContent>
                </Card>
              )
            )}
          </Box>
        </Stack>

        <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
          <DialogTitle>Delete Novel</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this novel? This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button onClick={() => void confirmDelete()} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDeleteCharacterId !== null} onClose={closeDeleteCharacterDialog}>
          <DialogTitle>Delete Character</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this character? This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteCharacterDialog}>Cancel</Button>
            <Button onClick={() => void confirmDeleteCharacter()} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDeleteChapterId !== null} onClose={closeDeleteChapterDialog}>
          <DialogTitle>Delete Chapter</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this chapter? This action cannot be undone.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteChapterDialog}>Cancel</Button>
            <Button onClick={() => void confirmDeleteChapter()} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={successOpen && Boolean(message)}
          autoHideDuration={2500}
          onClose={() => setSuccessOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={() => setSuccessOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
            {message}
          </Alert>
        </Snackbar>

        <Snackbar
          open={errorOpen && Boolean(error)}
          autoHideDuration={3200}
          onClose={() => setErrorOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={() => setErrorOpen(false)} severity="error" variant="filled" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

type NovelFormProps = {
  title: string
  genre: string
  language: string
  styleProfile: string
  worldview: string
  powerSystem: string
  mainPlot: string
  writingRules: string
  forbiddenRules: string
  recentChapterCount: number
  onTitle: (v: string) => void
  onGenre: (v: string) => void
  onLanguage: (v: string) => void
  onStyleProfile: (v: string) => void
  onWorldview: (v: string) => void
  onPowerSystem: (v: string) => void
  onMainPlot: (v: string) => void
  onWritingRules: (v: string) => void
  onForbiddenRules: (v: string) => void
  onRecentChapterCount: (v: number) => void
}

function NovelForm(props: NovelFormProps) {
  return (
    <>
      <Accordion defaultExpanded disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Basic Info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Title" value={props.title} onChange={(e) => props.onTitle(e.target.value)} fullWidth required />
            <TextField label="Genre" value={props.genre} onChange={(e) => props.onGenre(e.target.value)} fullWidth />
            <TextField label="Language" value={props.language} onChange={(e) => props.onLanguage(e.target.value)} fullWidth />
            <TextField
              label="Recent Chapter Count"
              type="number"
              value={props.recentChapterCount}
              onChange={(e) => props.onRecentChapterCount(Number(e.target.value) || DEFAULT_RECENT_COUNT)}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Style Profile" value={props.styleProfile} onChange={(e) => props.onStyleProfile(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Worldview" value={props.worldview} onChange={(e) => props.onWorldview(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Power System" value={props.powerSystem} onChange={(e) => props.onPowerSystem(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Main Plot" value={props.mainPlot} onChange={(e) => props.onMainPlot(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="Writing Rules" value={props.writingRules} onChange={(e) => props.onWritingRules(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="Forbidden Rules" value={props.forbiddenRules} onChange={(e) => props.onForbiddenRules(e.target.value)} fullWidth multiline minRows={3} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </>
  )
}
