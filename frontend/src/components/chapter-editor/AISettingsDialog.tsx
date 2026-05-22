import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material'

type Provider = 'openai' | 'gemini'

type Props = {
  open: boolean
  loading: boolean
  provider: Provider
  openaiAPIKeyInput: string
  openaiHasAPIKey: boolean
  openaiAPIKeyMasked: string
  openaiBaseURL: string
  openaiModel: string
  geminiAPIKeyInput: string
  geminiHasAPIKey: boolean
  geminiAPIKeyMasked: string
  geminiBaseURL: string
  geminiModel: string
  openAIModelOptions: string[]
  geminiModelOptions: string[]
  onClose: () => void
  onSave: () => void
  onResetDefault: () => void
  onProviderChange: (provider: Provider) => void
  onOpenAIAPIKeyInput: (v: string) => void
  onOpenAIBaseURL: (v: string) => void
  onOpenAIModel: (v: string) => void
  onGeminiAPIKeyInput: (v: string) => void
  onGeminiBaseURL: (v: string) => void
  onGeminiModel: (v: string) => void
}

export default function AISettingsDialog(props: Props) {
  const isOpenAI = props.provider === 'openai'

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>AI 设置</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="chapter-ai-provider-select-label">AI Provider</InputLabel>
            <Select
              labelId="chapter-ai-provider-select-label"
              label="AI Provider"
              value={props.provider}
              onChange={(e) => props.onProviderChange(String(e.target.value) as Provider)}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="gemini">Gemini</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={isOpenAI ? 'OpenAI API Key' : 'Gemini API Key'}
            type="password"
            value={isOpenAI ? props.openaiAPIKeyInput : props.geminiAPIKeyInput}
            onChange={(e) => isOpenAI ? props.onOpenAIAPIKeyInput(e.target.value) : props.onGeminiAPIKeyInput(e.target.value)}
            placeholder={isOpenAI
              ? (props.openaiHasAPIKey ? `当前：${props.openaiAPIKeyMasked}` : 'sk-...')
              : (props.geminiHasAPIKey ? `当前：${props.geminiAPIKeyMasked}` : 'AIza...')}
            helperText={isOpenAI
              ? (props.openaiHasAPIKey ? `已保存：${props.openaiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')
              : (props.geminiHasAPIKey ? `已保存：${props.geminiAPIKeyMasked}（留空则不修改）` : '首次设置请输入完整 Key')}
            fullWidth
          />

          <TextField
            label={isOpenAI ? 'OpenAI Base URL' : 'Gemini Base URL'}
            value={isOpenAI ? props.openaiBaseURL : props.geminiBaseURL}
            onChange={(e) => isOpenAI ? props.onOpenAIBaseURL(e.target.value) : props.onGeminiBaseURL(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="chapter-ai-model-select-label">{isOpenAI ? 'OpenAI Model' : 'Gemini Model'}</InputLabel>
            <Select
              labelId="chapter-ai-model-select-label"
              label={isOpenAI ? 'OpenAI Model' : 'Gemini Model'}
              value={isOpenAI ? props.openaiModel : props.geminiModel}
              onChange={(e) => isOpenAI ? props.onOpenAIModel(String(e.target.value)) : props.onGeminiModel(String(e.target.value))}
            >
              {(isOpenAI ? props.openAIModelOptions : props.geminiModelOptions).map((model) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onResetDefault}>恢复默认</Button>
        <Button onClick={props.onClose}>取消</Button>
        <Button variant="contained" onClick={props.onSave} disabled={props.loading}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}
