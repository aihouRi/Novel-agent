import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

type Props = {
  open: boolean
  generating: boolean
  rewritePrompt: string
  rewriteSelection: { start: number; end: number } | null
  onClose: () => void
  onRewritePromptChange: (v: string) => void
  onConfirm: () => void
}

export default function RewriteInputDialog(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>局部重写</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            仅替换当前选中的正文内容，其他正文保持不变。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            当前选中：{Math.max(0, (props.rewriteSelection?.end ?? 0) - (props.rewriteSelection?.start ?? 0))} 字
          </Typography>
          <TextField
            label="本段额外提示词（可选）"
            value={props.rewritePrompt}
            onChange={(e) => props.onRewritePromptChange(e.target.value)}
            multiline
            minRows={3}
            placeholder="例如：更克制冷静；减少解释；强调动作与细节。"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>取消</Button>
        <Button
          variant="contained"
          data-keep-body-selection="true"
          disabled={props.generating || !props.rewriteSelection || props.rewriteSelection.end <= props.rewriteSelection.start}
          onClick={props.onConfirm}
        >
          开始重写
        </Button>
      </DialogActions>
    </Dialog>
  )
}
