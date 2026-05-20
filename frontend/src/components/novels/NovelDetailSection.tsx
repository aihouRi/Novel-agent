import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import type { Novel } from '../../api/novels'
import NovelForm from './NovelForm'

type Props = {
  selectedNovel: Novel | null
  showNovelEditor: boolean
  loading: boolean
  title: string
  genre: string
  language: string
  styleProfile: string
  worldview: string
  powerSystem: string
  mainPlot: string
  writingRules: string
  forbiddenRules: string
  onEditNovel: () => void
  onDeleteNovel: () => void
  onHideEditor: () => void
  onUpdateNovel: () => void
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

export default function NovelDetailSection(props: Props) {
  const {
    selectedNovel,
    showNovelEditor,
    loading,
    title,
    genre,
    language,
    styleProfile,
    worldview,
    powerSystem,
    mainPlot,
    writingRules,
    forbiddenRules,
    onEditNovel,
    onDeleteNovel,
    onHideEditor,
    onUpdateNovel,
    onTitle,
    onGenre,
    onLanguage,
    onStyleProfile,
    onWorldview,
    onPowerSystem,
    onMainPlot,
    onWritingRules,
    onForbiddenRules,
  } = props

  return (
    <Stack spacing={2}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.2 }}>当前小说</Typography>
          {selectedNovel ? (
            <Stack spacing={1.2}>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{selectedNovel.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedNovel.genre || '未填写类型'}{selectedNovel.language && selectedNovel.language !== 'zh-CN' ? ` · ${selectedNovel.language}` : ''}
              </Typography>
              <Stack direction="row" spacing={1.2}>
                <Button variant="outlined" onClick={onEditNovel}>编辑小说</Button>
                <Button variant="outlined" color="error" onClick={onDeleteNovel}>删除小说</Button>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">请先在左侧选择一本小说。</Typography>
          )}
        </CardContent>
      </Card>

      {selectedNovel && showNovelEditor && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>小说详情编辑</Typography>
            <NovelForm
              title={title} genre={genre} language={language} styleProfile={styleProfile} worldview={worldview}
              powerSystem={powerSystem} mainPlot={mainPlot} writingRules={writingRules} forbiddenRules={forbiddenRules}
              onTitle={onTitle} onGenre={onGenre} onLanguage={onLanguage} onStyleProfile={onStyleProfile}
              onWorldview={onWorldview} onPowerSystem={onPowerSystem} onMainPlot={onMainPlot}
              onWritingRules={onWritingRules} onForbiddenRules={onForbiddenRules}
            />
            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" disabled={!title.trim() || loading} onClick={onUpdateNovel}>保存小说</Button>
              <Button variant="outlined" onClick={onHideEditor} disabled={loading}>取消</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}
