import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import type { ExportScope } from '../../api/chapters'
import type { Volume } from '../../api/volumes'

type Props = {
  open: boolean
  exporting: boolean
  scope: ExportScope
  volumeId: number
  fromChapter: number
  toChapter: number
  includeBody: boolean
  includeSummary: boolean
  includeOutline: boolean
  volumes: Volume[]
  onClose: () => void
  onScopeChange: (scope: ExportScope) => void
  onVolumeIdChange: (id: number) => void
  onFromChapterChange: (v: number) => void
  onToChapterChange: (v: number) => void
  onIncludeBodyChange: (v: boolean) => void
  onIncludeSummaryChange: (v: boolean) => void
  onIncludeOutlineChange: (v: boolean) => void
  onExport: () => void
}

export default function ExportDialog(props: Props) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>导出设置</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="export-format-select">导出格式</InputLabel>
            <Select labelId="export-format-select" label="导出格式" value="markdown" disabled>
              <MenuItem value="markdown">Markdown</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="export-scope-select">导出范围</InputLabel>
            <Select
              labelId="export-scope-select"
              label="导出范围"
              value={props.scope}
              onChange={(e) => props.onScopeChange(e.target.value as ExportScope)}
            >
              <MenuItem value="all">全部章节</MenuItem>
              <MenuItem value="volume">按分卷</MenuItem>
              <MenuItem value="chapter_range">按章节区间</MenuItem>
            </Select>
          </FormControl>

          {props.scope === 'volume' && (
            <FormControl fullWidth>
              <InputLabel id="export-volume-select">选择分卷</InputLabel>
              <Select
                labelId="export-volume-select"
                label="选择分卷"
                value={props.volumeId}
                onChange={(e) => props.onVolumeIdChange(Number(e.target.value))}
              >
                <MenuItem value={0} disabled>请选择分卷</MenuItem>
                {props.volumes.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    第{v.volume_number}卷：{v.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {props.scope === 'chapter_range' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="起始章节"
                type="number"
                value={props.fromChapter}
                onChange={(e) => props.onFromChapterChange(Number(e.target.value) || 0)}
                fullWidth
              />
              <TextField
                label="结束章节"
                type="number"
                value={props.toChapter}
                onChange={(e) => props.onToChapterChange(Number(e.target.value) || 0)}
                fullWidth
              />
            </Stack>
          )}

          <FormGroup>
            <FormControlLabel control={<Checkbox checked={props.includeBody} onChange={(e) => props.onIncludeBodyChange(e.target.checked)} />} label="正文" />
            <FormControlLabel control={<Checkbox checked={props.includeSummary} onChange={(e) => props.onIncludeSummaryChange(e.target.checked)} />} label="章节总结" />
            <FormControlLabel control={<Checkbox checked={props.includeOutline} onChange={(e) => props.onIncludeOutlineChange(e.target.checked)} />} label="章节大纲" />
          </FormGroup>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>取消</Button>
        <Button onClick={props.onExport} variant="contained" disabled={props.exporting}>
          导出
        </Button>
      </DialogActions>
    </Dialog>
  )
}
