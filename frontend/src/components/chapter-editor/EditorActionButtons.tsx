import { Button, Stack } from '@mui/material'

type Props = {
  onBack: () => void
  onOpenAISettings?: () => void
  onRewrite?: () => void
  onGenerate: () => void
  onSave: () => void
  generating: boolean
  saving: boolean
  chapterNumber: number
  volumeID: number
  isEdit: boolean
  rewriteDisabled?: boolean
  compact?: boolean
}

export default function EditorActionButtons(props: Props) {
  const disabled = props.volumeID <= 0 || props.chapterNumber <= 0

  return (
    <Stack direction="row" spacing={props.compact ? 1.5 : 1.2} alignItems="center" sx={{ flexShrink: 0 }}>
      <Button
        variant="contained"
        onClick={props.onBack}
        sx={{
          borderRadius: 999,
          px: props.compact ? 2.25 : 2.2,
          color: '#111827',
          bgcolor: '#f1f5f9',
          boxShadow: 'none',
          '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' },
        }}
      >
        返回列表
      </Button>
      {props.onOpenAISettings && (
        <Button
          variant="outlined"
          onClick={props.onOpenAISettings}
          sx={{
            borderRadius: 999,
            px: props.compact ? 2.25 : 2.2,
          }}
        >
          AI 设置
        </Button>
      )}
      {props.onRewrite && (
        <Button
          variant="outlined"
          disabled={props.rewriteDisabled}
          onClick={props.onRewrite}
          data-keep-body-selection="true"
          sx={{
            borderRadius: 999,
            px: props.compact ? 2.25 : 2.2,
            color: props.rewriteDisabled ? '#9ca3af' : '#ea580c',
            borderColor: props.rewriteDisabled ? '#e5e7eb' : '#ea580c',
            bgcolor: props.rewriteDisabled ? '#f8fafc' : '#fff7ed',
            '&:hover': props.rewriteDisabled
              ? { bgcolor: '#f8fafc', borderColor: '#e5e7eb' }
              : { bgcolor: '#ea580c', color: '#ffffff', borderColor: '#ea580c' },
            '&.Mui-disabled': { color: '#9ca3af', borderColor: '#e5e7eb', bgcolor: '#f8fafc' },
          }}
        >
          局部重写
        </Button>
      )}
      <Button
        variant="outlined"
        disabled={props.generating || props.saving || disabled}
        onClick={props.onGenerate}
        sx={{
          borderRadius: 999,
          px: props.compact ? 2.25 : 2.2,
        }}
      >
        {props.generating ? '生成中...' : 'AI 生成'}
      </Button>
      <Button
        variant="outlined"
        disabled={props.saving || disabled}
        onClick={props.onSave}
        sx={{
          borderRadius: 999,
          px: props.compact ? 2.25 : 2.2,
          color: '#ea580c',
          borderColor: '#ea580c',
          bgcolor: '#ffffff',
          '&:hover': { bgcolor: '#ea580c', color: '#ffffff', borderColor: '#ea580c' },
        }}
      >
        {props.isEdit ? '保存章节' : '创建章节'}
      </Button>
    </Stack>
  )
}
