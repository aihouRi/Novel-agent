import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Character } from '../api/characters'
import { createCharacter, deleteCharacter, listCharacters, updateCharacter } from '../api/characters'

type Props = {
  token: string
  novelId: number
}

const EMPTY_FORM = {
  name: '',
  aliases: '',
  role: '',
  personality: '',
  realm_or_ability: '',
  goal: '',
  relationships: '',
  speech_style: '',
  first_appearance_chapter: 0,
  last_appearance_chapter: 0,
  memo: '',
}

export default function CharacterManager({ token, novelId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const canSubmit = useMemo(() => form.name.trim().length > 0 && !loading, [form.name, loading])

  useEffect(() => {
    void refreshCharacters()
  }, [novelId])

  async function refreshCharacters() {
    setLoading(true)
    setError('')
    try {
      const data = await listCharacters(token, novelId)
      setCharacters(data.characters)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load characters')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (editingId) {
        const data = await updateCharacter(token, novelId, editingId, form)
        setCharacters((prev) => prev.map((c) => (c.id === editingId ? data.character : c)))
        setMessage('Character updated.')
      } else {
        const data = await createCharacter(token, novelId, form)
        setCharacters((prev) => [data.character, ...prev])
        setMessage('Character created.')
      }
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save character')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function startEdit(c: Character) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      aliases: c.aliases,
      role: c.role,
      personality: c.personality,
      realm_or_ability: c.realm_or_ability,
      goal: c.goal,
      relationships: c.relationships,
      speech_style: c.speech_style,
      first_appearance_chapter: c.first_appearance_chapter,
      last_appearance_chapter: c.last_appearance_chapter,
      memo: c.memo,
    })
    setError('')
    setMessage('')
  }

  function askDelete(id: number) {
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
      await deleteCharacter(token, novelId, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      if (editingId === id) resetForm()
      setMessage('Character deleted.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete character')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Character Manager
        </Typography>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label="Aliases" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
          <TextField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <TextField
            label="Personality"
            multiline
            minRows={2}
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
          />
          <TextField
            label="Realm / Ability"
            multiline
            minRows={2}
            value={form.realm_or_ability}
            onChange={(e) => setForm({ ...form, realm_or_ability: e.target.value })}
          />
          <TextField label="Goal" multiline minRows={2} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          <TextField
            label="Relationships"
            multiline
            minRows={2}
            value={form.relationships}
            onChange={(e) => setForm({ ...form, relationships: e.target.value })}
          />
          <TextField
            label="Speech Style"
            value={form.speech_style}
            onChange={(e) => setForm({ ...form, speech_style: e.target.value })}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="First Appearance Chapter"
              type="number"
              value={form.first_appearance_chapter}
              onChange={(e) => setForm({ ...form, first_appearance_chapter: Number(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Last Appearance Chapter"
              type="number"
              value={form.last_appearance_chapter}
              onChange={(e) => setForm({ ...form, last_appearance_chapter: Number(e.target.value) || 0 })}
              fullWidth
            />
          </Stack>
          <TextField label="Memo" multiline minRows={2} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" disabled={!canSubmit} onClick={() => void submit()}>
              {editingId ? 'Update Character' : 'Create Character'}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={resetForm} disabled={loading}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Characters
        </Typography>
        {characters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No characters yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {characters.map((c) => (
              <Box
                key={c.id}
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, display: 'flex', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.role || 'No role'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton onClick={() => startEdit(c)} disabled={loading}>
                    <EditOutlinedIcon />
                  </IconButton>
                  <IconButton onClick={() => askDelete(c.id)} disabled={loading}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        <Dialog open={confirmDeleteId !== null} onClose={closeDeleteDialog}>
          <DialogTitle>Delete Character</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this character? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog}>Cancel</Button>
            <Button color="error" variant="contained" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}
