import { Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { useMemo, useState } from 'react'
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
  recentChapterCountDefault: number
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
  recentChapterCountDefault,
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
    recentChapterCountDefault,
    onNotifySuccess,
    onNotifyError,
    onSaved,
    onBack,
  })
  const [pendingHistoryIndex, setPendingHistoryIndex] = useState<number | null>(null)
  const pendingHistoryItem = useMemo(
    () => (pendingHistoryIndex === null ? null : editor.generateHistory[pendingHistoryIndex] ?? null),
    [editor.generateHistory, pendingHistoryIndex],
  )

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
                          {editor.sidePanel === 'history' && '生成历史'}
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
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <FormControl sx={{ minWidth: 200 }}>
                              <InputLabel id="generate-template-select">生成模板</InputLabel>
                              <Select
                                labelId="generate-template-select"
                                label="生成模板"
                                value={editor.selectedTemplateId}
                                onChange={(e) => editor.applyTemplate(String(e.target.value))}
                              >
                                <MenuItem value="">不使用模板</MenuItem>
                                {editor.generateTemplates.map((tpl) => (
                                  <MenuItem key={tpl.id} value={tpl.id}>{tpl.label}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Button
                              variant="outlined"
                              disabled={!editor.selectedTemplateId}
                              onClick={() => editor.applyTemplate(editor.selectedTemplateId)}
                            >
                              重新套用
                            </Button>
                          </Stack>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <TextField
                              label="最近章节参考数"
                              type="number"
                              value={editor.recentChapterCount}
                              onChange={(e) => editor.setRecentChapterCount(Math.max(1, Number(e.target.value) || 1))}
                              sx={{ flex: 1 }}
                              inputProps={{ min: 1, max: 20 }}
                            />
                            <TextField
                              label="目标字数下限"
                              type="number"
                              value={editor.targetWordMin}
                              onChange={(e) => editor.setTargetWordMin(Math.max(0, Number(e.target.value) || 0))}
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="目标字数上限"
                              type="number"
                              value={editor.targetWordMax}
                              onChange={(e) => editor.setTargetWordMax(Math.max(0, Number(e.target.value) || 0))}
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                          <Stack spacing={0}>
                            <FormControlLabel
                              control={<Checkbox checked={editor.avoidTranslationTone} onChange={(e) => editor.setAvoidTranslationTone(e.target.checked)} />}
                              label="避免翻译腔"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.avoidModernSlang} onChange={(e) => editor.setAvoidModernSlang(e.target.checked)} />}
                              label="避免现代网络口语"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.keepPovConsistent} onChange={(e) => editor.setKeepPovConsistent(e.target.checked)} />}
                              label="保持叙事视角一致"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={editor.keepTenseConsistent} onChange={(e) => editor.setKeepTenseConsistent(e.target.checked)} />}
                              label="保持时态一致"
                            />
                          </Stack>
                          <Button
                            variant="outlined"
                            onClick={() => void editor.retryGenerate()}
                            disabled={
                              editor.generating ||
                              !editor.chapterInstruction.trim() ||
                              editor.volumeID <= 0 ||
                              editor.chapterNumber <= 0 ||
                              (editor.targetWordMin > 0 && editor.targetWordMax > 0 && editor.targetWordMin > editor.targetWordMax)
                            }
                          >
                            重试生成
                          </Button>
                        </Stack>
                      )}
                      {editor.sidePanel === 'history' && (
                        <Stack spacing={1}>
                          {editor.generateHistory.length === 0 && (
                            <Typography variant="body2" color="text.secondary">暂无历史生成记录。</Typography>
                          )}
                          {editor.generateHistory.map((item, idx) => (
                            <Card key={`${item.createdAt}_${idx}`} variant="outlined" sx={{ borderRadius: 2 }}>
                              <CardContent sx={{ py: 1.5 }}>
                                <Stack spacing={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                                    {item.model ? ` · ${item.model}` : ''}
                                    {item.totalTokens ? ` · ${item.totalTokens} tokens` : ''}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#475569' }}>
                                    指令：{item.instructionPreview || '（无）'}
                                  </Typography>
                                  <Button size="small" variant="outlined" onClick={() => setPendingHistoryIndex(idx)}>
                                    回填此版本
                                  </Button>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
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
              <Button
                variant={editor.sidePanel === 'history' ? 'contained' : 'outlined'}
                onClick={() => editor.setSidePanel((p) => (p === 'history' ? null : 'history'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: editor.sidePanel === 'history' ? '#ffffff' : '#374151',
                  bgcolor: editor.sidePanel === 'history' ? '#0f766e' : '#f8fafc',
                  borderColor: editor.sidePanel === 'history' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: editor.sidePanel === 'history' ? '#0d9488' : '#eef2f7',
                    borderColor: editor.sidePanel === 'history' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                历史
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

        <Dialog open={pendingHistoryIndex !== null} onClose={() => setPendingHistoryIndex(null)} fullWidth maxWidth="md">
          <DialogTitle>确认回填历史版本</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                回填将覆盖当前“正文/大纲/总结”内容，请确认后继续。
              </Typography>
              {pendingHistoryItem && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>当前内容（预览）</Typography>
                      <Typography variant="caption" color="text.secondary">正文</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{editor.chapterBody.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">大纲</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{editor.chapterOutline.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">总结</Typography>
                      <Typography variant="body2">{editor.chapterSummary.slice(0, 120) || '（空）'}</Typography>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ flex: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>历史版本（预览）</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(pendingHistoryItem.createdAt).toLocaleString('zh-CN')}
                        {pendingHistoryItem.model ? ` · ${pendingHistoryItem.model}` : ''}
                        {pendingHistoryItem.totalTokens ? ` · ${pendingHistoryItem.totalTokens} tokens` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>正文</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{pendingHistoryItem.body.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">大纲</Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>{pendingHistoryItem.outline.slice(0, 120) || '（空）'}</Typography>
                      <Typography variant="caption" color="text.secondary">总结</Typography>
                      <Typography variant="body2">{pendingHistoryItem.summary.slice(0, 120) || '（空）'}</Typography>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingHistoryIndex(null)}>取消</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (pendingHistoryIndex !== null) editor.applyGenerateHistory(pendingHistoryIndex)
                setPendingHistoryIndex(null)
              }}
            >
              确认回填
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
