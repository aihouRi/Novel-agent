import { useEffect, useMemo, useState } from 'react'
import {
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
  onNotifySuccess?: (msg: string) => void
  onNotifyError?: (msg: string) => void
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
  importance_level: 0,
}

export default function CharacterManager({ token, novelId, initialCharacter, onNotifySuccess, onNotifyError, onDone }: Props) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

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
      importance_level: initialCharacter.importance_level,
    })
  }, [initialCharacter])

  async function submit() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      if (editingId) {
        await updateCharacter(token, novelId, editingId, form)
        onNotifySuccess?.('角色已更新。')
      } else {
        await createCharacter(token, novelId, form)
        onNotifySuccess?.('角色已创建。')
      }
      resetForm()
      onDone?.()
    } catch (e) {
      onNotifyError?.(e instanceof Error ? e.message : '保存角色失败')
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
          角色管理
        </Typography>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label="别名" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
          <TextField label="身份" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <TextField
            label="性格"
            multiline
            minRows={2}
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
          />
          <TextField
            label="境界 / 能力"
            multiline
            minRows={2}
            value={form.realm_or_ability}
            onChange={(e) => setForm({ ...form, realm_or_ability: e.target.value })}
          />
          <TextField label="目标" multiline minRows={2} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          <TextField
            label="关系"
            multiline
            minRows={2}
            value={form.relationships}
            onChange={(e) => setForm({ ...form, relationships: e.target.value })}
          />
          <TextField
            label="说话风格"
            value={form.speech_style}
            onChange={(e) => setForm({ ...form, speech_style: e.target.value })}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="首次登场章节"
              type="number"
              value={form.first_appearance_chapter}
              onChange={(e) => setForm({ ...form, first_appearance_chapter: Number(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="最近登场章节"
              type="number"
              value={form.last_appearance_chapter}
              onChange={(e) => setForm({ ...form, last_appearance_chapter: Number(e.target.value) || 0 })}
              fullWidth
            />
          </Stack>
          <TextField label="备注" multiline minRows={2} value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
          <TextField
            label="重要度（0-9，7及以上不可删）"
            type="number"
            value={form.importance_level}
            onChange={(e) => {
              const next = Number(e.target.value)
              setForm({ ...form, importance_level: Number.isNaN(next) ? 0 : next })
            }}
            inputProps={{ min: 0, max: 9 }}
          />
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" disabled={!canSubmit} onClick={() => void submit()}>
              {editingId ? '更新角色' : '创建角色'}
            </Button>
            <Button variant="outlined" onClick={() => onDone?.()} disabled={loading}>
              返回
            </Button>
          </Stack>
        </Stack>

      </CardContent>
    </Card>
  )
}
