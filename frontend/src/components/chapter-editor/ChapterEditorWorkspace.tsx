import CloseIcon from '@mui/icons-material/Close'
import { Autocomplete, Box, Button, Card, CardContent, Checkbox, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import type { RefObject } from 'react'
import type { LoreEntry } from '../../api/loreEntries'
import type { Volume } from '../../api/volumes'
import ChapterEditorSidePanelButtons from './ChapterEditorSidePanelButtons'

type Props = {
  editor: any
  volumes: Volume[]
  loreEntries: LoreEntry[]
  chapterBodyInputRef: RefObject<HTMLTextAreaElement | null>
  loreCategoryLabelMap: Record<string, string>
  onOpenHistoryFill: (idx: number) => void
}

export default function ChapterEditorWorkspace({
  editor,
  volumes,
  loreEntries,
  chapterBodyInputRef,
  loreCategoryLabelMap,
  onOpenHistoryFill,
}: Props) {
  return (
    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        <Box sx={{ flex: 1, width: '100%' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
            <Box sx={{ flex: editor.sidePanel ? 4.6 : 1, display: 'flex', justifyContent: 'center' }}>
              <Card variant="outlined" sx={{ borderRadius: 3, width: '100%', maxWidth: 900, transition: 'all 220ms ease' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                      <FormControl sx={{ width: { xs: '100%', sm: 220 } }}>
                        <InputLabel id="chapter-volume-select">分卷</InputLabel>
                        <Select labelId="chapter-volume-select" label="分卷" value={editor.volumeID} onChange={(e) => editor.setVolumeID(Number(e.target.value))}>
                          {volumes.map((v) => (
                            <MenuItem key={v.id} value={v.id}>第{v.volume_number}卷：{v.title}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField label="章节编号" type="number" value={editor.chapterNumber} onChange={(e) => editor.setChapterNumber(Number(e.target.value) || 0)} sx={{ width: { xs: '100%', sm: 120 } }} />
                      <TextField label="章节标题" value={editor.chapterTitle} onChange={(e) => editor.setChapterTitle(e.target.value)} sx={{ flex: 1, minWidth: { xs: '100%', sm: 340 } }} />
                      <TextField label="字数（自动）" type="number" value={editor.chapterWordCount} InputProps={{ readOnly: true }} sx={{ width: { xs: '100%', sm: 130 } }} />
                      <FormControl sx={{ width: { xs: '100%', sm: 130 } }}>
                        <InputLabel id="chapter-status-select">状态</InputLabel>
                        <Select labelId="chapter-status-select" label="状态" value={editor.chapterStatus} onChange={(e) => editor.setChapterStatus(e.target.value as 'draft' | 'review' | 'final')}>
                          <MenuItem value="draft">草稿</MenuItem>
                          <MenuItem value="review">待审</MenuItem>
                          <MenuItem value="final">定稿</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <TextField
                          label="正文"
                          multiline
                          minRows={26}
                          value={editor.chapterBody}
                          onChange={(e) => editor.setChapterBody(e.target.value)}
                          inputRef={chapterBodyInputRef}
                          onSelect={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            editor.handleBodySelect(target.selectionStart ?? 0, target.selectionEnd ?? 0)
                          }}
                          onFocus={editor.handleBodyFocus}
                          onKeyDown={editor.handleBodyKeyDown}
                          onPaste={editor.handleBodyPaste}
                          onCopy={editor.handleBodyCopy}
                          onCut={editor.handleBodyCut}
                          onBlur={(e) => {
                            editor.setChapterBody((prev: string) => editor.ensureIndentedBody(prev))
                            const next = e.relatedTarget as Element | null
                            if (next && next.closest('[data-keep-body-selection="true"]')) return
                            editor.handleBodyBlur()
                          }}
                          fullWidth
                          sx={{
                            '& textarea::selection': { backgroundColor: '#fb923c', color: '#111827' },
                            '& textarea::-moz-selection': { backgroundColor: '#fb923c', color: '#111827' },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          已选中 {Math.max(0, editor.bodySelection.end - editor.bodySelection.start)} 字
                        </Typography>
                      </CardContent>
                    </Card>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {editor.sidePanel && (
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  flex: 2.4,
                  minWidth: 0,
                  maxWidth: '100%',
                  transition: 'all 220ms ease',
                  bgcolor: 'rgba(255,255,255,0.98)',
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {editor.sidePanel === 'summary' && '章节总结'}
                      {editor.sidePanel === 'outline' && '章节大纲'}
                      {editor.sidePanel === 'instruction' && '生成指令'}
                      {editor.sidePanel === 'history' && '生成历史'}
                      {editor.sidePanel === 'snapshot' && '章节快照'}
                    </Typography>
                    <IconButton size="small" onClick={() => editor.setSidePanel(null)}><CloseIcon fontSize="small" /></IconButton>
                  </Stack>

                  {editor.sidePanel === 'summary' && <TextField label="章节总结" multiline minRows={24} value={editor.chapterSummary} onChange={(e) => editor.setChapterSummary(e.target.value)} fullWidth />}
                  {editor.sidePanel === 'outline' && <TextField label="章节大纲" multiline minRows={24} value={editor.chapterOutline} onChange={(e) => editor.setChapterOutline(e.target.value)} fullWidth />}
                  {editor.sidePanel === 'instruction' && (
                    <Stack spacing={1.5}>
                      <Autocomplete
                        multiple options={editor.groupedCharacterOptions} groupBy={(option) => option.group} value={editor.selectedCharacters}
                        onChange={(_, next) => editor.setSelectedCharacterIDs(next.map((c) => c.id))}
                        getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterOptions={(options, state) => {
                          const keyword = state.inputValue.trim().toLowerCase()
                          if (!keyword) return options
                          return options.filter((o) => o.name.toLowerCase().includes(keyword) || o.aliases.toLowerCase().includes(keyword) || o.role.toLowerCase().includes(keyword))
                        }}
                        renderInput={(params) => <TextField {...params} label="本章登场人物（可选）" placeholder="搜索姓名/别名/身份" />}
                      />
                      <Autocomplete
                        multiple options={loreEntries} value={editor.selectedLoreEntries} onChange={(_, next) => editor.setSelectedLoreEntryIDs(next.map((e) => e.id))}
                        getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="本章相关设定（可选）" placeholder="选择法器/丹药/阵法等" />}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{loreCategoryLabelMap[option.category] ?? option.category}{option.tags ? ` · ${option.tags}` : ''}</Typography>
                            </Box>
                          </li>
                        )}
                      />
                      <TextField label="生成指令" multiline minRows={20} value={editor.chapterInstruction} onChange={(e) => editor.setChapterInstruction(e.target.value)} fullWidth />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ minWidth: 0 }}>
                        <FormControl sx={{ minWidth: 0, flex: 1 }}>
                          <InputLabel id="generate-template-select">生成模板</InputLabel>
                          <Select labelId="generate-template-select" label="生成模板" value={editor.selectedTemplateId} onChange={(e) => editor.applyTemplate(String(e.target.value))}>
                            <MenuItem value="">不使用模板</MenuItem>
                            {editor.generateTemplates.map((tpl: any) => <MenuItem key={tpl.id} value={tpl.id}>{tpl.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button variant="outlined" sx={{ whiteSpace: 'nowrap' }} disabled={!editor.selectedTemplateId} onClick={() => editor.applyTemplate(editor.selectedTemplateId)}>重新套用</Button>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ minWidth: 0 }}>
                        <TextField label="最近章节参考数" type="number" value={editor.recentChapterCount} onChange={(e) => editor.setRecentChapterCount(Math.max(1, Number(e.target.value) || 1))} sx={{ flex: 1 }} inputProps={{ min: 1, max: 20 }} />
                        <TextField label="目标字数下限" type="number" value={editor.targetWordMin} onChange={(e) => editor.setTargetWordMin(Math.max(0, Number(e.target.value) || 0))} sx={{ flex: 1 }} />
                        <TextField label="目标字数上限" type="number" value={editor.targetWordMax} onChange={(e) => editor.setTargetWordMax(Math.max(0, Number(e.target.value) || 0))} sx={{ flex: 1 }} />
                      </Stack>
                      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Stack spacing={1.2}>
                            <Typography variant="subtitle2">生成反馈（用于下一次自动优化）</Typography>
                            <FormControl fullWidth size="small">
                              <InputLabel id="generate-feedback-rating-label">评分</InputLabel>
                              <Select labelId="generate-feedback-rating-label" label="评分" value={editor.generateFeedbackRating} onChange={(e) => editor.setGenerateFeedbackRating(String(e.target.value))}>
                                <MenuItem value="">未评分</MenuItem>
                                <MenuItem value="satisfied">满意</MenuItem>
                                <MenuItem value="neutral">一般</MenuItem>
                                <MenuItem value="unsatisfied">不满意</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField label="备注（可选）" value={editor.generateFeedbackNote} onChange={(e) => editor.setGenerateFeedbackNote(e.target.value)} multiline minRows={2} placeholder="例如：减少说教，战斗节奏更快，对话更自然。" fullWidth />
                            <Stack direction="row" justifyContent="flex-end"><Button size="small" variant="outlined" onClick={editor.saveGenerateFeedback}>保存反馈</Button></Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                      <Stack spacing={0}>
                        <FormControlLabel control={<Checkbox checked={editor.avoidTranslationTone} onChange={(e) => editor.setAvoidTranslationTone(e.target.checked)} />} label="避免翻译腔" />
                        <FormControlLabel control={<Checkbox checked={editor.avoidModernSlang} onChange={(e) => editor.setAvoidModernSlang(e.target.checked)} />} label="避免现代网络口语" />
                        <FormControlLabel control={<Checkbox checked={editor.keepPovConsistent} onChange={(e) => editor.setKeepPovConsistent(e.target.checked)} />} label="保持叙事视角一致" />
                        <FormControlLabel control={<Checkbox checked={editor.keepTenseConsistent} onChange={(e) => editor.setKeepTenseConsistent(e.target.checked)} />} label="保持时态一致" />
                      </Stack>
                      <Button variant="outlined" onClick={() => void editor.retryGenerate()} disabled={editor.generating || !editor.chapterInstruction.trim() || editor.volumeID <= 0 || editor.chapterNumber <= 0 || (editor.targetWordMin > 0 && editor.targetWordMax > 0 && editor.targetWordMin > editor.targetWordMax)}>重试生成</Button>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: 0 }}>
                        <Button variant="outlined" onClick={() => void editor.handleQuickRevise('polish')} disabled={editor.generating || !editor.chapterBody.trim()}>快速润色</Button>
                        <Button variant="outlined" onClick={() => void editor.handleQuickRevise('compress')} disabled={editor.generating || !editor.chapterBody.trim()}>快速压缩</Button>
                        <Button variant="outlined" onClick={() => void editor.handleQuickRevise('reflow')} disabled={editor.generating || !editor.chapterBody.trim()}>重排段落</Button>
                      </Stack>
                    </Stack>
                  )}

                  {editor.sidePanel === 'history' && (
                    <Stack spacing={1}>
                      {editor.generateHistory.length === 0 && <Typography variant="body2" color="text.secondary">暂无历史生成记录。</Typography>}
                      {editor.generateHistory.map((item: any, idx: number) => (
                        <Card key={`${item.createdAt}_${idx}`} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 1.5 }}>
                            <Stack spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.createdAt).toLocaleString('zh-CN')}{item.model ? ` · ${item.model}` : ''}{item.totalTokens ? ` · ${item.totalTokens} tokens` : ''}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475569' }}>指令：{item.instructionPreview || '（无）'}</Typography>
                              <Button size="small" variant="outlined" onClick={() => onOpenHistoryFill(idx)}>回填此版本</Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}

                  {editor.sidePanel === 'snapshot' && (
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="flex-end"><Button size="small" variant="outlined" onClick={editor.saveChapterSnapshot}>保存当前快照</Button></Stack>
                      {editor.chapterSnapshots.length === 0 && <Typography variant="body2" color="text.secondary">暂无章节快照。</Typography>}
                      {editor.chapterSnapshots.map((item: any, idx: number) => (
                        <Card key={`${item.createdAt}_${idx}`} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 1.5 }}>
                            <Stack spacing={1}>
                              <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString('zh-CN')} · 状态：{item.chapterStatus === 'draft' ? '草稿' : item.chapterStatus === 'review' ? '待审' : '定稿'}</Typography>
                              <Typography variant="body2" sx={{ color: '#475569' }}>标题：{item.chapterTitle || '（未命名）'}</Typography>
                              <Typography variant="body2" color="text.secondary">正文预览：{item.body.slice(0, 80) || '（空）'}</Typography>
                              <Button size="small" variant="outlined" onClick={() => editor.applyChapterSnapshot(idx)}>回填此快照</Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>

        <Stack spacing={0.8} sx={{ width: 88, flexShrink: 0, position: { lg: 'sticky' }, top: { lg: 110 } }}>
          <ChapterEditorSidePanelButtons sidePanel={editor.sidePanel} onToggle={(panel) => editor.setSidePanel((p: any) => (p === panel ? null : panel))} />
        </Stack>
      </Stack>
    </Box>
  )
}
