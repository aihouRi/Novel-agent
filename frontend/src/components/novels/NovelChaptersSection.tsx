import { Box, Button, Card, CardContent, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Novel } from '../../api/novels'
import type { Chapter, ExportScope } from '../../api/chapters'
import type { Volume } from '../../api/volumes'

type SortType = 'number_asc' | 'number_desc' | 'updated_desc'

type GroupedChapter = {
  volume: Volume
  chapters: Chapter[]
}

type Props = {
  novels: Novel[]
  selectedNovelId: number | null
  selectedNovel: Novel | null
  novelTotalWordCount: number
  exportingMarkdown: boolean
  volumes: Volume[]
  newVolumeTitle: string
  chapterSearch: string
  chapterSort: SortType
  chapterLoading: boolean
  visibleChapters: Chapter[]
  groupedChapters: GroupedChapter[]
  movingChapterId: number | null
  onNovelChange: (id: number) => void
  onOpenExport: () => void
  onNewVolumeTitleChange: (value: string) => void
  onCreateVolume: () => void
  onChapterSearchChange: (value: string) => void
  onChapterSortChange: (value: SortType) => void
  onMoveChapterVolume: (chapter: Chapter, nextVolumeID: number) => void
  onEditChapter: (chapter: Chapter) => void
  onDeleteChapter: (id: number) => void
  onCreateChapter: () => void
  onEditVolume: (volume: Volume) => void
}

export default function NovelChaptersSection({
  novels,
  selectedNovelId,
  selectedNovel,
  novelTotalWordCount,
  exportingMarkdown,
  volumes,
  newVolumeTitle,
  chapterSearch,
  chapterSort,
  chapterLoading,
  visibleChapters,
  groupedChapters,
  movingChapterId,
  onNovelChange,
  onOpenExport,
  onNewVolumeTitleChange,
  onCreateVolume,
  onChapterSearchChange,
  onChapterSortChange,
  onMoveChapterVolume,
  onEditChapter,
  onDeleteChapter,
  onCreateChapter,
  onEditVolume,
}: Props) {
  if (!selectedNovel) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">请先在“小说详情”中选择一本小说，再管理章节。</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>小说章节</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="chapter-novel-select">选择小说</InputLabel>
          <Select
            labelId="chapter-novel-select"
            label="选择小说"
            value={selectedNovelId ?? ''}
            onChange={(e) => onNovelChange(Number(e.target.value))}
          >
            {novels.map((n) => (
              <MenuItem key={n.id} value={n.id}>{n.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>当前章节</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>小说总字数：{novelTotalWordCount.toLocaleString()} 字</Typography>
        <Button variant="outlined" sx={{ mb: 1.5 }} onClick={onOpenExport} disabled={exportingMarkdown || volumes.length === 0}>导出</Button>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="新分卷名" value={newVolumeTitle} onChange={(e) => onNewVolumeTitleChange(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={onCreateVolume} disabled={!newVolumeTitle.trim()}>新建分卷</Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="搜索章节（编号/标题）" value={chapterSearch} onChange={(e) => onChapterSearchChange(e.target.value)} fullWidth />
          <FormControl sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel id="chapter-sort-select">排序</InputLabel>
            <Select labelId="chapter-sort-select" label="排序" value={chapterSort} onChange={(e) => onChapterSortChange(e.target.value as SortType)}>
              <MenuItem value="number_desc">章节号（新到旧）</MenuItem>
              <MenuItem value="number_asc">章节号（旧到新）</MenuItem>
              <MenuItem value="updated_desc">最近更新</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {chapterLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
        ) : visibleChapters.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No chapters yet.</Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {groupedChapters.map(({ volume, chapters: volumeChapters }) => {
              const volumeWordCount = volumeChapters.reduce((sum, c) => sum + (Number.isFinite(c.word_count) ? c.word_count : 0), 0)
              return (
                <Card key={volume.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>第{volume.volume_number}卷：{volume.title}（{volumeChapters.length}章 / {volumeWordCount.toLocaleString()}字）</Typography>
                      <IconButton size="small" onClick={() => onEditVolume(volume)}><EditOutlinedIcon fontSize="small" /></IconButton>
                    </Stack>
                    {volumeChapters.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">该分卷暂无章节</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {volumeChapters.map((c) => (
                          <Box key={c.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>第 {c.chapter_number} 章 · {c.title || 'Untitled'}</Typography>
                              <Typography variant="body2" color="text.secondary">{c.word_count} 字 · {c.summary.trim() ? '有总结' : '无总结'} · 更新于 {new Date(c.updated_at).toLocaleString()}</Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select value={c.volume_id} onChange={(e) => onMoveChapterVolume(c, Number(e.target.value))} disabled={movingChapterId === c.id}>
                                  {volumes.map((v) => (
                                    <MenuItem key={v.id} value={v.id}>第{v.volume_number}卷：{v.title}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <IconButton disabled={movingChapterId === c.id} onClick={() => onEditChapter(c)}><EditOutlinedIcon /></IconButton>
                              <IconButton disabled={movingChapterId === c.id} onClick={() => onDeleteChapter(c.id)}><DeleteOutlineIcon /></IconButton>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}

        <Button variant="contained" disabled={volumes.length === 0} onClick={onCreateChapter}>新增章节</Button>
        {volumes.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>请先创建分卷（必须填写卷名），再创建章节。</Typography>
        )}
      </CardContent>
    </Card>
  )
}
