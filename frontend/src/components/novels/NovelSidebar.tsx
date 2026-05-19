import { Avatar, Box, Button, Card, CardContent, Collapse, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'

export type MainTab = 'myNovels' | 'createNovel'
export type MyNovelTab = 'novelDetail' | 'novelCharacters' | 'novelLoreEntries' | 'novelChapters'

type Props = {
  userName: string
  mainTab: MainTab
  myNovelsExpanded: boolean
  myNovelTab: MyNovelTab
  onToggleMyNovels: () => void
  onSelectNovelDetail: () => void
  onSelectNovelCharacters: () => void
  onSelectNovelLoreEntries: () => void
  onSelectNovelChapters: () => void
  onSelectCreateNovel: () => void
}

export default function NovelSidebar({
  userName,
  mainTab,
  myNovelsExpanded,
  myNovelTab,
  onToggleMyNovels,
  onSelectNovelDetail,
  onSelectNovelCharacters,
  onSelectNovelLoreEntries,
  onSelectNovelChapters,
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
              <Button
                fullWidth
                onClick={onSelectNovelDetail}
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
                onClick={onSelectNovelCharacters}
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
                onClick={onSelectNovelLoreEntries}
                sx={{
                  justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2,
                  pl: 5.5, pr: 1.5, py: 1,
                  color: mainTab === 'myNovels' && myNovelTab === 'novelLoreEntries' ? '#ea580c' : '#111827',
                  bgcolor: mainTab === 'myNovels' && myNovelTab === 'novelLoreEntries' ? 'rgba(251, 146, 60, 0.14)' : 'transparent',
                  fontWeight: mainTab === 'myNovels' && myNovelTab === 'novelLoreEntries' ? 700 : 500,
                }}
              >
                小说设定
              </Button>
              <Button
                fullWidth
                onClick={onSelectNovelChapters}
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
