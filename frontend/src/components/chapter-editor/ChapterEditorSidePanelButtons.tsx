import { Box, Button, Stack } from '@mui/material'

type SidePanel = 'summary' | 'outline' | 'instruction' | 'history' | 'snapshot' | null

type Props = {
  sidePanel: SidePanel
  onToggle: (panel: Exclude<SidePanel, null>) => void
}

const panels: Array<{ key: Exclude<SidePanel, null>; label: string }> = [
  { key: 'summary', label: '总结' },
  { key: 'outline', label: '大纲' },
  { key: 'instruction', label: '指令' },
  { key: 'history', label: '历史' },
  { key: 'snapshot', label: '快照' },
]

export default function ChapterEditorSidePanelButtons({ sidePanel, onToggle }: Props) {
  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Stack direction="column" spacing={0.8}>
        {panels.map((panel) => {
          const active = sidePanel === panel.key
          return (
            <Button
              key={panel.key}
              variant={active ? 'contained' : 'outlined'}
              onClick={() => onToggle(panel.key)}
              size="small"
              sx={{
                borderRadius: 3,
                minWidth: 0,
                px: 1,
                py: 0.65,
                fontSize: 13,
                lineHeight: 1.2,
                fontWeight: 700,
                color: active ? '#ffffff' : '#374151',
                bgcolor: active ? '#0f766e' : '#f8fafc',
                borderColor: active ? '#0f766e' : '#d1d5db',
                '&:hover': {
                  bgcolor: active ? '#0d9488' : '#eef2f7',
                  borderColor: active ? '#0d9488' : '#9ca3af',
                },
              }}
            >
              {panel.label}
            </Button>
          )
        })}
      </Stack>
    </Box>
  )
}
