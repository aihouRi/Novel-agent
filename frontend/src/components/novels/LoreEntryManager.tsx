import { Autocomplete, Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useMemo, useState } from 'react'
import type { Character } from '../../api/characters'
import {
  createLoreEntry,
  type LoreEntry,
  type LoreEntryCategory,
  type UpsertLoreEntryPayload,
  updateLoreEntry,
} from '../../api/loreEntries'

const CATEGORY_OPTIONS: { value: LoreEntryCategory; label: string }[] = [
  { value: 'artifact', label: '法器' },
  { value: 'elixir', label: '丹药' },
  { value: 'formation', label: '阵法' },
  { value: 'technique', label: '功法' },
  { value: 'location', label: '地点' },
  { value: 'organization', label: '势力' },
  { value: 'other', label: '其他' },
]

type Props = {
  token: string
  novelId: number
  characters: Character[]
  initialLoreEntry: LoreEntry | null
  onNotifySuccess: (text: string) => void
  onNotifyError: (text: string) => void
  onDone: () => void
}

export default function LoreEntryManager({
  token,
  novelId,
  characters,
  initialLoreEntry,
  onNotifySuccess,
  onNotifyError,
  onDone,
}: Props) {
  const [category, setCategory] = useState<LoreEntryCategory>(initialLoreEntry?.category ?? 'artifact')
  const [name, setName] = useState(initialLoreEntry?.name ?? '')
  const [description, setDescription] = useState(initialLoreEntry?.description ?? '')
  const [rulesOrLimits, setRulesOrLimits] = useState(initialLoreEntry?.rules_or_limits ?? '')
  const [tags, setTags] = useState(initialLoreEntry?.tags ?? '')
  const [selectedCharacterIDs, setSelectedCharacterIDs] = useState<number[]>(initialLoreEntry?.character_ids ?? [])
  const [loading, setLoading] = useState(false)

  const selectedCharacters = useMemo(
    () => characters.filter((c) => selectedCharacterIDs.includes(c.id)),
    [characters, selectedCharacterIDs],
  )

  async function handleSubmit() {
    if (!name.trim() || !description.trim()) return
    setLoading(true)
    try {
      const payload: UpsertLoreEntryPayload = {
        category,
        name: name.trim(),
        description: description.trim(),
        rules_or_limits: rulesOrLimits.trim(),
        tags: tags.trim(),
        character_ids: selectedCharacterIDs,
      }

      if (initialLoreEntry) {
        await updateLoreEntry(token, novelId, initialLoreEntry.id, payload)
        onNotifySuccess('设定已更新。')
      } else {
        await createLoreEntry(token, novelId, payload)
        onNotifySuccess('设定已创建。')
      }
      onDone()
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '保存设定失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, bgcolor: '#fcfcfd' }}>
      <Stack spacing={1.5}>
        <TextField select label="分类" value={category} onChange={(e) => setCategory(e.target.value as LoreEntryCategory)}>
          {CATEGORY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField label="名称" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="描述" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} />
        <TextField label="规则/限制" value={rulesOrLimits} onChange={(e) => setRulesOrLimits(e.target.value)} multiline minRows={2} />
        <TextField label="标签（逗号分隔）" value={tags} onChange={(e) => setTags(e.target.value)} />
        <Autocomplete
          multiple
          options={characters}
          getOptionLabel={(option) => option.name}
          value={selectedCharacters}
          onChange={(_, next) => setSelectedCharacterIDs(next.map((c) => c.id))}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="绑定人物（可选，多选）" placeholder="选择人物" />}
        />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => void handleSubmit()} disabled={loading || !name.trim() || !description.trim()}>
            {initialLoreEntry ? '更新设定' : '创建设定'}
          </Button>
          <Button variant="outlined" onClick={onDone} disabled={loading}>取消</Button>
        </Stack>
      </Stack>
    </Box>
  )
}
