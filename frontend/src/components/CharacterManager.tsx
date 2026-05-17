import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createCharacter, updateCharacter, type Character } from '../api/characters'

type Props = {
  token: string
  novelId: number
  initialCharacter?: Character | null
  onDone?: () => void
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

export default function CharacterManager({ token, novelId, initialCharacter, onDone }: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const canSubmit = useMemo(() => form.name.trim().length > 0 && !loading, [form.name, loading])

  useEffect(() => {
    if (!initialCharacter) {
      setForm(EMPTY_FORM)
      setEditingId(null)
      return
    }
    setEditingId(initialCharacter.id)
    setForm({
      name: initialCharacter.name,
      aliases: initialCharacter.aliases,
      role: initialCharacter.role,
      personality: initialCharacter.personality,
      realm_or_ability: initialCharacter.realm_or_ability,
      goal: initialCharacter.goal,
      relationships: initialCharacter.relationships,
      speech_style: initialCharacter.speech_style,
      first_appearance_chapter: initialCharacter.first_appearance_chapter,
      last_appearance_chapter: initialCharacter.last_appearance_chapter,
      memo: initialCharacter.memo,
    })
  }, [initialCharacter])

  async function submit() {
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (editingId) {
        await updateCharacter(token, novelId, editingId, form)
        setMessage('Character updated.')
      } else {
        await createCharacter(token, novelId, form)
        setMessage('Character created.')
      }
      resetForm()
      onDone?.()
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
            <Button variant="outlined" onClick={() => onDone?.()} disabled={loading}>
              Back
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      </CardContent>
    </Card>
  )
}
