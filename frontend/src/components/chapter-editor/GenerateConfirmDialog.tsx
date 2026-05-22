import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from '@mui/material'
import { estimateTokenAndCost, getGenerateCostProfile } from './generateCost'

type Volume = {
  id: number
  title: string
}

type Props = {
  open: boolean
  highCostAcknowledged: boolean
  provider: 'openai' | 'gemini'
  model: string
  volumes: Volume[]
  volumeID: number
  chapterNumber: number
  chapterTitle: string
  targetWordMin: number
  targetWordMax: number
  chapterInstruction: string
  recentChapterCount: number
  selectedCharacterCount: number
  selectedLoreEntryCount: number
  generating: boolean
  saving: boolean
  onClose: () => void
  onConfirm: () => void
  onHighCostAcknowledged: (v: boolean) => void
}

export default function GenerateConfirmDialog(props: Props) {
  const estimate = estimateTokenAndCost(
    props.model,
    props.targetWordMin,
    props.targetWordMax,
    props.recentChapterCount,
    props.selectedCharacterCount,
    props.selectedLoreEntryCount,
  )
  const profile = getGenerateCostProfile(props.model, props.targetWordMin, props.targetWordMax, props.recentChapterCount)
  const selectedVolume = props.volumes.find((v) => v.id === props.volumeID)

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>确认 AI 生成</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          <Typography variant="body2">
            成本档位：<Box component="span" sx={{ fontWeight: 700 }}>{profile.level}</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            预计 tokens：输入约 {estimate.inputTokens} / 输出约 {estimate.outputTokens}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            预计费用：${estimate.low.toFixed(3)} - ${estimate.high.toFixed(3)}（USD，估算）
          </Typography>
          <Typography variant="body2" color="text.secondary">{profile.hint}</Typography>
          <Typography variant="body2" color="text.secondary">
            将基于当前参数生成并回填「正文 / 大纲 / 总结」，会覆盖当前这三项内容。
          </Typography>
          <Typography variant="body2">Provider：{props.provider === 'openai' ? 'OpenAI' : 'Gemini'}</Typography>
          <Typography variant="body2">模型：{props.model}</Typography>
          <Typography variant="body2">分卷：{selectedVolume?.title ?? '未选择'}</Typography>
          <Typography variant="body2">章节：第 {props.chapterNumber} 章 {props.chapterTitle ? `《${props.chapterTitle}》` : ''}</Typography>
          <Typography variant="body2">目标字数：{props.targetWordMin} - {props.targetWordMax}</Typography>
          <Typography variant="body2">
            指令预览：{props.chapterInstruction.trim() ? props.chapterInstruction.trim().slice(0, 80) : '（空）'}
          </Typography>
          {profile.isHigh && (
            <FormControlLabel
              control={<Checkbox checked={props.highCostAcknowledged} onChange={(e) => props.onHighCostAcknowledged(e.target.checked)} />}
              label="我已知晓本次是高成本生成，仍继续。"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>取消</Button>
        <Button
          variant="contained"
          onClick={props.onConfirm}
          disabled={
            (profile.isHigh && !props.highCostAcknowledged) ||
            props.generating ||
            props.saving ||
            !props.chapterInstruction.trim() ||
            props.volumeID <= 0 ||
            props.chapterNumber <= 0 ||
            (props.targetWordMin > 0 && props.targetWordMax > 0 && props.targetWordMin > props.targetWordMax)
          }
        >
          确认生成
        </Button>
      </DialogActions>
    </Dialog>
  )
}
