import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Character } from '../../api/characters'
import type { LoreEntry } from '../../api/loreEntries'
import type { Novel } from '../../api/novels'
import LoreEntryManager from './LoreEntryManager'

type Props = {
  token: string
  selectedNovel: Novel | null
  characters: Character[]
  loreEntries: LoreEntry[]
  loreLoading: boolean
  showLoreManager: boolean
  editingLoreEntry: LoreEntry | null
  onEditLoreEntry: (entry: LoreEntry) => void
  onDeleteLoreEntry: (id: number) => void
  onOpenCreateLoreEntry: () => void
  onDoneLoreEntryManager: () => void
  onNotifySuccess: (text: string) => void
  onNotifyError: (text: string) => void
}

const categoryLabelMap: Record<string, string> = {
  artifact: '法器',
  elixir: '丹药',
  formation: '阵法',
  technique: '功法',
  location: '地点',
  organization: '势力',
  other: '其他',
}

export default function NovelLoreEntriesSection({
  token,
  selectedNovel,
  characters,
  loreEntries,
  loreLoading,
  showLoreManager,
  editingLoreEntry,
  onEditLoreEntry,
  onDeleteLoreEntry,
  onOpenCreateLoreEntry,
  onDoneLoreEntryManager,
  onNotifySuccess,
  onNotifyError,
}: Props) {
  if (!selectedNovel) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">请先在“小说详情”中选择一本小说，再管理设定。</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>小说设定</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          当前小说：{selectedNovel.title}
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>当前设定</Typography>
        {loreLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
        ) : (
          !showLoreManager && (loreEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No lore entries yet.</Typography>
          ) : (
            <Stack spacing={1.2} sx={{ mb: 2 }}>
              {loreEntries.map((entry) => (
                <Box key={entry.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {categoryLabelMap[entry.category] ?? entry.category}
                      {entry.character_ids.length > 0 ? ` · 绑定人物 ${entry.character_ids.length} 人` : ' · 未绑定人物'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={() => onEditLoreEntry(entry)} disabled={loreLoading}><EditOutlinedIcon /></IconButton>
                    <IconButton onClick={() => onDeleteLoreEntry(entry.id)} disabled={loreLoading}><DeleteOutlineIcon /></IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ))
        )}

        {!showLoreManager ? (
          <Button variant="contained" onClick={onOpenCreateLoreEntry}>新增设定</Button>
        ) : (
          <LoreEntryManager
            token={token}
            novelId={selectedNovel.id}
            characters={characters}
            initialLoreEntry={editingLoreEntry}
            onNotifySuccess={onNotifySuccess}
            onNotifyError={onNotifyError}
            onDone={onDoneLoreEntryManager}
          />
        )}
      </CardContent>
    </Card>
  )
}
