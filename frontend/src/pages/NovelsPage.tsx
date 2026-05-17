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
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import type { AuthUser } from '../api/auth'
import { createNovel, deleteNovel, listNovels, type Novel, updateNovel } from '../api/novels'

type Props = {
  token: string
  user: AuthUser
  onLogout: () => void
}

type ViewMode = 'list' | 'create' | 'detail'

const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_RECENT_COUNT = 3

export default function NovelsPage({ token, user, onLogout }: Props) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [mode, setMode] = useState<ViewMode>('list')
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)

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
  const [message, setMessage] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const selectedNovel = useMemo(
    () => novels.find((n) => n.id === selectedNovelId) ?? null,
    [novels, selectedNovelId],
  )

  useEffect(() => {
    void refreshNovels()
  }, [])

  useEffect(() => {
    if (mode === 'detail' && selectedNovel) {
      fillForm(selectedNovel)
    }
  }, [mode, selectedNovelId, novels])

  async function refreshNovels() {
    setLoading(true)
    setError('')
    try {
      const data = await listNovels(token)
      setNovels(data.novels)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load novels')
    } finally {
      setLoading(false)
    }
  }

  function openList() {
    setMode('list')
    setSelectedNovelId(null)
    setError('')
  }

  function openCreate() {
    setMode('create')
    setSelectedNovelId(null)
    resetForm()
    setError('')
    setMessage('')
  }

  function openDetail(novel: Novel) {
    setMode('detail')
    setSelectedNovelId(novel.id)
    fillForm(novel)
    setError('')
    setMessage('')
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
      setMessage('Novel created.')
      openDetail(data.novel)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create novel')
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
      setMessage('Novel updated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update novel')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await deleteNovel(token, id)
      setNovels((prev) => prev.filter((n) => n.id !== id))
      setMessage('Novel deleted.')
      if (selectedNovelId === id) {
        openList()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete novel')
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
    await handleDelete(id)
  }

  function openMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchor(event.currentTarget)
  }

  function closeMenu() {
    setMenuAnchor(null)
  }

  function clickSettings() {
    closeMenu()
    setMessage('User settings will be available in a later phase.')
    setError('')
  }

  function clickLogout() {
    closeMenu()
    onLogout()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at top, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0) 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ position: 'relative', mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Novel Agent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user.name}
          </Typography>

          <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
            <IconButton
              onClick={openMenu}
              sx={{ border: '1px solid #cbd5e1', borderRadius: 999, p: 0.5, bgcolor: 'white' }}
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f766e', fontSize: 16, fontWeight: 700 }}>
                {user.name.slice(0, 1).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
              <MenuItem onClick={clickSettings}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                User Settings (Soon)
              </MenuItem>
              <MenuItem onClick={clickLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant={mode === 'list' ? 'contained' : 'outlined'} onClick={openList}>
            我的小说
          </Button>
          <Button variant={mode === 'create' ? 'contained' : 'outlined'} onClick={openCreate}>
            新建小说
          </Button>
        </Stack>

        {mode === 'create' && (
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Create Novel
              </Typography>
              <NovelForm
                title={title}
                genre={genre}
                language={language}
                styleProfile={styleProfile}
                worldview={worldview}
                powerSystem={powerSystem}
                mainPlot={mainPlot}
                writingRules={writingRules}
                forbiddenRules={forbiddenRules}
                recentChapterCount={recentChapterCount}
                onTitle={setTitle}
                onGenre={setGenre}
                onLanguage={setLanguage}
                onStyleProfile={setStyleProfile}
                onWorldview={setWorldview}
                onPowerSystem={setPowerSystem}
                onMainPlot={setMainPlot}
                onWritingRules={setWritingRules}
                onForbiddenRules={setForbiddenRules}
                onRecentChapterCount={setRecentChapterCount}
              />
              <Button sx={{ mt: 2 }} variant="contained" disabled={!title.trim() || loading} onClick={handleCreate}>
                Create
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === 'detail' && selectedNovel && (
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <IconButton onClick={openList}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Novel Detail</Typography>
              </Stack>

              <NovelForm
                title={title}
                genre={genre}
                language={language}
                styleProfile={styleProfile}
                worldview={worldview}
                powerSystem={powerSystem}
                mainPlot={mainPlot}
                writingRules={writingRules}
                forbiddenRules={forbiddenRules}
                recentChapterCount={recentChapterCount}
                onTitle={setTitle}
                onGenre={setGenre}
                onLanguage={setLanguage}
                onStyleProfile={setStyleProfile}
                onWorldview={setWorldview}
                onPowerSystem={setPowerSystem}
                onMainPlot={setMainPlot}
                onWritingRules={setWritingRules}
                onForbiddenRules={setForbiddenRules}
                onRecentChapterCount={setRecentChapterCount}
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <Button variant="contained" disabled={!title.trim() || loading} onClick={handleUpdate}>
                  Update
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {mode === 'list' && (
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                My Novels
              </Typography>
              {novels.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No novels yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {novels.map((novel) => (
                    <Card key={novel.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardActionArea onClick={() => openDetail(novel)}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{novel.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {novel.genre || 'No genre'} · {novel.language}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              aria-label="edit"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDetail(novel)
                              }}
                              disabled={loading}
                            >
                              <EditOutlinedIcon />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              onClick={(e) => {
                                e.stopPropagation()
                                requestDelete(novel.id)
                              }}
                              disabled={loading}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={confirmDeleteId !== null} onClose={closeDeleteDialog}>
          <DialogTitle>Delete Novel</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this novel? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog}>Cancel</Button>
            <Button onClick={() => void confirmDelete()} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
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
            <TextField
              label="Style Profile"
              value={props.styleProfile}
              onChange={(e) => props.onStyleProfile(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Worldview"
              value={props.worldview}
              onChange={(e) => props.onWorldview(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Power System"
              value={props.powerSystem}
              onChange={(e) => props.onPowerSystem(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Main Plot"
              value={props.mainPlot}
              onChange={(e) => props.onMainPlot(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="Writing Rules"
              value={props.writingRules}
              onChange={(e) => props.onWritingRules(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="Forbidden Rules"
              value={props.forbiddenRules}
              onChange={(e) => props.onForbiddenRules(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </>
  )
}
