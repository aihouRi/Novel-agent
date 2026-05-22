import { useEffect, useMemo, useState } from 'react'
import { deleteChapter, exportNovel, listChapters, type Chapter, type ExportScope, updateChapter } from '../api/chapters'
import type { Character } from '../api/characters'
import { createVolume, listVolumes, type Volume, updateVolume } from '../api/volumes'

const DEFAULT_EXPORT_FROM = 1
const DEFAULT_EXPORT_TO = 1

type Notify = (text: string) => void

type Params = {
  token: string
  selectedNovelId: number | null
  characters: Character[]
  onNotifySuccess: Notify
  onNotifyError: Notify
  onRefreshNovels: () => Promise<void>
  active: boolean
}

export function useNovelsChapters({
  token,
  selectedNovelId,
  characters,
  onNotifySuccess,
  onNotifyError,
  onRefreshNovels,
  active,
}: Params) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [chapterLoading, setChapterLoading] = useState(false)
  const [chapterEditorTarget, setChapterEditorTarget] = useState<Chapter | null>(null)
  const [chapterEditorOpen, setChapterEditorOpen] = useState(false)
  const [confirmDeleteChapterId, setConfirmDeleteChapterId] = useState<number | null>(null)
  const [chapterSearch, setChapterSearch] = useState('')
  const [chapterSort, setChapterSort] = useState<'number_asc' | 'number_desc' | 'updated_desc'>('number_desc')
  const [chapterVolumeFilter, setChapterVolumeFilter] = useState<number>(0)
  const [chapterCharacterFilter, setChapterCharacterFilter] = useState<number>(0)
  const [chapterStatusFilter, setChapterStatusFilter] = useState<'all' | 'draft' | 'review' | 'final'>('all')
  const [movingChapterId, setMovingChapterId] = useState<number | null>(null)
  const [exportingMarkdown, setExportingMarkdown] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportScope, setExportScope] = useState<ExportScope>('all')
  const [exportStatus, setExportStatus] = useState<'all' | 'draft' | 'review' | 'final'>('all')
  const [exportVolumeID, setExportVolumeID] = useState<number>(0)
  const [exportFromChapter, setExportFromChapter] = useState<number>(DEFAULT_EXPORT_FROM)
  const [exportToChapter, setExportToChapter] = useState<number>(DEFAULT_EXPORT_TO)
  const [includeBody, setIncludeBody] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeOutline, setIncludeOutline] = useState(true)
  const [newVolumeTitle, setNewVolumeTitle] = useState('')
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)
  const [editingVolumeTitle, setEditingVolumeTitle] = useState('')

  const chapterToDelete = useMemo(() => chapters.find((c) => c.id === confirmDeleteChapterId) ?? null, [chapters, confirmDeleteChapterId])
  const nextChapterNumber = useMemo(() => (chapters.length === 0 ? 1 : Math.max(...chapters.map((c) => c.chapter_number)) + 1), [chapters])
  const chapterCharacterOptions = useMemo(
    () => [...characters].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    [characters],
  )
  const visibleChapters = useMemo(() => {
    const keyword = chapterSearch.trim().toLowerCase()
    const selectedCharacter = chapterCharacterOptions.find((c) => c.id === chapterCharacterFilter) ?? null
    const characterTokens = selectedCharacter
      ? [
          selectedCharacter.name,
          ...selectedCharacter.aliases
            .split(/[，,、\s]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        ]
      : []
    const filtered = chapters.filter((c) => {
      if (chapterVolumeFilter > 0 && c.volume_id !== chapterVolumeFilter) return false
      if (chapterStatusFilter !== 'all' && c.status !== chapterStatusFilter) return false
      const chapterText = `${c.title} ${c.summary} ${c.body}`.toLowerCase()
      const keywordMatched =
        !keyword ||
        chapterText.includes(keyword) ||
        c.chapter_number.toString().includes(keyword)
      if (!keywordMatched) return false
      if (characterTokens.length === 0) return true
      return characterTokens.some((token) => token && chapterText.includes(token.toLowerCase()))
    })
    if (chapterSort === 'number_asc') return filtered.sort((a, b) => a.chapter_number - b.chapter_number)
    if (chapterSort === 'number_desc') return filtered.sort((a, b) => b.chapter_number - a.chapter_number)
    return filtered.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [chapters, chapterSearch, chapterSort, chapterVolumeFilter, chapterCharacterFilter, chapterCharacterOptions, chapterStatusFilter])

  const groupedChapters = useMemo(() => {
    const byVolume = new Map<number, Chapter[]>()
    for (const c of visibleChapters) {
      const list = byVolume.get(c.volume_id) ?? []
      list.push(c)
      byVolume.set(c.volume_id, list)
    }
    return volumes.map((v) => ({ volume: v, chapters: byVolume.get(v.id) ?? [] }))
  }, [visibleChapters, volumes])

  const novelTotalWordCount = useMemo(
    () => chapters.reduce((sum, c) => sum + (Number.isFinite(c.word_count) ? c.word_count : 0), 0),
    [chapters],
  )

  useEffect(() => {
    if (volumes.length > 0 && exportVolumeID <= 0) setExportVolumeID(volumes[0].id)
  }, [exportVolumeID, volumes])

  useEffect(() => {
    if (!active) {
      setChapterEditorOpen(false)
      setChapterEditorTarget(null)
    }
  }, [active])

  async function refreshChapters(novelId: number) {
    setChapterLoading(true)
    try {
      const data = await listChapters(token, novelId)
      setChapters(data.chapters)
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '加载章节失败')
    } finally {
      setChapterLoading(false)
    }
  }

  async function refreshChaptersForWordCount(novelId: number) {
    const data = await listChapters(token, novelId)
    return data.chapters
  }

  async function refreshVolumes(novelId: number) {
    try {
      setVolumes((await listVolumes(token, novelId)).volumes)
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '加载分卷失败')
    }
  }

  async function handleChapterSaved() {
    if (!selectedNovelId) return
    await refreshChapters(selectedNovelId)
    await refreshVolumes(selectedNovelId)
    await onRefreshNovels()
  }

  async function handleCreateVolume() {
    if (!selectedNovelId) return
    const cleanTitle = newVolumeTitle.trim()
    if (!cleanTitle) {
      onNotifyError('卷名不能为空。')
      return
    }
    const nextNumber = volumes.length === 0 ? 1 : Math.max(...volumes.map((v) => v.volume_number)) + 1
    try {
      await createVolume(token, selectedNovelId, { volume_number: nextNumber, title: cleanTitle })
      setNewVolumeTitle('')
      await refreshVolumes(selectedNovelId)
      onNotifySuccess('分卷已创建。')
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '创建分卷失败')
    }
  }

  function openEditVolume(volume: Volume) {
    setEditingVolume(volume)
    setEditingVolumeTitle(volume.title)
  }

  function closeEditVolume() {
    setEditingVolume(null)
    setEditingVolumeTitle('')
  }

  async function handleUpdateVolume() {
    if (!selectedNovelId || !editingVolume) return
    const cleanTitle = editingVolumeTitle.trim()
    if (!cleanTitle) {
      onNotifyError('卷名不能为空。')
      return
    }
    try {
      await updateVolume(token, selectedNovelId, editingVolume.id, {
        volume_number: editingVolume.volume_number,
        title: cleanTitle,
      })
      await refreshVolumes(selectedNovelId)
      onNotifySuccess('卷名已更新。')
      closeEditVolume()
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '更新卷名失败')
    }
  }

  async function handleMoveChapterVolume(chapter: Chapter, nextVolumeID: number) {
    if (!selectedNovelId || chapter.volume_id === nextVolumeID) return
    setMovingChapterId(chapter.id)
    try {
      await updateChapter(token, selectedNovelId, chapter.id, {
        volume_id: nextVolumeID,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        body: chapter.body,
        word_count: chapter.word_count,
        generation_instruction: chapter.generation_instruction,
        outline: chapter.outline,
        summary: chapter.summary,
        status: chapter.status,
      })
      await refreshChapters(selectedNovelId)
      onNotifySuccess('章节分卷已更新。')
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '移动章节分卷失败')
    } finally {
      setMovingChapterId(null)
    }
  }

  async function confirmDeleteChapter() {
    if (!confirmDeleteChapterId || !selectedNovelId) return
    const id = confirmDeleteChapterId
    setConfirmDeleteChapterId(null)
    setChapterLoading(true)
    try {
      await deleteChapter(token, selectedNovelId, id)
      onNotifySuccess('章节已删除。')
      await refreshChapters(selectedNovelId)
      await onRefreshNovels()
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '删除章节失败')
    } finally {
      setChapterLoading(false)
    }
  }

  async function handleUpdateChapterStatus(chapter: Chapter, status: 'draft' | 'review' | 'final') {
    if (!selectedNovelId || chapter.status === status) return
    setMovingChapterId(chapter.id)
    try {
      await updateChapter(token, selectedNovelId, chapter.id, {
        volume_id: chapter.volume_id,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        body: chapter.body,
        word_count: chapter.word_count,
        generation_instruction: chapter.generation_instruction,
        outline: chapter.outline,
        summary: chapter.summary,
        status,
      })
      await refreshChapters(selectedNovelId)
      onNotifySuccess('章节状态已更新。')
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '更新章节状态失败')
    } finally {
      setMovingChapterId(null)
    }
  }

  async function handleExportMarkdown() {
    if (!selectedNovelId) return
    if (!includeBody && !includeSummary && !includeOutline) {
      onNotifyError('请至少选择一种导出内容。')
      return
    }
    if (exportScope === 'volume' && exportVolumeID <= 0) {
      onNotifyError('请选择分卷。')
      return
    }
    if (exportScope === 'chapter_range' && (exportFromChapter <= 0 || exportToChapter <= 0 || exportFromChapter > exportToChapter)) {
      onNotifyError('请输入有效的章节区间。')
      return
    }

    setExportingMarkdown(true)
    try {
      const { blob, filename } = await exportNovel(token, selectedNovelId, {
        format: 'markdown',
        scope: exportScope,
        status: exportStatus,
        volume_id: exportScope === 'volume' ? exportVolumeID : undefined,
        from_chapter: exportScope === 'chapter_range' ? exportFromChapter : undefined,
        to_chapter: exportScope === 'chapter_range' ? exportToChapter : undefined,
        include_body: includeBody,
        include_summary: includeSummary,
        include_outline: includeOutline,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      onNotifySuccess('Markdown 导出成功。')
      setExportDialogOpen(false)
    } catch (e) {
      onNotifyError(e instanceof Error ? e.message : '导出 Markdown 失败')
    } finally {
      setExportingMarkdown(false)
    }
  }

  return {
    chapters,
    volumes,
    chapterLoading,
    chapterEditorTarget,
    chapterEditorOpen,
    confirmDeleteChapterId,
    chapterSearch,
    chapterSort,
    chapterVolumeFilter,
    chapterCharacterFilter,
    chapterStatusFilter,
    chapterCharacterOptions,
    movingChapterId,
    exportingMarkdown,
    exportDialogOpen,
    exportScope,
    exportStatus,
    exportVolumeID,
    exportFromChapter,
    exportToChapter,
    includeBody,
    includeSummary,
    includeOutline,
    newVolumeTitle,
    editingVolume,
    editingVolumeTitle,
    chapterToDelete,
    nextChapterNumber,
    visibleChapters,
    groupedChapters,
    novelTotalWordCount,
    setChapterEditorTarget,
    setChapterEditorOpen,
    setConfirmDeleteChapterId,
    setChapterSearch,
    setChapterSort,
    setChapterVolumeFilter,
    setChapterCharacterFilter,
    setChapterStatusFilter,
    setExportDialogOpen,
    setExportScope,
    setExportStatus,
    setExportVolumeID,
    setExportFromChapter,
    setExportToChapter,
    setIncludeBody,
    setIncludeSummary,
    setIncludeOutline,
    setNewVolumeTitle,
    setEditingVolumeTitle,
    refreshChapters,
    refreshChaptersForWordCount,
    refreshVolumes,
    handleChapterSaved,
    handleCreateVolume,
    openEditVolume,
    closeEditVolume,
    handleUpdateVolume,
    handleMoveChapterVolume,
    handleUpdateChapterStatus,
    confirmDeleteChapter,
    handleExportMarkdown,
  }
}
