import { Box, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import EditorActionButtons from './EditorActionButtons'

type Props = {
  novelTitle: string
  chapterWordCount: number
  onBack: () => void
  onOpenAISettings: () => void
  onRewrite: () => void
  rewriteDisabled: boolean
  onGenerate: () => void
  onSave: () => void
  generating: boolean
  saving: boolean
  chapterNumber: number
  volumeID: number
  isEdit: boolean
}

export default function ChapterEditorHeader(props: Props) {
  return (
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
            onClick={props.onBack}
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
              {props.novelTitle}
            </Typography>
            <Stack direction="row" spacing={1.2} sx={{ color: '#9ca3af', mt: 0.25 }}>
              <Stack direction="row" spacing={0.4} alignItems="center">
                <TaskAltRoundedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">已保存到云端</Typography>
              </Stack>
              <Stack direction="row" spacing={0.4} alignItems="center">
                <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">正文 {props.chapterWordCount} 字</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        <EditorActionButtons
          onBack={props.onBack}
          onOpenAISettings={props.onOpenAISettings}
          onRewrite={props.onRewrite}
          rewriteDisabled={props.rewriteDisabled}
          onGenerate={props.onGenerate}
          onSave={props.onSave}
          generating={props.generating}
          saving={props.saving}
          chapterNumber={props.chapterNumber}
          volumeID={props.volumeID}
          isEdit={props.isEdit}
        />
      </Stack>
    </Box>
  )
}
