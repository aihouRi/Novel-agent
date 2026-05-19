import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const DEFAULT_RECENT_COUNT = 3

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
  recentChapterCount: number
  onTitle: (v: string) => void
  onGenre: (v: string) => void
  onLanguage: (v: string) => void
  onStyleProfile: (v: string) => void
  onWorldview: (v: string) => void
  onPowerSystem: (v: string) => void
  onMainPlot: (v: string) => void
  onWritingRules: (v: string) => void
  onForbiddenRules: (v: string) => void
  onRecentChapterCount: (v: number) => void
}

export default function NovelForm(props: NovelFormProps) {
  return (
    <>
      <Accordion defaultExpanded disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Basic Info</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Title" value={props.title} onChange={(e) => props.onTitle(e.target.value)} fullWidth required />
            <TextField label="Genre" value={props.genre} onChange={(e) => props.onGenre(e.target.value)} fullWidth />
            <TextField label="Language" value={props.language} onChange={(e) => props.onLanguage(e.target.value)} fullWidth />
            <TextField
              label="Recent Chapter Count"
              type="number"
              value={props.recentChapterCount}
              onChange={(e) => props.onRecentChapterCount(Number(e.target.value) || DEFAULT_RECENT_COUNT)}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField label="Style Profile" value={props.styleProfile} onChange={(e) => props.onStyleProfile(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Worldview" value={props.worldview} onChange={(e) => props.onWorldview(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Power System" value={props.powerSystem} onChange={(e) => props.onPowerSystem(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Main Plot" value={props.mainPlot} onChange={(e) => props.onMainPlot(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="Writing Rules" value={props.writingRules} onChange={(e) => props.onWritingRules(e.target.value)} fullWidth multiline minRows={3} />
            <TextField label="Forbidden Rules" value={props.forbiddenRules} onChange={(e) => props.onForbiddenRules(e.target.value)} fullWidth multiline minRows={3} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </>
  )
}
