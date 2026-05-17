import { MouseEvent, useEffect, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
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
import type { AuthUser } from '../api/auth'
import { createNovel, deleteNovel, listNovels, type Novel, updateNovel } from '../api/novels'

type Props = {
  token: string
  user: AuthUser
  onLogout: () => void
}

const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_RECENT_COUNT = 3

export default function NovelsPage({ token, user, onLogout }: Props) {
  const [novels, setNovels] = useState<Novel[]>([])
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
  const [editingNovelId, setEditingNovelId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  useEffect(() => {
    void refreshNovels()
  }, [])

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

  async function handleCreateOrUpdate() {
    if (!title.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    const payload = {
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
    try {
      if (editingNovelId) {
        const data = await updateNovel(token, editingNovelId, payload)
        setNovels((prev) => prev.map((n) => (n.id === editingNovelId ? data.novel : n)))
        setMessage('Novel updated.')
      } else {
        const data = await createNovel(token, payload)
        setNovels((prev) => [data.novel, ...prev])
        setMessage('Novel created.')
      }
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : editingNovelId ? 'Failed to update novel' : 'Failed to create novel')
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete novel')
    } finally {
      setLoading(false)
    }
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
    setEditingNovelId(null)
  }

  function startEdit(novel: Novel) {
    setEditingNovelId(novel.id)
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
    setMessage('')
    setError('')
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

        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editingNovelId ? 'Edit Novel' : 'Create Novel'}
            </Typography>

            <Accordion defaultExpanded disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>Basic Info</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
                  <TextField label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} fullWidth />
                  <TextField label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} fullWidth />
                  <TextField
                    label="Recent Chapter Count"
                    type="number"
                    value={recentChapterCount}
                    onChange={(e) => setRecentChapterCount(Number(e.target.value) || DEFAULT_RECENT_COUNT)}
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
                    value={styleProfile}
                    onChange={(e) => setStyleProfile(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Worldview"
                    value={worldview}
                    onChange={(e) => setWorldview(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Power System"
                    value={powerSystem}
                    onChange={(e) => setPowerSystem(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Main Plot"
                    value={mainPlot}
                    onChange={(e) => setMainPlot(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Writing Rules"
                    value={writingRules}
                    onChange={(e) => setWritingRules(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Forbidden Rules"
                    value={forbiddenRules}
                    onChange={(e) => setForbiddenRules(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" disabled={!title.trim() || loading} onClick={handleCreateOrUpdate}>
                {editingNovelId ? 'Update' : 'Create'}
              </Button>
              {editingNovelId && (
                <Button variant="outlined" onClick={resetForm} disabled={loading}>
                  Cancel
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

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
                  <Stack
                    key={novel.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5 }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{novel.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {novel.genre || 'No genre'} · {novel.language}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton aria-label="edit" onClick={() => startEdit(novel)} disabled={loading}>
                        <EditOutlinedIcon />
                      </IconButton>
                      <IconButton aria-label="delete" onClick={() => void handleDelete(novel.id)} disabled={loading}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
