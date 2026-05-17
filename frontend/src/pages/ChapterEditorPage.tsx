import { useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Container, IconButton, Stack, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { createChapter, type Chapter, updateChapter } from '../api/chapters'

type Props = {
  token: string
  novelId: number
  novelTitle: string
  initialChapter?: Chapter | null
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
  onBack,
  onNotifySuccess,
  onNotifyError,
  onSaved,
}: Props) {
  type SidePanel = 'summary' | 'outline' | 'instruction' | null

  const [chapterNumber, setChapterNumber] = useState(initialChapter?.chapter_number ?? 1)
  const [chapterTitle, setChapterTitle] = useState(initialChapter?.title ?? '')
  const [chapterBody, setChapterBody] = useState(initialChapter?.body ?? '')
  const [chapterSummary, setChapterSummary] = useState(initialChapter?.summary ?? '')
  const [chapterOutline, setChapterOutline] = useState(initialChapter?.outline ?? '')
  const [chapterInstruction, setChapterInstruction] = useState(initialChapter?.generation_instruction ?? '')
  const [saving, setSaving] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)

  const chapterWordCount = useMemo(() => chapterBody.replace(/\s/g, '').length, [chapterBody])
  const isEdit = Boolean(initialChapter)

  async function handleSave() {
    if (chapterNumber <= 0) {
      onNotifyError('章节编号必须大于 0。')
      return
    }

    setSaving(true)
    try {
      const payload = {
        chapter_number: chapterNumber,
        title: chapterTitle.trim(),
        body: chapterBody,
        word_count: chapterWordCount,
        generation_instruction: chapterInstruction,
        outline: chapterOutline,
        summary: chapterSummary,
      }

      if (isEdit && initialChapter) {
        await updateChapter(token, novelId, initialChapter.id, payload)
        onNotifySuccess('Chapter updated.')
      } else {
        await createChapter(token, novelId, payload)
        onNotifySuccess('Chapter created.')
      }

      await onSaved()
      onBack()
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : 'Failed to save chapter')
    } finally {
      setSaving(false)
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
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: 'rgba(15,23,42,0.1)', bgcolor: 'rgba(255,255,255,0.92)' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{isEdit ? '编辑章节' : '新建章节'}</Typography>
                <Typography variant="body2" color="text.secondary">{novelTitle}</Typography>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={onBack}>返回章节列表</Button>
                <Button variant="contained" disabled={saving || chapterNumber <= 0} onClick={() => void handleSave()}>
                  {isEdit ? '保存章节' : '创建章节'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

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
                        <TextField label="生成指令" multiline minRows={24} value={chapterInstruction} onChange={(e) => setChapterInstruction(e.target.value)} fullWidth />
                      )}
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Box>

            <Stack
              spacing={1}
              sx={{
                width: 96,
                flexShrink: 0,
                position: { lg: 'sticky' },
                top: { lg: 110 },
              }}
            >
              <Button
                variant={sidePanel === 'summary' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'summary' ? null : 'summary'))}
              >
                总结
              </Button>
              <Button
                variant={sidePanel === 'outline' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'outline' ? null : 'outline'))}
              >
                大纲
              </Button>
              <Button
                variant={sidePanel === 'instruction' ? 'contained' : 'outlined'}
                onClick={() => setSidePanel((p) => (p === 'instruction' ? null : 'instruction'))}
              >
                指令
              </Button>
            </Stack>
          </Stack>
        </Box>

      </Container>
    </Box>
  )
}
