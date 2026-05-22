import { Box, Button, Card, CardContent, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Novel } from '../../api/novels'
import type { Chapter, ExportScope } from '../../api/chapters'
import type { Character } from '../../api/characters'
import type { Volume } from '../../api/volumes'

type SortType = 'number_asc' | 'number_desc' | 'updated_desc'

type GroupedChapter = {
  volume: Volume
  chapters: Chapter[]
}

type Props = {
  selectedNovel: Novel | null
  novelTotalWordCount: number
  exportingMarkdown: boolean
  volumes: Volume[]
  newVolumeTitle: string
  chapterSearch: string
  chapterSort: SortType
  chapterVolumeFilter: number
  chapterCharacterFilter: number
  chapterStatusFilter: 'all' | 'draft' | 'review' | 'final'
  chapterCharacterOptions: Character[]
  chapterLoading: boolean
  visibleChapters: Chapter[]
  groupedChapters: GroupedChapter[]
  movingChapterId: number | null
  onOpenExport: () => void
  onNewVolumeTitleChange: (value: string) => void
  onCreateVolume: () => void
  onChapterSearchChange: (value: string) => void
  onChapterSortChange: (value: SortType) => void
  onChapterVolumeFilterChange: (value: number) => void
  onChapterCharacterFilterChange: (value: number) => void
  onChapterStatusFilterChange: (value: 'all' | 'draft' | 'review' | 'final') => void
  onMoveChapterVolume: (chapter: Chapter, nextVolumeID: number) => void
  onUpdateChapterStatus: (chapter: Chapter, status: 'draft' | 'review' | 'final') => void
  onEditChapter: (chapter: Chapter) => void
  onDeleteChapter: (id: number) => void
  onCreateChapter: () => void
  onEditVolume: (volume: Volume) => void
}

export default function NovelChaptersSection({
  selectedNovel,
  novelTotalWordCount,
  exportingMarkdown,
  volumes,
  newVolumeTitle,
  chapterSearch,
  chapterSort,
  chapterVolumeFilter,
  chapterCharacterFilter,
  chapterStatusFilter,
  chapterCharacterOptions,
  chapterLoading,
  visibleChapters,
  groupedChapters,
  movingChapterId,
  onOpenExport,
  onNewVolumeTitleChange,
  onCreateVolume,
  onChapterSearchChange,
  onChapterSortChange,
  onChapterVolumeFilterChange,
  onChapterCharacterFilterChange,
  onChapterStatusFilterChange,
  onMoveChapterVolume,
  onUpdateChapterStatus,
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          当前小说：{selectedNovel.title}
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>当前章节</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>小说总字数：{novelTotalWordCount.toLocaleString()} 字</Typography>
        <Button variant="outlined" sx={{ mb: 1.5 }} onClick={onOpenExport} disabled={exportingMarkdown || volumes.length === 0}>导出</Button>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="新分卷名" value={newVolumeTitle} onChange={(e) => onNewVolumeTitleChange(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={onCreateVolume} disabled={!newVolumeTitle.trim()}>新建分卷</Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField label="搜索章节（编号/标题/正文）" value={chapterSearch} onChange={(e) => onChapterSearchChange(e.target.value)} fullWidth />
          <FormControl sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel id="chapter-sort-select">排序</InputLabel>
            <Select labelId="chapter-sort-select" label="排序" value={chapterSort} onChange={(e) => onChapterSortChange(e.target.value as SortType)}>
              <MenuItem value="number_desc">章节号（新到旧）</MenuItem>
              <MenuItem value="number_asc">章节号（旧到新）</MenuItem>
              <MenuItem value="updated_desc">最近更新</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel id="chapter-volume-filter-select">筛选分卷</InputLabel>
            <Select
              labelId="chapter-volume-filter-select"
              label="筛选分卷"
              value={chapterVolumeFilter}
              onChange={(e) => onChapterVolumeFilterChange(Number(e.target.value))}
            >
              <MenuItem value={0}>全部分卷</MenuItem>
              {volumes.map((v) => (
                <MenuItem key={v.id} value={v.id}>第{v.volume_number}卷：{v.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', md: 240 } }}>
            <InputLabel id="chapter-character-filter-select">筛选角色</InputLabel>
            <Select
              labelId="chapter-character-filter-select"
              label="筛选角色"
              value={chapterCharacterFilter}
              onChange={(e) => onChapterCharacterFilterChange(Number(e.target.value))}
            >
              <MenuItem value={0}>全部角色</MenuItem>
              {chapterCharacterOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel id="chapter-status-filter-select">筛选状态</InputLabel>
            <Select
              labelId="chapter-status-filter-select"
              label="筛选状态"
              value={chapterStatusFilter}
              onChange={(e) => onChapterStatusFilterChange(e.target.value as 'all' | 'draft' | 'review' | 'final')}
            >
              <MenuItem value="all">全部状态</MenuItem>
              <MenuItem value="draft">草稿</MenuItem>
              <MenuItem value="review">待审</MenuItem>
              <MenuItem value="final">定稿</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {chapterLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>加载中...</Typography>
        ) : visibleChapters.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>暂无章节。</Typography>
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
                              <Typography sx={{ fontWeight: 600 }}>第 {c.chapter_number} 章 · {c.title || '未命名'}</Typography>
                              <Typography variant="body2" color="text.secondary">{c.word_count} 字 · {c.summary.trim() ? '有总结' : '无总结'} · 状态：{formatStatusLabel(c.status)} · 更新于 {new Date(c.updated_at).toLocaleString()}</Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <FormControl size="small" sx={{ minWidth: 110 }}>
                                <Select value={c.status} onChange={(e) => onUpdateChapterStatus(c, e.target.value as 'draft' | 'review' | 'final')} disabled={movingChapterId === c.id}>
                                  <MenuItem value="draft">草稿</MenuItem>
                                  <MenuItem value="review">待审</MenuItem>
                                  <MenuItem value="final">定稿</MenuItem>
                                </Select>
                              </FormControl>
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

function formatStatusLabel(status: 'draft' | 'review' | 'final') {
  if (status === 'review') return '待审'
  if (status === 'final') return '定稿'
  return '草稿'
}
