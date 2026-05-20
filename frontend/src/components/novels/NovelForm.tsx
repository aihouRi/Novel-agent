import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export type NovelFormProps = {
  title: string
  genre: string
  language: string
  styleProfile: string
  worldview: string
  powerSystem: string
  mainPlot: string
  writingRules: string
  forbiddenRules: string
  onTitle: (v: string) => void
  onGenre: (v: string) => void
  onLanguage: (v: string) => void
  onStyleProfile: (v: string) => void
  onWorldview: (v: string) => void
  onPowerSystem: (v: string) => void
  onMainPlot: (v: string) => void
  onWritingRules: (v: string) => void
  onForbiddenRules: (v: string) => void
}

export default function NovelForm(props: NovelFormProps) {
  return (
    <>
      <Accordion defaultExpanded disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>基础信息</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="标题" value={props.title} onChange={(e) => props.onTitle(e.target.value)} fullWidth required />
            <TextField label="类型" value={props.genre} onChange={(e) => props.onGenre(e.target.value)} fullWidth />
            <TextField label="语言" value={props.language} onChange={(e) => props.onLanguage(e.target.value)} fullWidth />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>高级设定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="整体风格" value={props.styleProfile} onChange={(e) => props.onStyleProfile(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="世界观" value={props.worldview} onChange={(e) => props.onWorldview(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="修炼体系" value={props.powerSystem} onChange={(e) => props.onPowerSystem(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="主线剧情" value={props.mainPlot} onChange={(e) => props.onMainPlot(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="写作规则" value={props.writingRules} onChange={(e) => props.onWritingRules(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="禁止事项" value={props.forbiddenRules} onChange={(e) => props.onForbiddenRules(e.target.value)} fullWidth multiline minRows={3} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </>
  )
}
