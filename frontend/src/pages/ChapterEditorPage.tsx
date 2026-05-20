import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Container, FormControl, IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import type { Chapter } from '../api/chapters'
import type { Character } from '../api/characters'
import type { LoreEntry } from '../api/loreEntries'
import type { Volume } from '../api/volumes'
import EditorActionButtons from '../components/chapter-editor/EditorActionButtons'
import { useChapterEditor } from '../hooks/useChapterEditor'

type Props = {
  token: string
  novelId: number
  novelTitle: string
  volumes: Volume[]
  characters: Character[]
  loreEntries: LoreEntry[]
  initialChapter?: Chapter | null
  defaultChapterNumber?: number
  onBack: () => void
  onNotifySuccess: (msg: string) => void
  onNotifyError: (msg: string) => void
  onSaved: () => Promise<void> | void
}

export default function ChapterEditorPage({
  token,
  novelId,
  novelTitle,
  initialChapter,
  defaultChapterNumber = 1,
  volumes,
  characters,
  loreEntries,
  onBack,
  onNotifySuccess,
  onNotifyError,
  onSaved,
}: Props) {
  const loreCategoryLabelMap: Record<string, string> = {
    artifact: '法器',
    elixir: '丹药',
    formation: '阵法',
    technique: '功法',
    location: '地点',
    organization: '势力',
    other: '其他',
  }

  const editor = useChapterEditor({
    token,
    novelId,
    initialChapter,
    defaultChapterNumber,
    volumes,
    characters,
    loreEntries,
    onNotifySuccess,
    onNotifyError,
    onSaved,
    onBack,
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 3,
        background:
          'radial-gradient(circle at top, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0) 45%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 2,
            px: { xs: 1, md: 0 },
            py: 1.2,
            borderBottom: '1px solid #e5e7eb',
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(2px)',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
              <IconButton
                onClick={onBack}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  '&:hover': { bgcolor: '#e5e7eb' },
                }}
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {novelTitle}
                </Typography>
                <Stack direction="row" spacing={1.2} sx={{ color: '#9ca3af', mt: 0.25 }}>
                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <TaskAltRoundedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">已保存到云端</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">正文 {editor.chapterWordCount} 字</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            <EditorActionButtons
              onBack={onBack}
              onGenerate={() => void editor.handleGenerate()}
              onSave={() => void editor.handleSave()}
              generating={editor.generating}
              saving={editor.saving}
              chapterNumber={editor.chapterNumber}
              volumeID={editor.volumeID}
              isEdit={editor.isEdit}
            />
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
          {editor.generating && (
            <Alert
              severity="info"
              icon={<CircularProgress size={18} />}
              sx={{ mb: 1.5, borderRadius: 2 }}
            >
              正在生成章节内容，请稍候...
            </Alert>
          )}

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
                <Box sx={{ flex: editor.sidePanel ? 5 : 1, display: 'flex', justifyContent: 'center' }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      width: '100%',
                      maxWidth: 900,
                      transition: 'all 220ms ease',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                          <FormControl sx={{ width: { xs: '100%', sm: 220 } }}>
                            <InputLabel id="chapter-volume-select">分卷</InputLabel>
                            <Select
                              labelId="chapter-volume-select"
                              label="分卷"
                              value={editor.volumeID}
                              onChange={(e) => editor.setVolumeID(Number(e.target.value))}
                            >
                              {volumes.map((v) => (
                                <MenuItem key={v.id} value={v.id}>
                                  第{v.volume_number}卷：{v.title}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            label="章节编号"
                            type="number"
                            value={editor.chapterNumber}
                            onChange={(e) => editor.setChapterNumber(Number(e.target.value) || 0)}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                          />
                          <TextField
                            label="章节标题"
                            value={editor.chapterTitle}
                            onChange={(e) => editor.setChapterTitle(e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="字数（自动）"
                            type="number"
                            value={editor.chapterWordCount}
                            InputProps={{ readOnly: true }}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                          />
                        </Stack>

                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <TextField
                              label="正文"
                              multiline
                              minRows={26}
                              value={editor.chapterBody}
                              onChange={(e) => editor.setChapterBody(e.target.value)}
                              onKeyDown={editor.handleBodyKeyDown}
                              onPaste={editor.handleBodyPaste}
                              onCopy={editor.handleBodyCopy}
                              onCut={editor.handleBodyCut}
                              onBlur={() => editor.setChapterBody((prev) => editor.ensureIndentedBody(prev))}
                              fullWidth
                            />
                          </CardContent>
                        </Card>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {editor.sidePanel && (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      flex: 2,
                      transition: 'all 220ms ease',
                      bgcolor: 'rgba(255,255,255,0.98)',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {editor.sidePanel === 'summary' && '章节总结'}
                          {editor.sidePanel === 'outline' && '章节大纲'}
                          {editor.sidePanel === 'instruction' && '生成指令'}
                        </Typography>
                        <IconButton size="small" onClick={() => editor.setSidePanel(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      {editor.sidePanel === 'summary' && (
                        <TextField label="章节总结" multiline minRows={24} value={editor.chapterSummary} onChange={(e) => editor.setChapterSummary(e.target.value)} fullWidth />
                      )}
                      {editor.sidePanel === 'outline' && (
                        <TextField label="章节大纲" multiline minRows={24} value={editor.chapterOutline} onChange={(e) => editor.setChapterOutline(e.target.value)} fullWidth />
                      )}
                      {editor.sidePanel === 'instruction' && (
                        <Stack spacing={1.5}>
                          <Autocomplete
                            multiple
                            options={editor.groupedCharacterOptions}
                            groupBy={(option) => option.group}
                            value={editor.selectedCharacters}
                            onChange={(_, next) => editor.setSelectedCharacterIDs(next.map((c) => c.id))}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            filterOptions={(options, state) => {
                              const keyword = state.inputValue.trim().toLowerCase()
                              if (!keyword) return options
                              return options.filter((o) =>
                                o.name.toLowerCase().includes(keyword) ||
                                o.aliases.toLowerCase().includes(keyword) ||
                                o.role.toLowerCase().includes(keyword),
                              )
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="本章登场人物（可选）" placeholder="搜索姓名/别名/身份" />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {option.role || '无身份'}{option.aliases ? ` · 别名：${option.aliases}` : ''}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                          <Autocomplete
                            multiple
                            options={loreEntries}
                            value={editor.selectedLoreEntries}
                            onChange={(_, next) => editor.setSelectedLoreEntryIDs(next.map((e) => e.id))}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                              <TextField {...params} label="本章相关设定（可选）" placeholder="选择法器/丹药/阵法等" />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {loreCategoryLabelMap[option.category] ?? option.category}{option.tags ? ` · ${option.tags}` : ''}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                          <TextField label="生成指令" multiline minRows={20} value={editor.chapterInstruction} onChange={(e) => editor.setChapterInstruction(e.target.value)} fullWidth />
                          <Button
                            variant="outlined"
                            onClick={() => void editor.retryGenerate()}
                            disabled={editor.generating || !editor.chapterInstruction.trim() || editor.volumeID <= 0 || editor.chapterNumber <= 0}
                          >
                            重试生成
                          </Button>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>

            <Stack
              spacing={1}
              sx={{
                width: 110,
                flexShrink: 0,
                position: { lg: 'sticky' },
                top: { lg: 110 },
              }}
            >
              <Button
                variant={editor.sidePanel === 'summary' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'summary' ? null : 'summary'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'summary' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'summary' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'summary' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'summary' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'summary' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                总结
              </Button>
              <Button
                variant={editor.sidePanel === 'outline' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'outline' ? null : 'outline'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'outline' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'outline' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'outline' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'outline' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'outline' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                大纲
              </Button>
              <Button
                variant={editor.sidePanel === 'instruction' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'instruction' ? null : 'instruction'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'instruction' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'instruction' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'instruction' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'instruction' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'instruction' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                指令
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            bgcolor: 'rgba(255,255,255,0.95)',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            px: 2,
            py: 1,
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          }}
        >
          <EditorActionButtons
            onBack={onBack}
            onGenerate={() => void editor.handleGenerate()}
            onSave={() => void editor.handleSave()}
            generating={editor.generating}
            saving={editor.saving}
            chapterNumber={editor.chapterNumber}
            volumeID={editor.volumeID}
            isEdit={editor.isEdit}
            compact
          />
        </Box>

        <Snackbar open={Boolean(editor.localSuccess)} autoHideDuration={2400} onClose={() => editor.setLocalSuccess('')}>
          <Alert severity="success" onClose={() => editor.setLocalSuccess('')} sx={{ width: '100%' }}>
            {editor.localSuccess}
          </Alert>
        </Snackbar>
        <Snackbar open={Boolean(editor.localError)} autoHideDuration={3200} onClose={() => editor.setLocalError('')}>
          <Alert
            severity="error"
            onClose={() => editor.setLocalError('')}
            sx={{ width: '100%' }}
            action={editor.canRetryGenerate ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => void editor.retryGenerate()}
                disabled={editor.generating || !editor.chapterInstruction.trim() || editor.volumeID <= 0 || editor.chapterNumber <= 0}
              >
                重试
              </Button>
            ) : undefined}
          >
            {editor.localError}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
