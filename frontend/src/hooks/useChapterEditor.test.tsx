import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChapterEditor } from './useChapterEditor'
import { createChapter, generateChapter, updateChapter } from '../api/chapters'

vi.mock('../api/chapters', () => ({
  createChapter: vi.fn(),
  updateChapter: vi.fn(),
  generateChapter: vi.fn(),
}))

const mockedCreateChapter = vi.mocked(createChapter)
const mockedUpdateChapter = vi.mocked(updateChapter)
const mockedGenerateChapter = vi.mocked(generateChapter)

function createParams(): any {
  return {
    token: 'token',
    novelId: 3,
    initialChapter: null,
    defaultChapterNumber: 1,
    volumes: [{ id: 11, novel_id: 3, volume_number: 1, title: '第一卷', created_at: '', updated_at: '' }],
    characters: [{
      id: 21,
      novel_id: 3,
      name: '李元',
      aliases: '',
      role: '主角',
      personality: '',
      realm_or_ability: '',
      goal: '',
      relationships: '',
      speech_style: '',
      first_appearance_chapter: 1,
      last_appearance_chapter: 1,
      memo: '',
      importance_level: 9,
      created_at: '',
      updated_at: '',
    }],
    loreEntries: [{
      id: 31,
      novel_id: 3,
      category: 'artifact' as const,
      name: '天珠',
      description: '神秘法器',
      rules_or_limits: '',
      tags: '法器',
      character_ids: [21],
      created_at: '',
      updated_at: '',
    }],
    recentChapterCountDefault: 3,
    onNotifySuccess: vi.fn(),
    onNotifyError: vi.fn(),
    onSaved: vi.fn(async () => {}),
    onBack: vi.fn(),
  }
}

describe('useChapterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('生成失败后应显示错误并允许重试', async () => {
    mockedGenerateChapter.mockRejectedValueOnce(new Error('生成失败'))
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(result.current.localError).toBe('生成失败')
      expect(result.current.canRetryGenerate).toBe(true)
    })
  })

  it('保存失败不应保留生成重试状态', async () => {
    mockedGenerateChapter.mockRejectedValueOnce(new Error('生成失败'))
    mockedCreateChapter.mockRejectedValueOnce(new Error('保存失败'))
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    expect(result.current.canRetryGenerate).toBe(true)

    await act(async () => {
      await result.current.handleSave()
    })

    await waitFor(() => {
      expect(result.current.localError).toBe('保存失败')
      expect(result.current.canRetryGenerate).toBe(false)
    })
  })

  it('生成请求应带上 lore_entry_ids 且成功后重试状态为 false', async () => {
    mockedGenerateChapter.mockResolvedValueOnce({
      outline: '大纲',
      body: '正文',
      summary: '总结',
    })
    const params = createParams()

    const { result } = renderHook(() => useChapterEditor(params))

    act(() => {
      result.current.setChapterInstruction('继续推进剧情')
      result.current.setSelectedCharacterIDs([21])
      result.current.setSelectedLoreEntryIDs([31])
    })

    await act(async () => {
      await result.current.handleGenerate()
    })

    await waitFor(() => {
      expect(mockedGenerateChapter).toHaveBeenCalledTimes(1)
      expect(mockedGenerateChapter.mock.calls[0][2]).toMatchObject({
        character_ids: [21],
        lore_entry_ids: [31],
        target_word_min: 1800,
        target_word_max: 2600,
        avoid_translation_tone: true,
        avoid_modern_slang: true,
        keep_pov_consistent: true,
        keep_tense_consistent: true,
        recent_chapter_count: 3,
      })
      expect(result.current.canRetryGenerate).toBe(false)
      expect(result.current.localSuccess).toContain('AI 生成完成')
    })
  })

  it('编辑模式保存时应调用 updateChapter', async () => {
    mockedUpdateChapter.mockResolvedValueOnce({
      chapter: {
        id: 1,
        novel_id: 3,
        volume_id: 11,
        chapter_number: 1,
        title: '第1章',
        body: '正文',
        word_count: 2,
        generation_instruction: '',
        outline: '',
        summary: '',
        created_at: '',
        updated_at: '',
      },
    })

    const params = createParams()
    params.initialChapter = {
      id: 1,
      novel_id: 3,
      volume_id: 11,
      chapter_number: 1,
      title: '第1章',
      body: '　　正文',
      word_count: 2,
      generation_instruction: '',
      outline: '',
      summary: '',
      created_at: '',
      updated_at: '',
    }

    const { result } = renderHook(() => useChapterEditor(params))

    await act(async () => {
      await result.current.handleSave()
    })

    expect(mockedUpdateChapter).toHaveBeenCalledTimes(1)
  })
})
