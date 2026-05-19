import { Box, Button, Card, CardActionArea, CardContent, IconButton, Stack, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Novel } from '../../api/novels'
import NovelForm from './NovelForm'

type Props = {
  novels: Novel[]
  selectedNovelId: number | null
  selectedNovel: Novel | null
  showNovelEditor: boolean
  loading: boolean
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
  formatNovelMeta: (novel: Novel) => string
  onSelectNovel: (id: number) => void
  onEditNovel: (id: number) => void
  onDeleteNovel: (id: number) => void
  onHideEditor: () => void
  onUpdateNovel: () => void
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

export default function NovelDetailSection(props: Props) {
  const {
    novels,
    selectedNovelId,
    selectedNovel,
    showNovelEditor,
    loading,
    title,
    genre,
    language,
    styleProfile,
    worldview,
    powerSystem,
    mainPlot,
    writingRules,
    forbiddenRules,
    recentChapterCount,
    formatNovelMeta,
    onSelectNovel,
    onEditNovel,
    onDeleteNovel,
    onHideEditor,
    onUpdateNovel,
    onTitle,
    onGenre,
    onLanguage,
    onStyleProfile,
    onWorldview,
    onPowerSystem,
    onMainPlot,
    onWritingRules,
    onForbiddenRules,
    onRecentChapterCount,
  } = props

  return (
    <Stack spacing={2}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>My Novels</Typography>
          {novels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No novels yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {novels.map((novel) => (
                <Card key={novel.id} variant="outlined" sx={{ borderRadius: 2, borderColor: selectedNovelId === novel.id ? '#14b8a6' : '#e2e8f0' }}>
                  <CardActionArea onClick={() => onSelectNovel(novel.id)}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{novel.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatNovelMeta(novel)}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton onClick={(e) => { e.stopPropagation(); onEditNovel(novel.id) }}><EditOutlinedIcon /></IconButton>
                        <IconButton onClick={(e) => { e.stopPropagation(); onDeleteNovel(novel.id) }}><DeleteOutlineIcon /></IconButton>
                      </Stack>
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {selectedNovel && showNovelEditor && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Novel Detail Editor</Typography>
            <NovelForm
              title={title} genre={genre} language={language} styleProfile={styleProfile} worldview={worldview}
              powerSystem={powerSystem} mainPlot={mainPlot} writingRules={writingRules} forbiddenRules={forbiddenRules}
              recentChapterCount={recentChapterCount}
              onTitle={onTitle} onGenre={onGenre} onLanguage={onLanguage} onStyleProfile={onStyleProfile}
              onWorldview={onWorldview} onPowerSystem={onPowerSystem} onMainPlot={onMainPlot}
              onWritingRules={onWritingRules} onForbiddenRules={onForbiddenRules} onRecentChapterCount={onRecentChapterCount}
            />
            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" disabled={!title.trim() || loading} onClick={onUpdateNovel}>Update Novel</Button>
              <Button variant="outlined" onClick={onHideEditor} disabled={loading}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}
