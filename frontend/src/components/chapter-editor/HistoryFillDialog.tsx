import { Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

type HistoryItem = {
  createdAt: string
  model?: string
  totalTokens?: number
  body: string
  outline: string
  summary: string
}

type Props = {
  open: boolean
  currentBody: string
  currentOutline: string
  currentSummary: string
  pendingHistoryItem: HistoryItem | null
  onClose: () => void
  onConfirm: () => void
}

export default function HistoryFillDialog(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="md">
      <DialogTitle>确认回填历史版本</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            回填将覆盖当前“正文/大纲/总结”内容，请确认后继续。
          </Typography>
          {props.pendingHistoryItem && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>当前内容（预览）</Typography>
                  <Typography variant="caption" color="text.secondary">正文</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{props.currentBody.slice(0, 120) || '（空）'}</Typography>
                  <Typography variant="caption" color="text.secondary">大纲</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{props.currentOutline.slice(0, 120) || '（空）'}</Typography>
                  <Typography variant="caption" color="text.secondary">总结</Typography>
                  <Typography variant="body2">{props.currentSummary.slice(0, 120) || '（空）'}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>历史版本（预览）</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(props.pendingHistoryItem.createdAt).toLocaleString('zh-CN')}
                    {props.pendingHistoryItem.model ? ` · ${props.pendingHistoryItem.model}` : ''}
                    {props.pendingHistoryItem.totalTokens ? ` · ${props.pendingHistoryItem.totalTokens} tokens` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>正文</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{props.pendingHistoryItem.body.slice(0, 120) || '（空）'}</Typography>
                  <Typography variant="caption" color="text.secondary">大纲</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{props.pendingHistoryItem.outline.slice(0, 120) || '（空）'}</Typography>
                  <Typography variant="caption" color="text.secondary">总结</Typography>
                  <Typography variant="body2">{props.pendingHistoryItem.summary.slice(0, 120) || '（空）'}</Typography>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>取消</Button>
        <Button variant="contained" onClick={props.onConfirm}>确认回填</Button>
      </DialogActions>
    </Dialog>
  )
}
