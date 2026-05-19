import { Box, Button, Card, CardContent, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Novel } from '../../api/novels'
import type { Character } from '../../api/characters'
import CharacterManager from '../CharacterManager'

type Props = {
  token: string
  novels: Novel[]
  selectedNovelId: number | null
  selectedNovel: Novel | null
  characters: Character[]
  characterLoading: boolean
  showCharacterManager: boolean
  editingCharacter: Character | null
  onNovelChange: (id: number) => void
  onEditCharacter: (character: Character) => void
  onDeleteCharacter: (id: number) => void
  onOpenCreateCharacter: () => void
  onDoneCharacterManager: () => void
  onNotifySuccess: (text: string) => void
  onNotifyError: (text: string) => void
}

export default function NovelCharactersSection({
  token,
  novels,
  selectedNovelId,
  selectedNovel,
  characters,
  characterLoading,
  showCharacterManager,
  editingCharacter,
  onNovelChange,
  onEditCharacter,
  onDeleteCharacter,
  onOpenCreateCharacter,
  onDoneCharacterManager,
  onNotifySuccess,
  onNotifyError,
}: Props) {
  if (!selectedNovel) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">请先在“小说详情”中选择一本小说，再管理角色。</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>小说角色</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="character-novel-select">选择小说</InputLabel>
          <Select
            labelId="character-novel-select"
            label="选择小说"
            value={selectedNovelId ?? ''}
            onChange={(e) => onNovelChange(Number(e.target.value))}
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
                    <Typography variant="body2" color="text.secondary">{c.role || 'No role'} · Importance {c.importance_level}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={() => onEditCharacter(c)} disabled={characterLoading}><EditOutlinedIcon /></IconButton>
                    <IconButton onClick={() => onDeleteCharacter(c.id)} disabled={characterLoading}><DeleteOutlineIcon /></IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ))
        )}

        {!showCharacterManager ? (
          <Button variant="contained" onClick={onOpenCreateCharacter}>新增角色</Button>
        ) : (
          <CharacterManager
            token={token}
            novelId={selectedNovel.id}
            initialCharacter={editingCharacter}
            onNotifySuccess={onNotifySuccess}
            onNotifyError={onNotifyError}
            onDone={onDoneCharacterManager}
          />
        )}
      </CardContent>
    </Card>
  )
}
