import { Alert, Button, Snackbar } from '@mui/material'

type Props = {
  localSuccess: string
  localError: string
  canRetryGenerate: boolean
  generating: boolean
  chapterInstruction: string
  volumeID: number
  chapterNumber: number
  onCloseSuccess: () => void
  onCloseError: () => void
  onRetryGenerate: () => void
}

export default function EditorSnackbars(props: Props) {
  return (
    <>
      <Snackbar open={Boolean(props.localSuccess)} autoHideDuration={2400} onClose={props.onCloseSuccess}>
        <Alert severity="success" onClose={props.onCloseSuccess} sx={{ width: '100%' }}>
          {props.localSuccess}
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(props.localError)} autoHideDuration={3200} onClose={props.onCloseError}>
        <Alert
          severity="error"
          onClose={props.onCloseError}
          sx={{ width: '100%' }}
          action={props.canRetryGenerate ? (
            <Button
              color="inherit"
              size="small"
              onClick={props.onRetryGenerate}
              disabled={props.generating || !props.chapterInstruction.trim() || props.volumeID <= 0 || props.chapterNumber <= 0}
            >
              重试
            </Button>
          ) : undefined}
        >
          {props.localError}
        </Alert>
      </Snackbar>
    </>
  )
}
