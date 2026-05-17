import { ClipboardEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, Container, FormControl, IconButton, InputLabel, ListItemText, MenuItem, Select, Snackbar, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { createChapter, generateChapter, type Chapter, updateChapter } from '../api/chapters'
import type { Character } from '../api/characters'
import type { Volume } from '../api/volumes'

type Props = {
  token: string
  novelId: number
  novelTitle: string
  volumes: Volume[]
  characters: Character[]
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
  onBack,
  onNotifySuccess,
  onNotifyError,
  onSaved,
}: Props) {
  type SidePanel = 'summary' | 'outline' | 'instruction' | null

  const INDENT = '　　'
  const latestVolumeID = useMemo(() => {
    if (volumes.length === 0) return 0
    return volumes.reduce((latest, current) => {
      if (current.volume_number > latest.volume_number) return current
      if (current.volume_number === latest.volume_number && current.id > latest.id) return current
      return latest
    }).id
  }, [volumes])

  const [chapterNumber, setChapterNumber] = useState(initialChapter?.chapter_number ?? defaultChapterNumber)
  const [volumeID, setVolumeID] = useState<number>(initialChapter?.volume_id ?? latestVolumeID)
  const [chapterTitle, setChapterTitle] = useState(initialChapter?.title ?? '')
  const [chapterBody, setChapterBody] = useState(ensureIndentedBody(initialChapter?.body ?? INDENT))
  const [chapterSummary, setChapterSummary] = useState(initialChapter?.summary ?? '')
  const [chapterOutline, setChapterOutline] = useState(initialChapter?.outline ?? '')
  const [chapterInstruction, setChapterInstruction] = useState(initialChapter?.generation_instruction ?? '')
  const [selectedCharacterIDs, setSelectedCharacterIDs] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const [localSuccess, setLocalSuccess] = useState('')
  const [localError, setLocalError] = useState('')

  const chapterWordCount = useMemo(() => chapterBody.replace(/\s/g, '').length, [chapterBody])
  const isEdit = Boolean(initialChapter)
  const draftKey = useMemo(
    () => `novel_agent_chapter_draft_${novelId}_${initialChapter?.id ?? 'new'}`,
    [novelId, initialChapter?.id],
  )

  useEffect(() => {
    if (volumes.length === 0) {
      if (volumeID !== 0) setVolumeID(0)
      return
    }
    if (!isEdit && volumeID <= 0) {
      setVolumeID(latestVolumeID)
      return
    }
    const matched = volumes.some((v) => v.id === volumeID)
    if (!matched) setVolumeID(isEdit ? volumes[0].id : latestVolumeID)
  }, [isEdit, latestVolumeID, volumeID, volumes])

  useEffect(() => {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as {
        volumeID: number
        chapterNumber: number
        chapterTitle: string
        chapterBody: string
        chapterSummary: string
        chapterOutline: string
        chapterInstruction: string
        selectedCharacterIDs?: number[]
      }
      if (isEdit) {
        setVolumeID(draft.volumeID ?? volumeID)
      } else {
        // For new chapters, always prefer the latest volume instead of stale draft volume.
        setVolumeID(latestVolumeID)
      }
      setChapterNumber(draft.chapterNumber ?? chapterNumber)
      setChapterTitle(draft.chapterTitle ?? '')
      setChapterBody(ensureIndentedBody(draft.chapterBody ?? ''))
      setChapterSummary(draft.chapterSummary ?? '')
      setChapterOutline(draft.chapterOutline ?? '')
      setChapterInstruction(draft.chapterInstruction ?? '')
      setSelectedCharacterIDs(Array.isArray(draft.selectedCharacterIDs) ? draft.selectedCharacterIDs : [])
    } catch {
      localStorage.removeItem(draftKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEdit, latestVolumeID])

  function ensureIndentedBody(text: string): string {
    if (!text) return INDENT
    const lines = text.split('\n')
    return lines
      .map((line) => (line.startsWith(INDENT) ? line : `${INDENT}${line}`))
      .join('\n')
  }

  function handleBodyKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start !== end) return

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    // In non-first lines, Backspace inside the indent area behaves as
    // logical "back to previous line" (merge lines).
    if (e.key === 'Backspace' && start <= indentEnd && lineStart > 0) {
      e.preventDefault()
      const merged = `${chapterBody.slice(0, lineStart - 1)}${chapterBody.slice(indentEnd)}`
      setChapterBody(merged)
      window.requestAnimationFrame(() => {
        const nextPos = lineStart - 1
        target.selectionStart = nextPos
        target.selectionEnd = nextPos
      })
      return
    }

    if (e.key === 'Backspace' && start <= indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key === 'Delete' && start < indentEnd) {
      e.preventDefault()
      return
    }

    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = `${chapterBody.slice(0, start)}\n${INDENT}${chapterBody.slice(end)}`
    setChapterBody(next)
    window.requestAnimationFrame(() => {
      target.selectionStart = start + 1 + INDENT.length
      target.selectionEnd = start + 1 + INDENT.length
    })
  }

  function handleBodyPaste(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    e.preventDefault()

    const raw = e.clipboardData.getData('text')
    const normalizedPaste = raw.replace(/\r\n/g, '\n')

    let start = target.selectionStart
    let end = target.selectionEnd

    const lineStart = chapterBody.lastIndexOf('\n', start - 1) + 1
    const indentEnd = lineStart + INDENT.length

    // Do not allow paste before the required indent of current line.
    if (start < indentEnd) start = indentEnd
    if (end < indentEnd) end = indentEnd

    const next = `${chapterBody.slice(0, start)}${normalizedPaste}${chapterBody.slice(end)}`
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = start + normalizedPaste.length
      target.selectionStart = pos
      target.selectionEnd = pos
    })
  }

  function stripIndentForClipboard(text: string): string {
    return text
      .split('\n')
      .map((line) => (line.startsWith(INDENT) ? line.slice(INDENT.length) : line))
      .join('\n')
  }

  function handleBodyCopy(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const selected = target.value.slice(target.selectionStart, target.selectionEnd)
    if (!selected) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))
  }

  function handleBodyCut(e: ClipboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLTextAreaElement
    if (!target) return
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start === end) return

    e.preventDefault()
    const selected = target.value.slice(start, end)
    e.clipboardData.setData('text/plain', stripIndentForClipboard(selected))

    // Apply deletion while preserving indentation invariants.
    const next = ensureIndentedBody(`${chapterBody.slice(0, start)}${chapterBody.slice(end)}`)
    setChapterBody(next)

    window.requestAnimationFrame(() => {
      const pos = Math.min(start, next.length)
      target.selectionStart = pos
      target.selectionEnd = pos
    })
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      const draft = {
        volumeID,
        chapterNumber,
        chapterTitle,
        chapterBody,
        chapterSummary,
        chapterOutline,
        chapterInstruction,
        selectedCharacterIDs,
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }, 500)
    return () => window.clearTimeout(id)
  }, [draftKey, volumeID, chapterNumber, chapterTitle, chapterBody, chapterSummary, chapterOutline, chapterInstruction, selectedCharacterIDs])

  async function handleSave() {
    if (chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (volumeID <= 0) {
      const msg = '请先选择分卷。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }

    setSaving(true)
    try {
      const payload = {
        volume_id: volumeID,
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        body: ensureIndentedBody(chapterBody),
        word_count: chapterWordCount,
        generation_instruction: chapterInstruction,
        outline: chapterOutline,
        summary: chapterSummary,
      }

      if (isEdit && initialChapter) {
        await updateChapter(token, novelId, initialChapter.id, payload)
        onNotifySuccess('Chapter updated.')
        setLocalSuccess('章节已保存。')
      } else {
        await createChapter(token, novelId, payload)
        onNotifySuccess('Chapter created.')
        setLocalSuccess('章节已创建。')
      }

      localStorage.removeItem(draftKey)
      await onSaved()
      onBack()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save chapter'
      onNotifyError(msg)
      setLocalError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    if (chapterNumber <= 0) {
      const msg = '章节编号必须大于 0。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (volumeID <= 0) {
      const msg = '请先选择分卷。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }
    if (!chapterInstruction.trim()) {
      const msg = '请先填写生成指令。'
      onNotifyError(msg)
      setLocalError(msg)
      return
    }

    setGenerating(true)
    try {
      const data = await generateChapter(token, novelId, {
        volume_id: volumeID,
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        generation_instruction: chapterInstruction.trim(),
        character_ids: selectedCharacterIDs,
      })
      setChapterOutline(data.outline)
      setChapterBody(ensureIndentedBody(data.body))
      setChapterSummary(data.summary)
      setSidePanel('outline')
      onNotifySuccess('AI 生成完成。')
      setLocalSuccess('AI 生成完成，请检查后再保存。')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate chapter'
      onNotifyError(msg)
      setLocalError(msg)
    } finally {
      setGenerating(false)
    }
  }

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
                    <Typography variant="body2">正文 {chapterWordCount} 字</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexShrink: 0 }}>
              <Button
                variant="contained"
                onClick={onBack}
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                  color: '#111827',
                  bgcolor: '#f1f5f9',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' },
                }}
              >
                返回列表
              </Button>
              <Button
                variant="outlined"
                disabled={generating || saving || volumeID <= 0 || chapterNumber <= 0}
                onClick={() => void handleGenerate()}
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                }}
              >
                {generating ? '生成中...' : 'AI 生成'}
              </Button>
              <Button
                variant="outlined"
                disabled={saving || chapterNumber <= 0 || volumeID <= 0}
                onClick={() => void handleSave()}
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                  color: '#ea580c',
                  borderColor: '#ea580c',
                  bgcolor: '#ffffff',
                  '&:hover': { bgcolor: '#ea580c', color: '#ffffff', borderColor: '#ea580c' },
                }}
              >
                {isEdit ? '保存章节' : '创建章节'}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
                <Box sx={{ flex: sidePanel ? 5 : 1, display: 'flex', justifyContent: 'center' }}>
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
                            value={volumeID}
                            onChange={(e) => setVolumeID(Number(e.target.value))}
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
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(Number(e.target.value) || 0)}
                            sx={{ width: { xs: '100%', sm: 180 } }}
                          />
                          <TextField
                            label="章节标题"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="字数（自动）"
                            type="number"
                            value={chapterWordCount}
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
                            value={chapterBody}
                            onChange={(e) => setChapterBody(e.target.value)}
                            onKeyDown={handleBodyKeyDown}
                            onPaste={handleBodyPaste}
                            onCopy={handleBodyCopy}
                            onCut={handleBodyCut}
                            onBlur={() => setChapterBody((prev) => ensureIndentedBody(prev))}
                            fullWidth
                          />
                          </CardContent>
                        </Card>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                {sidePanel && (
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
                          {sidePanel === 'summary' && '章节总结'}
                          {sidePanel === 'outline' && '章节大纲'}
                          {sidePanel === 'instruction' && '生成指令'}
                        </Typography>
                        <IconButton size="small" onClick={() => setSidePanel(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      {sidePanel === 'summary' && (
                        <TextField label="章节总结" multiline minRows={24} value={chapterSummary} onChange={(e) => setChapterSummary(e.target.value)} fullWidth />
                      )}
                      {sidePanel === 'outline' && (
                        <TextField label="章节大纲" multiline minRows={24} value={chapterOutline} onChange={(e) => setChapterOutline(e.target.value)} fullWidth />
                      )}
                      {sidePanel === 'instruction' && (
                        <Stack spacing={1.5}>
                          <FormControl fullWidth>
                            <InputLabel id="chapter-character-select">本章登场人物（可选）</InputLabel>
                            <Select
                              labelId="chapter-character-select"
                              label="本章登场人物（可选）"
                              multiple
                              value={selectedCharacterIDs}
                              onChange={(e) => setSelectedCharacterIDs((e.target.value as number[]).map(Number))}
                              renderValue={(selected) => {
                                const names = characters
                                  .filter((c) => selected.includes(c.id))
                                  .map((c) => c.name)
                                return names.join('、') || '未选择（默认使用主要人物）'
                              }}
                            >
                              {characters.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                  <Checkbox checked={selectedCharacterIDs.includes(c.id)} />
                                  <ListItemText primary={c.name} secondary={c.role || undefined} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField label="生成指令" multiline minRows={20} value={chapterInstruction} onChange={(e) => setChapterInstruction(e.target.value)} fullWidth />
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
                variant={sidePanel === 'summary' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'summary' ? null : 'summary'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: sidePanel === 'summary' ? '#ffffff' : '#374151',
                  bgcolor: sidePanel === 'summary' ? '#0f766e' : '#f8fafc',
                  borderColor: sidePanel === 'summary' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: sidePanel === 'summary' ? '#0d9488' : '#eef2f7',
                    borderColor: sidePanel === 'summary' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                总结
              </Button>
              <Button
                variant={sidePanel === 'outline' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'outline' ? null : 'outline'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: sidePanel === 'outline' ? '#ffffff' : '#374151',
                  bgcolor: sidePanel === 'outline' ? '#0f766e' : '#f8fafc',
                  borderColor: sidePanel === 'outline' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: sidePanel === 'outline' ? '#0d9488' : '#eef2f7',
                    borderColor: sidePanel === 'outline' ? '#0d9488' : '#9ca3af',
                  },
                }}
              >
                大纲
              </Button>
              <Button
                variant={sidePanel === 'instruction' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'instruction' ? null : 'instruction'))}
                sx={{
                  borderRadius: 3,
                  py: 1,
                  fontWeight: 700,
                  color: sidePanel === 'instruction' ? '#ffffff' : '#374151',
                  bgcolor: sidePanel === 'instruction' ? '#0f766e' : '#f8fafc',
                  borderColor: sidePanel === 'instruction' ? '#0f766e' : '#d1d5db',
                  '&:hover': {
                    bgcolor: sidePanel === 'instruction' ? '#0d9488' : '#eef2f7',
                    borderColor: sidePanel === 'instruction' ? '#0d9488' : '#9ca3af',
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
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              onClick={onBack}
              sx={{
                borderRadius: 999,
                px: 2.25,
                color: '#111827',
                bgcolor: '#f1f5f9',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' },
              }}
            >
              返回列表
            </Button>
            <Button
              variant="outlined"
              disabled={generating || saving || volumeID <= 0 || chapterNumber <= 0}
              onClick={() => void handleGenerate()}
              sx={{
                borderRadius: 999,
                px: 2.25,
              }}
            >
              {generating ? '生成中...' : 'AI 生成'}
            </Button>
            <Button
              variant="outlined"
              disabled={saving || chapterNumber <= 0 || volumeID <= 0}
              onClick={() => void handleSave()}
              sx={{
                borderRadius: 999,
                px: 2.25,
                color: '#ea580c',
                borderColor: '#ea580c',
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#ea580c', color: '#ffffff', borderColor: '#ea580c' },
              }}
            >
              {isEdit ? '保存章节' : '创建章节'}
            </Button>
          </Stack>
        </Box>

        <Snackbar open={Boolean(localSuccess)} autoHideDuration={2400} onClose={() => setLocalSuccess('')}>
          <Alert severity="success" onClose={() => setLocalSuccess('')} sx={{ width: '100%' }}>
            {localSuccess}
          </Alert>
        </Snackbar>
        <Snackbar open={Boolean(localError)} autoHideDuration={3200} onClose={() => setLocalError('')}>
          <Alert severity="error" onClose={() => setLocalError('')} sx={{ width: '100%' }}>
            {localError}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
