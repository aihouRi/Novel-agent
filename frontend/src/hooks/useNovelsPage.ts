import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { createNovel, deleteNovel, listNovels, type Novel, updateNovel } from '../api/novels'
import { deleteCharacter, listCharacters, type Character } from '../api/characters'
import { deleteChapter, exportNovel, listChapters, type Chapter, type ExportScope, updateChapter } from '../api/chapters'
import { createVolume, listVolumes, type Volume, updateVolume } from '../api/volumes'
import type { MainTab, MyNovelTab } from '../components/novels/NovelSidebar'

const DEFAULT_LANGUAGE = 'zh-CN'
const DEFAULT_RECENT_COUNT = 3

export function useNovelsPage(token: string, onLogout: () => void) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [novelWordCounts, setNovelWordCounts] = useState<Record<number, number>>({})
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)

  const [mainTab, setMainTab] = useState<MainTab>('myNovels')
  const [myNovelsExpanded, setMyNovelsExpanded] = useState(true)
  const [myNovelTab, setMyNovelTab] = useState<MyNovelTab>('novelDetail')

  const [showNovelEditor, setShowNovelEditor] = useState(false)
  const [showCharacterManager, setShowCharacterManager] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [chapterLoading, setChapterLoading] = useState(false)
  const [chapterEditorTarget, setChapterEditorTarget] = useState<Chapter | null>(null)
  const [chapterEditorOpen, setChapterEditorOpen] = useState(false)
  const [confirmDeleteChapterId, setConfirmDeleteChapterId] = useState<number | null>(null)
  const [chapterSearch, setChapterSearch] = useState('')
  const [chapterSort, setChapterSort] = useState<'number_asc' | 'number_desc' | 'updated_desc'>('number_desc')
  const [movingChapterId, setMovingChapterId] = useState<number | null>(null)
  const [exportingMarkdown, setExportingMarkdown] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportScope, setExportScope] = useState<ExportScope>('all')
  const [exportVolumeID, setExportVolumeID] = useState<number>(0)
  const [exportFromChapter, setExportFromChapter] = useState<number>(1)
  const [exportToChapter, setExportToChapter] = useState<number>(1)
  const [includeBody, setIncludeBody] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeOutline, setIncludeOutline] = useState(true)
  const [newVolumeTitle, setNewVolumeTitle] = useState('')
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null)
  const [editingVolumeTitle, setEditingVolumeTitle] = useState('')

  const [characters, setCharacters] = useState<Character[]>([])
  const [characterLoading, setCharacterLoading] = useState(false)
  const [confirmDeleteCharacterId, setConfirmDeleteCharacterId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [styleProfile, setStyleProfile] = useState('')
  const [worldview, setWorldview] = useState('')
  const [powerSystem, setPowerSystem] = useState('')
  const [mainPlot, setMainPlot] = useState('')
  const [writingRules, setWritingRules] = useState('')
  const [forbiddenRules, setForbiddenRules] = useState('')
  const [recentChapterCount, setRecentChapterCount] = useState(DEFAULT_RECENT_COUNT)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorOpen, setErrorOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const selectedNovel = useMemo(() => novels.find((n) => n.id === selectedNovelId) ?? null, [novels, selectedNovelId])
  const chapterToDelete = useMemo(() => chapters.find((c) => c.id === confirmDeleteChapterId) ?? null, [chapters, confirmDeleteChapterId])
  const nextChapterNumber = useMemo(() => (chapters.length === 0 ? 1 : Math.max(...chapters.map((c) => c.chapter_number)) + 1), [chapters])
  const visibleChapters = useMemo(() => {
    const keyword = chapterSearch.trim().toLowerCase()
    const filtered = chapters.filter((c) => {
      if (!keyword) return true
      return c.title.toLowerCase().includes(keyword) || c.chapter_number.toString().includes(keyword)
    })
    if (chapterSort === 'number_asc') return filtered.sort((a, b) => a.chapter_number - b.chapter_number)
    if (chapterSort === 'number_desc') return filtered.sort((a, b) => b.chapter_number - a.chapter_number)
    return filtered.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  }, [chapters, chapterSearch, chapterSort])
  const groupedChapters = useMemo(() => {
    const byVolume = new Map<number, Chapter[]>()
    for (const c of visibleChapters) {
      const list = byVolume.get(c.volume_id) ?? []
      list.push(c)
      byVolume.set(c.volume_id, list)
    }
    return volumes.map((v) => ({ volume: v, chapters: byVolume.get(v.id) ?? [] }))
  }, [visibleChapters, volumes])
  const novelTotalWordCount = useMemo(() => chapters.reduce((sum, c) => sum + (Number.isFinite(c.word_count) ? c.word_count : 0), 0), [chapters])

  function formatNovelMeta(novel: Novel): string {
    const parts: string[] = [novel.genre || 'No genre']
    if (novel.language && novel.language !== DEFAULT_LANGUAGE) parts.push(novel.language)
    parts.push(`${(novelWordCounts[novel.id] ?? 0).toLocaleString()} 字`)
    return parts.join(' · ')
  }

  useEffect(() => { void refreshNovels() }, [])
  useEffect(() => { if (selectedNovel) fillForm(selectedNovel) }, [selectedNovelId, novels])
  useEffect(() => {
    if (mainTab === 'myNovels' && myNovelTab === 'novelCharacters' && selectedNovelId) void refreshCharacters(selectedNovelId)
    if (mainTab === 'myNovels' && myNovelTab === 'novelChapters' && selectedNovelId) {
      void refreshChapters(selectedNovelId)
      void refreshVolumes(selectedNovelId)
      void refreshCharacters(selectedNovelId)
    }
  }, [mainTab, myNovelTab, selectedNovelId])
  useEffect(() => { if (volumes.length > 0 && exportVolumeID <= 0) setExportVolumeID(volumes[0].id) }, [exportVolumeID, volumes])
  useEffect(() => { if (error) setErrorOpen(true) }, [error])
  useEffect(() => {
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelDetail') setShowNovelEditor(false)
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelCharacters') setShowCharacterManager(false)
    if (mainTab !== 'myNovels' || myNovelTab !== 'novelChapters') {
      setChapterEditorOpen(false)
      setChapterEditorTarget(null)
    }
  }, [mainTab, myNovelTab])

  function notifySuccess(text: string) { setError(''); setMessage(text); setSuccessOpen(true) }
  function notifyError(text: string) { setMessage(''); setError(text) }

  async function refreshNovels() {
    setLoading(true)
    setError('')
    try {
      const data = await listNovels(token)
      setNovels(data.novels)
      void refreshNovelWordCounts(data.novels)
      if (!selectedNovelId && data.novels.length > 0) setSelectedNovelId(data.novels[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load novels')
    } finally { setLoading(false) }
  }

  async function refreshNovelWordCounts(novelList: Novel[]) {
    if (novelList.length === 0) return setNovelWordCounts({})
    const entries = await Promise.all(novelList.map(async (novel) => {
      try {
        const data = await listChapters(token, novel.id)
        const total = data.chapters.reduce((sum, c) => sum + (Number.isFinite(c.word_count) ? c.word_count : 0), 0)
        return [novel.id, total] as const
      } catch { return [novel.id, 0] as const }
    }))
    setNovelWordCounts(Object.fromEntries(entries))
  }

  async function refreshCharacters(novelId: number) {
    setCharacterLoading(true)
    try {
      const data = await listCharacters(token, novelId)
      setCharacters(data.characters)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load characters') }
    finally { setCharacterLoading(false) }
  }

  async function refreshChapters(novelId: number) {
    setChapterLoading(true)
    try {
      const data = await listChapters(token, novelId)
      setChapters(data.chapters)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load chapters') }
    finally { setChapterLoading(false) }
  }

  async function refreshVolumes(novelId: number) {
    try { setVolumes((await listVolumes(token, novelId)).volumes) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load volumes') }
  }

  async function handleChapterSaved() {
    if (!selectedNovelId) return
    await refreshChapters(selectedNovelId)
    await refreshVolumes(selectedNovelId)
    await refreshNovels()
  }

  async function handleCreateVolume() {
    if (!selectedNovelId) return
    const cleanTitle = newVolumeTitle.trim()
    if (!cleanTitle) return notifyError('卷名不能为空。')
    const nextNumber = volumes.length === 0 ? 1 : Math.max(...volumes.map((v) => v.volume_number)) + 1
    try {
      await createVolume(token, selectedNovelId, { volume_number: nextNumber, title: cleanTitle })
      setNewVolumeTitle('')
      await refreshVolumes(selectedNovelId)
      notifySuccess('Volume created.')
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to create volume') }
  }

  function openEditVolume(volume: Volume) { setEditingVolume(volume); setEditingVolumeTitle(volume.title) }
  function closeEditVolume() { setEditingVolume(null); setEditingVolumeTitle('') }

  async function handleUpdateVolume() {
    if (!selectedNovelId || !editingVolume) return
    const cleanTitle = editingVolumeTitle.trim()
    if (!cleanTitle) return notifyError('卷名不能为空。')
    try {
      await updateVolume(token, selectedNovelId, editingVolume.id, { volume_number: editingVolume.volume_number, title: cleanTitle })
      await refreshVolumes(selectedNovelId)
      notifySuccess('卷名已更新。')
      closeEditVolume()
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to update volume') }
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
      })
      await refreshChapters(selectedNovelId)
      notifySuccess('章节分卷已更新。')
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to move chapter volume') }
    finally { setMovingChapterId(null) }
  }

  async function handleExportMarkdown() {
    if (!selectedNovelId) return
    if (!includeBody && !includeSummary && !includeOutline) return notifyError('请至少选择一种导出内容。')
    if (exportScope === 'volume' && exportVolumeID <= 0) return notifyError('请选择分卷。')
    if (exportScope === 'chapter_range' && (exportFromChapter <= 0 || exportToChapter <= 0 || exportFromChapter > exportToChapter)) {
      return notifyError('请输入有效的章节区间。')
    }
    setExportingMarkdown(true)
    try {
      const { blob, filename } = await exportNovel(token, selectedNovelId, {
        format: 'markdown', scope: exportScope,
        volume_id: exportScope === 'volume' ? exportVolumeID : undefined,
        from_chapter: exportScope === 'chapter_range' ? exportFromChapter : undefined,
        to_chapter: exportScope === 'chapter_range' ? exportToChapter : undefined,
        include_body: includeBody, include_summary: includeSummary, include_outline: includeOutline,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      notifySuccess('Markdown 导出成功。')
      setExportDialogOpen(false)
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to export markdown') }
    finally { setExportingMarkdown(false) }
  }

  function fillForm(novel: Novel) {
    setTitle(novel.title); setGenre(novel.genre); setLanguage(novel.language || DEFAULT_LANGUAGE)
    setStyleProfile(novel.style_profile); setWorldview(novel.worldview); setPowerSystem(novel.power_system)
    setMainPlot(novel.main_plot); setWritingRules(novel.writing_rules); setForbiddenRules(novel.forbidden_rules)
    setRecentChapterCount(novel.recent_chapter_count || DEFAULT_RECENT_COUNT)
  }

  function resetForm() {
    setTitle(''); setGenre(''); setLanguage(DEFAULT_LANGUAGE); setStyleProfile(''); setWorldview('')
    setPowerSystem(''); setMainPlot(''); setWritingRules(''); setForbiddenRules(''); setRecentChapterCount(DEFAULT_RECENT_COUNT)
  }

  function currentPayload() {
    return {
      title: title.trim(), genre: genre.trim(), language: language.trim() || DEFAULT_LANGUAGE,
      style_profile: styleProfile.trim(), worldview: worldview.trim(), power_system: powerSystem.trim(),
      main_plot: mainPlot.trim(), writing_rules: writingRules.trim(), forbidden_rules: forbiddenRules.trim(),
      recent_chapter_count: recentChapterCount > 0 ? recentChapterCount : DEFAULT_RECENT_COUNT,
    }
  }

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true); setError(''); setMessage('')
    try {
      const data = await createNovel(token, currentPayload())
      setNovels((prev) => [data.novel, ...prev]); setSelectedNovelId(data.novel.id)
      setMainTab('myNovels'); setMyNovelsExpanded(true); setMyNovelTab('novelDetail'); setShowNovelEditor(false)
      notifySuccess('Novel created.'); fillForm(data.novel)
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to create novel') }
    finally { setLoading(false) }
  }

  async function handleUpdate() {
    if (!selectedNovelId || !title.trim()) return
    setLoading(true); setError(''); setMessage('')
    try {
      const data = await updateNovel(token, selectedNovelId, currentPayload())
      setNovels((prev) => prev.map((n) => (n.id === selectedNovelId ? data.novel : n)))
      notifySuccess('Novel updated.'); setShowNovelEditor(false)
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to update novel') }
    finally { setLoading(false) }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setLoading(true); setError(''); setMessage('')
    try {
      await deleteNovel(token, id)
      const next = novels.filter((n) => n.id !== id)
      setNovels(next); setSelectedNovelId(next.length > 0 ? next[0].id : null)
      notifySuccess('Novel deleted.'); setShowNovelEditor(false)
      if (next.length > 0) fillForm(next[0]); else resetForm()
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to delete novel') }
    finally { setLoading(false) }
  }

  async function confirmDeleteCharacter() {
    if (!confirmDeleteCharacterId || !selectedNovelId) return
    const id = confirmDeleteCharacterId
    setConfirmDeleteCharacterId(null)
    setCharacterLoading(true); setError(''); setMessage('')
    try {
      await deleteCharacter(token, selectedNovelId, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      notifySuccess('Character deleted.')
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to delete character') }
    finally { setCharacterLoading(false) }
  }

  async function confirmDeleteChapter() {
    if (!confirmDeleteChapterId || !selectedNovelId) return
    const id = confirmDeleteChapterId
    setConfirmDeleteChapterId(null)
    setChapterLoading(true); setError(''); setMessage('')
    try {
      await deleteChapter(token, selectedNovelId, id)
      notifySuccess('Chapter deleted.')
      await refreshChapters(selectedNovelId)
      await refreshNovels()
    } catch (e) { notifyError(e instanceof Error ? e.message : 'Failed to delete chapter') }
    finally { setChapterLoading(false) }
  }

  function openMenu(event: MouseEvent<HTMLElement>) { setMenuAnchor(event.currentTarget) }
  function closeMenu() { setMenuAnchor(null) }
  function clickSettings() { closeMenu(); notifySuccess('User settings will be available in a later phase.') }
  function clickLogout() { closeMenu(); onLogout() }

  return {
    novels,
    selectedNovelId,
    selectedNovel,
    mainTab,
    myNovelsExpanded,
    myNovelTab,
    showNovelEditor,
    showCharacterManager,
    editingCharacter,
    chapters,
    volumes,
    chapterLoading,
    chapterEditorTarget,
    chapterEditorOpen,
    confirmDeleteChapterId,
    chapterSearch,
    chapterSort,
    movingChapterId,
    exportingMarkdown,
    exportDialogOpen,
    exportScope,
    exportVolumeID,
    exportFromChapter,
    exportToChapter,
    includeBody,
    includeSummary,
    includeOutline,
    newVolumeTitle,
    editingVolume,
    editingVolumeTitle,
    characters,
    characterLoading,
    confirmDeleteCharacterId,
    title,
    genre,
    language,
    styleProfile,
    worldview,
    powerSystem,
    mainPlot,
    writingRules,
    forbiddenRules,
    recentChapterCount,
    loading,
    error,
    errorOpen,
    message,
    successOpen,
    menuAnchor,
    confirmDeleteId,
    chapterToDelete,
    nextChapterNumber,
    visibleChapters,
    groupedChapters,
    novelTotalWordCount,
    formatNovelMeta,
    setSelectedNovelId,
    setMainTab,
    setMyNovelsExpanded,
    setMyNovelTab,
    setShowNovelEditor,
    setShowCharacterManager,
    setEditingCharacter,
    setChapterEditorTarget,
    setChapterEditorOpen,
    setConfirmDeleteChapterId,
    setChapterSearch,
    setChapterSort,
    setExportDialogOpen,
    setExportScope,
    setExportVolumeID,
    setExportFromChapter,
    setExportToChapter,
    setIncludeBody,
    setIncludeSummary,
    setIncludeOutline,
    setNewVolumeTitle,
    setEditingVolumeTitle,
    setConfirmDeleteCharacterId,
    setTitle,
    setGenre,
    setLanguage,
    setStyleProfile,
    setWorldview,
    setPowerSystem,
    setMainPlot,
    setWritingRules,
    setForbiddenRules,
    setRecentChapterCount,
    setErrorOpen,
    setSuccessOpen,
    setConfirmDeleteId,
    notifySuccess,
    notifyError,
    refreshCharacters,
    refreshChapters,
    refreshVolumes,
    handleChapterSaved,
    handleCreateVolume,
    openEditVolume,
    closeEditVolume,
    handleUpdateVolume,
    handleMoveChapterVolume,
    handleExportMarkdown,
    resetForm,
    handleCreate,
    handleUpdate,
    confirmDelete,
    confirmDeleteCharacter,
    confirmDeleteChapter,
    openMenu,
    closeMenu,
    clickSettings,
    clickLogout,
  }
}
