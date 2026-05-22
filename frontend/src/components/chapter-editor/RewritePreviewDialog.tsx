import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'

type PendingRewrite = {
  start: number
  end: number
  original: string
  rewritten: string
} | null

type Props = {
  pendingRewrite: PendingRewrite
  onClose: () => void
  onDiscard: () => void
  onApply: () => void
}

export default function RewritePreviewDialog(props: Props) {
  return (
    <Dialog
      open={Boolean(props.pendingRewrite)}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-container': {
          justifyContent: 'flex-end',
          alignItems: 'center',
          pr: { xs: 1, md: 2 },
        },
        '& .MuiDialog-paper': {
          m: 0,
          width: { xs: '96vw', sm: 560 },
          maxHeight: '78vh',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>局部重写预览</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            请先确认重写内容，再决定是否替换。
          </Typography>
          <Typography variant="body2" sx={{ color: '#9a3412', fontWeight: 600 }}>
            替换范围：第 {(props.pendingRewrite?.start ?? 0) + 1} ~ {props.pendingRewrite?.end ?? 0} 字（共 {Math.max(0, (props.pendingRewrite?.end ?? 0) - (props.pendingRewrite?.start ?? 0))} 字）
          </Typography>
          <TextField label="原文（选中段落）" value={props.pendingRewrite?.original ?? ''} multiline minRows={5} fullWidth InputProps={{ readOnly: true }} />
          <TextField label="重写结果" value={props.pendingRewrite?.rewritten ?? ''} multiline minRows={7} fullWidth InputProps={{ readOnly: true }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onDiscard}>放弃替换</Button>
        <Button variant="contained" onClick={props.onApply} sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}>
          应用替换
        </Button>
      </DialogActions>
    </Dialog>
  )
}
