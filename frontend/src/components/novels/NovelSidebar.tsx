import { Avatar, Box, Button, Card, CardContent, Collapse, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import type { Novel } from '../../api/novels'

export type MainTab = 'myNovels' | 'createNovel'
export type MyNovelTab = 'novelDetail' | 'novelCharacters' | 'novelLoreEntries' | 'novelChapters'

type Props = {
  userName: string
  novels: Novel[]
  selectedNovelId: number | null
  mainTab: MainTab
  myNovelsExpanded: boolean
  onToggleMyNovels: () => void
  onSelectNovel: (id: number) => void
  formatNovelMeta: (novel: Novel) => string
  onSelectCreateNovel: () => void
}

export default function NovelSidebar({
  userName,
  novels,
  selectedNovelId,
  mainTab,
  myNovelsExpanded,
  onToggleMyNovels,
  onSelectNovel,
  formatNovelMeta,
  onSelectCreateNovel,
}: Props) {
  return (
    <Card
      variant="outlined"
      sx={{ width: { xs: '100%', md: 300 }, borderRadius: 3, borderColor: 'rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.9)' }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: '#0f766e' }}>{userName.slice(0, 1).toUpperCase()}</Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Novel Agent</Typography>
            <Typography variant="body2" color="text.secondary">{userName}</Typography>
          </Box>
        </Stack>

        <Stack spacing={1}>
          <Button
            fullWidth
            startIcon={<LibraryBooksOutlinedIcon />}
            endIcon={myNovelsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={onToggleMyNovels}
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
              {novels.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 4.2, py: 0.5 }}>
                  暂无小说
                </Typography>
              ) : (
                novels.map((novel) => (
                  <Button
                    key={novel.id}
                    fullWidth
                    onClick={() => onSelectNovel(novel.id)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      pl: 4.2,
                      pr: 1.2,
                      py: 1,
                      color: selectedNovelId === novel.id ? '#ea580c' : '#111827',
                      bgcolor: selectedNovelId === novel.id ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                      fontWeight: selectedNovelId === novel.id ? 700 : 500,
                    }}
                  >
                    <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {novel.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNovelMeta(novel)}
                      </Typography>
                    </Box>
                  </Button>
                ))
              )}
            </Stack>
          </Collapse>

          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={onSelectCreateNovel}
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
  )
}
