import { Box } from '@mui/material'
import EditorActionButtons from './EditorActionButtons'

type Props = {
  onBack: () => void
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

export default function ChapterEditorFloatingActions(props: Props) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        bgcolor: 'rgba(255,255,255,0.95)',
        border: '1px solid #e2e8f0',
        borderRadius: 999,
        px: 2,
        py: 1,
        boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
      }}
    >
      <EditorActionButtons
        onBack={props.onBack}
        onRewrite={props.onRewrite}
        rewriteDisabled={props.rewriteDisabled}
        onGenerate={props.onGenerate}
        onSave={props.onSave}
        generating={props.generating}
        saving={props.saving}
        chapterNumber={props.chapterNumber}
        volumeID={props.volumeID}
        isEdit={props.isEdit}
        compact
      />
    </Box>
  )
}
